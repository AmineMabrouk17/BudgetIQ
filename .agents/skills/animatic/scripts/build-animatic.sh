#!/usr/bin/env bash
# build-animatic.sh -- deterministic media + storyboard builder for the /animatic skill.
#
# What it does
#   1. Takes up to 8 prepared PNG frames (from Playwright) plus optional captions.
#   2. Burns the captions into the frames (route name, BEFORE/AFTER label) with ffmpeg.
#   3. Stitches them into animatic.webm (VP9) and animatic.gif at <= 12 fps,
#      <= 720 px wide and <= 5 MB per file, shrinking settings if needed.
#   4. Always writes a self-contained storyboard.svg. With no frames it builds a
#      source-derived SVG storyboard from the changed files (git diff main...HEAD
#      by default) and generates labelled text panels so the media still exists.
#   5. Writes PR_BODY_ANIMATIC.md, a GitHub-flavoured markdown snippet.
#
# No API keys, no network calls, no app source edits. ffmpeg is the only hard
# dependency. If ffmpeg (or drawtext) is missing the script degrades gracefully:
# it still writes the SVG storyboard and the PR snippet with a clear note.
#
# Usage
#   build-animatic.sh --out docs/media/my-slug \
#     [--frames /tmp/animatic-frames] [--captions /tmp/animatic-captions.txt] \
#     [--sources /tmp/animatic-sources.txt] [--slug my-slug] \
#     [--fps 8] [--width 720] [--max-bytes 5000000] \
#     [--worktree /tmp/animatic-worktree-xxx] [--kill-pid 12345] \
#     [--kill-pid 12346] [--storyboard-only]
#
# Frame filenames are sorted lexically, so name them 01-..., 02-... etc.
# Captions are one line per frame, in the same order. Sources are one path per
# line; when --sources is omitted the script uses `git diff --name-only main...HEAD`.

set -uo pipefail

warn() { printf 'WARNING: %s\n' "$*" >&2; }
die() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }

OUT=""
FRAMES=""
CAPTIONS=""
SOURCES=""
SLUG=""
FPS=8
WIDTH=720
MAX_BYTES=5000000
STORYBOARD_ONLY=0
WORKTREE=""
KILL_PIDS=()

usage() { sed -n '2,27p' "$0"; }

while (( $# > 0 )); do
  case "$1" in
    --out)              (( $# >= 2 )) || die "--out needs a value"; OUT="$2"; shift 2 ;;
    --frames)           (( $# >= 2 )) || die "--frames needs a value"; FRAMES="$2"; shift 2 ;;
    --captions)         (( $# >= 2 )) || die "--captions needs a value"; CAPTIONS="$2"; shift 2 ;;
    --sources)          (( $# >= 2 )) || die "--sources needs a value"; SOURCES="$2"; shift 2 ;;
    --slug)             (( $# >= 2 )) || die "--slug needs a value"; SLUG="$2"; shift 2 ;;
    --fps)              (( $# >= 2 )) || die "--fps needs a value"; FPS="$2"; shift 2 ;;
    --width)            (( $# >= 2 )) || die "--width needs a value"; WIDTH="$2"; shift 2 ;;
    --max-bytes)        (( $# >= 2 )) || die "--max-bytes needs a value"; MAX_BYTES="$2"; shift 2 ;;
    --worktree)         (( $# >= 2 )) || die "--worktree needs a value"; WORKTREE="$2"; shift 2 ;;
    --kill-pid)         (( $# >= 2 )) || die "--kill-pid needs a value"; KILL_PIDS+=("$2"); shift 2 ;;
    --storyboard-only)  STORYBOARD_ONLY=1; shift ;;
    -h|--help)          usage; exit 0 ;;
    *) die "unknown argument: $1 (try --help)" ;;
  esac
done

[[ -n "$OUT" ]] || die "--out is required (e.g. docs/media/my-slug)"

# --- clamp deterministic limits -------------------------------------------
[[ "$FPS" =~ ^[0-9]+$ ]] || FPS=8
[[ "$WIDTH" =~ ^[0-9]+$ ]] || WIDTH=720
[[ "$MAX_BYTES" =~ ^[0-9]+$ ]] || MAX_BYTES=5000000
(( FPS < 1 )) && FPS=1
(( FPS > 12 )) && FPS=12
(( WIDTH < 320 )) && WIDTH=320
(( WIDTH > 720 )) && WIDTH=720
HEIGHT=$(( WIDTH * 5 / 8 ))          # 16:10, matching 1280x800 desktop shots
(( HEIGHT % 2 )) && HEIGHT=$(( HEIGHT + 1 ))
MAX_FRAMES=8

SLUG="${SLUG:-$(basename "$OUT")}"
SLUG="$(printf '%s' "$SLUG" | tr -c 'A-Za-z0-9._-' '-')"
[[ -n "$SLUG" ]] || SLUG="animatic"

mkdir -p "$OUT" || die "cannot create output directory: $OUT"

TMP="$(mktemp -d "${TMPDIR:-/tmp}/animatic.XXXXXX")" || die "cannot create temp directory"

# --- cleanup: dev servers and the temporary git worktree we were told about --
cleanup() {
  local pid
  for pid in "${KILL_PIDS[@]:-}"; do
    [[ "$pid" =~ ^[0-9]+$ ]] || continue
    (( pid > 1 )) && (( pid != $$ )) || continue
    kill -TERM "$pid" 2>/dev/null || true
    for _ in 1 2 3 4 5; do
      kill -0 "$pid" 2>/dev/null || break
      sleep 0.2
    done
    kill -KILL "$pid" 2>/dev/null || true
  done
  if [[ -n "$WORKTREE" && -d "$WORKTREE" ]]; then
    case "$WORKTREE" in
      "${TMPDIR:-/tmp}"/*animatic*)
        git worktree remove --force -- "$WORKTREE" >/dev/null 2>&1 || rm -rf -- "$WORKTREE"
        git worktree prune >/dev/null 2>&1 || true
        ;;
      *) warn "refusing to remove unexpected worktree path: $WORKTREE" ;;
    esac
  fi
  rm -rf -- "$TMP"
}
trap cleanup EXIT

HAVE_FFMPEG=0
HAVE_DRAWTEXT=0
if command -v ffmpeg >/dev/null 2>&1; then
  HAVE_FFMPEG=1
  if ffmpeg -hide_banner -filters 2>/dev/null | grep -qE '[[:space:]]drawtext[[:space:]]'; then
    HAVE_DRAWTEXT=1
  fi
else
  warn "ffmpeg not found on PATH; writing storyboard.svg and PR snippet only"
fi

FONT_FILE=""
for candidate in \
  /usr/share/fonts/truetype/dejavu/DejaVuSans.ttf \
  /usr/share/fonts/truetype/freefont/FreeSans.ttf \
  /usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf; do
  if [[ -f "$candidate" ]]; then FONT_FILE="$candidate"; break; fi
done

# --- collect inputs ---------------------------------------------------------
FRAME_LIST=()
if [[ -n "$FRAMES" && -d "$FRAMES" ]]; then
  while IFS= read -r f; do FRAME_LIST+=("$f"); done < <(
    find "$FRAMES" -maxdepth 1 -type f \( -iname '*.png' -o -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.webp' \) | sort
  )
fi
(( ${#FRAME_LIST[@]} > MAX_FRAMES )) && FRAME_LIST=("${FRAME_LIST[@]:0:$MAX_FRAMES}")

CAPTION_LIST=()
if [[ -n "$CAPTIONS" && -f "$CAPTIONS" ]]; then
  while IFS= read -r line || [[ -n "$line" ]]; do
    CAPTION_LIST+=("${line%$'\r'}")
  done < "$CAPTIONS"
fi

SOURCE_LIST=()
if [[ -n "$SOURCES" && -f "$SOURCES" ]]; then
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%$'\r'}"
    [[ -n "$line" ]] && SOURCE_LIST+=("$line")
  done < "$SOURCES"
elif git rev-parse --is-inside-work-tree >/dev/null 2>&1 && git rev-parse --verify -q main >/dev/null 2>&1; then
  while IFS= read -r line; do SOURCE_LIST+=("$line"); done < <(git diff --name-only main...HEAD 2>/dev/null | head -n "$MAX_FRAMES")
fi
(( ${#SOURCE_LIST[@]} > MAX_FRAMES )) && SOURCE_LIST=("${SOURCE_LIST[@]:0:$MAX_FRAMES}")

caption_for() {
  local idx="$1" cap
  cap="${CAPTION_LIST[$idx]:-}"
  [[ -n "$cap" ]] || cap="Frame $(( idx + 1 ))"
  printf '%s' "$cap"
}

source_for() {
  local idx="$1" src
  src="${SOURCE_LIST[$idx]:-}"
  [[ -n "$src" ]] || src="changed route or component"
  printf '%s' "$src"
}

# --- build normalized, captioned frames ------------------------------------
NORMALIZED=0
if (( ${#FRAME_LIST[@]} > 0 )) && (( HAVE_FFMPEG )); then
  idx=0
  for raw in "${FRAME_LIST[@]}"; do
    idx=$(( idx + 1 ))
    case "$raw" in /*) ;; *) raw="$PWD/$raw" ;; esac
    printf -v capfile 'caption-%03d.txt' "$idx"
    printf -v outname 'frame-%03d.png' "$idx"
    caption_for $(( idx - 1 )) > "$TMP/$capfile"
    base="scale=$WIDTH:$HEIGHT:force_original_aspect_ratio=decrease,pad=$WIDTH:$HEIGHT:(ow-iw)/2:(oh-ih)/2:0x0f172a"
    labelled="$base"
    if (( HAVE_DRAWTEXT )); then
      if [[ -n "$FONT_FILE" ]]; then
        labelled="$base,drawtext=fontfile=$FONT_FILE:expansion=none:textfile=$capfile:fontcolor=white:fontsize=22:x=(w-text_w)/2:y=h-text_h-20:box=1:boxcolor=black@0.7:boxborderw=10"
      else
        labelled="$base,drawtext=expansion=none:textfile=$capfile:fontcolor=white:fontsize=22:x=(w-text_w)/2:y=h-text_h-20:box=1:boxcolor=black@0.7:boxborderw=10"
      fi
    fi
    if ! (cd "$TMP" && ffmpeg -hide_banner -loglevel error -y -i "$raw" -vf "$labelled" -frames:v 1 "$TMP/$outname" >/dev/null 2>&1); then
      warn "caption overlay failed for frame $idx; writing unlabelled frame"
      (cd "$TMP" && ffmpeg -hide_banner -loglevel error -y -i "$raw" -vf "$base" -frames:v 1 "$TMP/$outname" >/dev/null 2>&1) || true
    fi
    [[ -f "$TMP/$outname" ]] && NORMALIZED=$(( NORMALIZED + 1 ))
  done
fi

# --- fallback: source-derived text panels when Playwright produced no frames --
FALLBACK=0
if (( NORMALIZED == 0 )) && (( HAVE_FFMPEG )); then
  FALLBACK=1
  (( ${#SOURCE_LIST[@]} > 0 )) || SOURCE_LIST=("<no changed sources detected>")
  idx=0
  for src in "${SOURCE_LIST[@]}"; do
    idx=$(( idx + 1 ))
    printf -v capfile 'caption-%03d.txt' "$idx"
    printf -v outname 'frame-%03d.png' "$idx"
    {
      caption_for $(( idx - 1 ))
      printf '\n'
      printf 'source: %s\n' "$src"
    } > "$TMP/$capfile"
    vf="color=c=0x0f172a:s=${WIDTH}x${HEIGHT}:d=1"
    if (( HAVE_DRAWTEXT )); then
      if [[ -n "$FONT_FILE" ]]; then
        vf="$vf,drawtext=fontfile=$FONT_FILE:expansion=none:textfile=$capfile:fontcolor=white:fontsize=22:x=28:y=(h-text_h)/2:line_spacing=10"
      else
        vf="$vf,drawtext=expansion=none:textfile=$capfile:fontcolor=white:fontsize=22:x=28:y=(h-text_h)/2:line_spacing=10"
      fi
    fi
    (cd "$TMP" && ffmpeg -hide_banner -loglevel error -y -f lavfi -i "$vf" -frames:v 1 "$TMP/$outname" >/dev/null 2>&1) || true
    [[ -f "$TMP/$outname" ]] && NORMALIZED=$(( NORMALIZED + 1 ))
  done
  if (( NORMALIZED > 0 )); then
    warn "no Playwright frames available; built $NORMALIZED source-derived panels (see storyboard.svg)"
  fi
fi

# --- self-contained SVG storyboard -----------------------------------------
xml_escape() { sed -e 's/&/\&amp;/g' -e 's/</\&lt;/g' -e 's/>/\&gt;/g' -e 's/"/\&quot;/g' -e "s/'/\&apos;/g"; }

source_excerpt() {
  local src="$1" max="$2" n=0 line
  if [[ -f "$src" ]]; then
    while IFS= read -r line && (( n < max )); do
      printf '%s\n' "${line:0:64}" | xml_escape
      n=$(( n + 1 ))
    done < "$src"
  elif git rev-parse --verify -q main >/dev/null 2>&1; then
    while IFS= read -r line && (( n < max )); do
      printf '%s\n' "${line:0:64}" | xml_escape
      n=$(( n + 1 ))
    done < <(git show "main:$src" 2>/dev/null || true)
  fi
}

PANEL_W=360
PANEL_H=230
HEADER_H=52
BODY="$TMP/storyboard-body.svg"
: > "$BODY"
PANEL_COUNT=$NORMALIZED
(( PANEL_COUNT < ${#SOURCE_LIST[@]} )) && PANEL_COUNT=${#SOURCE_LIST[@]}
(( PANEL_COUNT < 1 )) && PANEL_COUNT=1

for (( idx=1; idx<=PANEL_COUNT; idx++ )); do
  pos=$(( idx - 1 ))
  cap="$(caption_for "$pos")"
  src="$(source_for "$pos")"
  px=$(( 20 + (pos % 2) * 380 ))
  py=$(( HEADER_H + (pos / 2) * 246 ))
  thumb=""
  if [[ -f "$TMP/frame-$(printf '%03d' "$idx").png" ]] && (( HAVE_FFMPEG )); then
    printf -v thumb 'thumb-%03d.png' "$idx"
    ffmpeg -hide_banner -loglevel error -y -i "$TMP/frame-$(printf '%03d' "$idx").png" \
      -vf 'scale=336:160:flags=lanczos' -frames:v 1 "$TMP/$thumb" >/dev/null 2>&1 || thumb=""
  fi
  {
    printf '<g>\n'
    printf '<rect x="%d" y="%d" width="%d" height="%d" rx="10" fill="#0f172a" stroke="#334155"/>\n' "$px" "$py" "$PANEL_W" "$PANEL_H"
    if [[ -n "$thumb" ]]; then
      b64="$(base64 -w0 "$TMP/$thumb" 2>/dev/null || base64 "$TMP/$thumb" | tr -d '\n')"
      thumb_h=160
      (( FALLBACK == 1 )) && thumb_h=110
      printf '<image x="%d" y="%d" width="336" height="%d" href="data:image/png;base64,%s"/>\n' \
        "$(( px + 12 ))" "$(( py + 10 ))" "$thumb_h" "$b64"
      if (( FALLBACK == 1 )); then
        liney=$(( py + 134 ))
        while IFS= read -r code && (( liney < py + 195 )); do
          printf '<text x="%d" y="%d" fill="#94a3b8" font-family="monospace" font-size="10">%s</text>\n' \
            "$(( px + 12 ))" "$liney" "$code"
          liney=$(( liney + 15 ))
        done < <(source_excerpt "$src" 4)
      fi
      liney=$(( py + 214 ))
    else
      liney=$(( py + 28 ))
      while IFS= read -r line && (( liney < py + 190 )); do
        printf '<text x="%d" y="%d" fill="#94a3b8" font-family="monospace" font-size="11">%s</text>\n' "$(( px + 12 ))" "$liney" "$line"
        liney=$(( liney + 18 ))
      done < <(source_excerpt "$src" 9)
      liney=$(( py + 214 ))
    fi
    printf '<text x="%d" y="%d" fill="#e2e8f0" font-family="sans-serif" font-size="12">%s</text>\n' \
      "$(( px + 12 ))" "$liney" "$(printf '%s' "$cap" | xml_escape)"
    printf '</g>\n'
  } >> "$BODY"
done

ROWS=$(( (PANEL_COUNT + 1) / 2 ))
SVG_H=$(( HEADER_H + ROWS * 246 + 20 ))
SVG_W=760
{
  printf '<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="0 0 %d %d">\n' "$SVG_W" "$SVG_H" "$SVG_W" "$SVG_H"
  printf '<rect width="100%%" height="100%%" fill="#020617"/>\n'
  printf '<text x="20" y="32" fill="#f8fafc" font-family="sans-serif" font-size="18" font-weight="bold">Animatic storyboard: %s</text>\n' "$(printf '%s' "$SLUG" | xml_escape)"
  cat "$BODY"
  printf '</svg>\n'
} > "$OUT/storyboard.svg"

# --- stitch media (with a deterministic size guard) ------------------------
file_size() { wc -c < "$1" | tr -d '[:space:]'; }

encode_attempt() {
  local fps="$1" w="$2" crf="$3" colors="$4"
  local h=$(( w * 5 / 8 ))
  (( h % 2 )) && h=$(( h + 1 ))
  local vf="scale=$w:$h:flags=lanczos"
  rm -f "$TMP/attempt.webm" "$TMP/attempt.gif"
  ffmpeg -hide_banner -loglevel error -y -framerate "$fps" -i "$TMP/frame-%03d.png" \
    -vf "$vf,format=yuv420p" -c:v libvpx-vp9 -b:v 0 -crf "$crf" \
    -row-mt 1 -deadline good -cpu-used 5 -an "$TMP/attempt.webm" >/dev/null 2>&1 || return 1
  ffmpeg -hide_banner -loglevel error -y -framerate "$fps" -i "$TMP/frame-%03d.png" \
    -vf "$vf,split[a][b];[a]palettegen=max_colors=$colors[p];[b][p]paletteuse=dither=bayer" \
    -loop 0 "$TMP/attempt.gif" >/dev/null 2>&1 || return 1
  local webm_bytes gif_bytes
  webm_bytes="$(file_size "$TMP/attempt.webm")"
  gif_bytes="$(file_size "$TMP/attempt.gif")"
  (( webm_bytes <= MAX_BYTES && gif_bytes <= MAX_BYTES )) || return 1
  cp "$TMP/attempt.webm" "$OUT/animatic.webm"
  cp "$TMP/attempt.gif" "$OUT/animatic.gif"
  return 0
}

MEDIA_OK=0
if (( STORYBOARD_ONLY == 0 )); then
  if (( NORMALIZED > 0 )) && (( HAVE_FFMPEG )); then
    SMALL_W=$(( WIDTH * 3 / 4 ))
    (( SMALL_W % 2 )) && SMALL_W=$(( SMALL_W + 1 ))
    (( SMALL_W < 320 )) && SMALL_W=320
    ATTEMPTS=(
      "$FPS $WIDTH 34 256"
      "$FPS $WIDTH 40 128"
      "6 $SMALL_W 42 128"
      "4 480 46 64"
    )
    for attempt in "${ATTEMPTS[@]}"; do
      read -r a_fps a_w a_crf a_colors <<< "$attempt"
      if encode_attempt "$a_fps" "$a_w" "$a_crf" "$a_colors"; then
        MEDIA_OK=1
        break
      fi
    done
    if (( MEDIA_OK == 0 )); then
      rm -f "$OUT/animatic.webm" "$OUT/animatic.gif"
      warn "could not keep both media files under ${MAX_BYTES} bytes; storyboard only"
    fi
  else
    warn "no frames and no ffmpeg; skipping media encoding (storyboard.svg written)"
  fi
fi

# --- PR body snippet --------------------------------------------------------
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
case "$OUT" in
  /*) REL_OUT="${OUT#"$REPO_ROOT"/}"; [[ "$REL_OUT" == "$OUT" ]] && REL_OUT="docs/media/$SLUG" ;;
  *)  REL_OUT="${OUT#./}" ;;
esac
REL_OUT="${REL_OUT%/}"

SNIPPET="$OUT/PR_BODY_ANIMATIC.md"
{
  printf '## Animated preview (animatic)\n\n'
  if (( MEDIA_OK == 1 )); then
    printf '<picture>\n'
    printf '  <source srcset="%s/animatic.webm" type="video/webm" />\n' "$REL_OUT"
    printf '  <img src="%s/animatic.gif" alt="Animated preview of interface changes" width="%d" />\n' "$REL_OUT" "$WIDTH"
    printf '</picture>\n\n'
    printf '![Animated preview (GIF fallback)](%s/animatic.gif)\n\n' "$REL_OUT"
  else
    printf '_Animated media unavailable in this environment; the storyboard below is the fallback preview._\n\n'
  fi
  printf '**What changed**\n\n'
  if (( ${#SOURCE_LIST[@]} > 0 )); then
    for src in "${SOURCE_LIST[@]}"; do
      printf -- '- `%s` — see the labelled frames above.\n' "$src"
    done
  else
    printf -- '- Interface updates captured from the changed route or component files.\n'
  fi
  printf '\n<details>\n<summary>Full storyboard</summary>\n\n'
  printf '![Storyboard](%s/storyboard.svg)\n\n' "$REL_OUT"
  printf '</details>\n'
} > "$SNIPPET"

printf 'Animatic written to %s (frames: %d, media: %s)\n' "$OUT" "$NORMALIZED" "$([[ $MEDIA_OK == 1 ]] && echo yes || echo no)"
printf '  %s\n  %s\n  %s\n  %s\n' \
  "$OUT/animatic.webm" "$OUT/animatic.gif" "$OUT/storyboard.svg" "$SNIPPET" >&2

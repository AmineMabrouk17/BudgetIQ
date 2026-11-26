# Decisions

## 2026-11-25 — Voice notes use Gemini for speech-to-text

**Decision:** Voice notes recorded in the AI assistant are transcribed by
`gemini-3.5-flash-lite` through its multimodal `generateContent` endpoint, with
the model overridable via `GEMINI_TRANSCRIBE_MODEL`.

**Why:** The assistant already calls Gemini with `GEMINI_API_KEY`, so voice
needs no second vendor, key, or billing relationship. The model answers
WebM/Opus from Chromium's MediaRecorder directly and returned the expected
transcript for both MP3 and WebM fixtures. Whisper and hosted STT services would
have added a credential and a second failure mode for no accuracy gain on
short transaction sentences.

**Alternative considered:** OpenAI Whisper (`whisper-1`) — rejected because no
key exists in the deployment and the provider is not otherwise used.

## 2026-11-25 — A finished voice note is sent immediately

**Decision:** When transcription succeeds, the transcript is sent to
`/api/chat` as the user's message without another confirmation step.

**Why:** The product's promise is "say what you spent"; an edit box between
speech and answer turns a one-tap flow into a form. The transcript is visible
as a "Voice note" bubble, and the assistant still asks the user to confirm the
transaction with the usual action card, so the safety step stays where it
belongs.

**Alternative considered:** Pre-filling the composer so the user can correct
the transcript — rejected because the existing confirmation card already covers
the correction case, and a stale composer conflicts with the auto-scroll chat.

## 2026-11-25 — Signed preview sessions can write transactions in memory

**Decision:** `insertTransaction` appends to a process-local store when the
request carries a valid signed preview session, and the preview read paths
merge that store with the demo fixture.

**Why:** The demo user has no Supabase identity, so the "Add" button failed in
preview builds and the voice e2e could not show a logged transaction. The store
is reachable only through the preview HMAC guard and never exists in
production, and it lets capture-evidence and Playwright exercise the real
create path end-to-end.

**Alternative considered:** Creating a real Supabase account for tests —
rejected because the project rejects test email domains and confirming an
account would put credentials and cleanup in CI.

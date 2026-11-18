import { Fragment } from "react";

interface AnimatedHeroTitleProps {
  lines: string[];
  /** Index of the line spoken in the assistant's serif voice. */
  voiceLineIndex?: number;
}

const BASE_DELAY_MS = 80;
const WORD_STEP_MS = 55;

interface PreparedWord {
  word: string;
  delayMs: number;
}

interface PreparedLine {
  text: string;
  words: PreparedWord[];
}

function prepareLines(lines: string[]): PreparedLine[] {
  const prepared: PreparedLine[] = [];
  let wordIndex = 0;
  for (const line of lines) {
    const words = line.split(" ").map((word): PreparedWord => {
      const preparedWord = {
        word,
        delayMs: BASE_DELAY_MS + wordIndex * WORD_STEP_MS,
      };
      wordIndex += 1;
      return preparedWord;
    });
    prepared.push({ text: line, words });
  }
  return prepared;
}

export default function AnimatedHeroTitle({
  lines,
  voiceLineIndex,
}: AnimatedHeroTitleProps) {
  const preparedLines = prepareLines(lines);
  return (
    <h1 className="max-w-[20ch] text-balance font-display text-[length:clamp(2.5rem,6.2vw,5.25rem)] font-bold leading-[0.96] tracking-[-0.035em] text-ink">
      {preparedLines.map((line, lineIndex) => (
        <span key={line.text} className="block">
          {line.words.map((preparedWord) => (
            // The space sits between the word boxes, not inside them: a
            // trailing space inside an inline-block is trimmed by innerText
            // and by copy-paste, which turns the headline into one long word.
            <Fragment key={`${line.text}-${preparedWord.delayMs}`}>
              <span
                className={`bi-rise inline-block will-change-transform ${
                  voiceLineIndex === lineIndex
                    ? "font-voice text-[1.06em] font-normal italic tracking-[-0.015em] text-signal"
                    : ""
                }`}
                style={{ animationDelay: `${preparedWord.delayMs}ms` }}
              >
                {preparedWord.word}
              </span>{" "}
            </Fragment>
          ))}
        </span>
      ))}
    </h1>
  );
}

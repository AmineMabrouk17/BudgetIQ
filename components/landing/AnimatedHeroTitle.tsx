import { Fragment } from "react";

interface AnimatedHeroTitleProps {
  lines: string[];
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

export default function AnimatedHeroTitle({ lines }: AnimatedHeroTitleProps) {
  const preparedLines = prepareLines(lines);
  return (
    <h1 className="max-w-3xl text-balance font-display text-[length:clamp(2.5rem,5vw,3.75rem)] font-normal leading-[1.08] tracking-[-0.03em] text-ink">
      {preparedLines.map((line) => (
        <span key={line.text} className="block">
          {line.words.map((preparedWord) => (
            // The space sits between the word boxes, not inside them: a
            // trailing space inside an inline-block is trimmed by innerText
            // and by copy-paste, which turns the headline into one long word.
            <Fragment key={`${line.text}-${preparedWord.delayMs}`}>
              <span
                className="bi-rise inline-block will-change-transform"
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

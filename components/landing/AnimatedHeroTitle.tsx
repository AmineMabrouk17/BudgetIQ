interface AnimatedHeroTitleProps {
  lines: string[];
}

const BASE_DELAY_MS = 150;
const WORD_STEP_MS = 90;

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
    <h1 className="mx-auto max-w-5xl font-display text-[length:clamp(3rem,9vw,9rem)] leading-[0.9] font-semibold tracking-[-0.02em] text-white/90">
      {preparedLines.map((line) => (
        <span key={line.text} aria-hidden={false} className="block">
          {line.words.map((preparedWord) => (
            <span
              key={`${line.text}-${preparedWord.delayMs}`}
              className="bi-rise inline-block will-change-transform"
              style={{ animationDelay: `${preparedWord.delayMs}ms` }}
            >
              {preparedWord.word}{" "}
            </span>
          ))}
        </span>
      ))}
    </h1>
  );
}

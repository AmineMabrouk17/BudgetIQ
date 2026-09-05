"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { ChevronDown, Plus } from "lucide-react";
import {
  CATEGORY_PRESETS,
  filterCategories,
  titleCase,
} from "@/lib/categories";
import { getUserCategories } from "@/app/actions/transactions";

type Props = {
  name: string;
  defaultValue?: string;
};

export default function CategoryCombobox({ name, defaultValue = "" }: Props) {
  const [query, setQuery] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [selected, setSelected] = useState(defaultValue);
  const [history, setHistory] = useState<string[]>([]);
  const [topFour, setTopFour] = useState<string[]>([]);
  const [, startTransition] = useTransition();

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    startTransition(async () => {
      const result = await getUserCategories();
      if (result.ok) {
        setHistory(result.distinct);
        setTopFour(result.topFour);
      }
    });
  }, []);

  const options = useMemo(
    () => filterCategories(query, history),
    [query, history]
  );

  const isCustom =
    query.length > 0 &&
    !options.some((o) => o.toLowerCase() === query.toLowerCase());

  const allOptions = useMemo(() => {
    if (isCustom) return [...options, titleCase(query)];
    return options;
  }, [options, isCustom, query]);

  const handleSelect = useCallback(
    (value: string) => {
      setSelected(value);
      setQuery(value);
      setIsOpen(false);
      setHighlightIndex(-1);
    },
    []
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          setIsOpen(true);
          setHighlightIndex(0);
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightIndex((i) => (i + 1) % allOptions.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightIndex((i) =>
            i <= 0 ? allOptions.length - 1 : i - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (highlightIndex >= 0 && highlightIndex < allOptions.length) {
            handleSelect(allOptions[highlightIndex]);
          }
          break;
        case "Escape":
          setIsOpen(false);
          setHighlightIndex(-1);
          break;
        case "Tab":
          setIsOpen(false);
          setHighlightIndex(-1);
          break;
      }
    },
    [isOpen, highlightIndex, allOptions, handleSelect]
  );

  useEffect(() => {
    if (!isOpen || highlightIndex < 0) return;
    const item = listRef.current?.children[highlightIndex] as HTMLElement;
    item?.scrollIntoView({ block: "nearest" });
  }, [isOpen, highlightIndex]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function getIcon(label: string) {
    const preset = CATEGORY_PRESETS.find(
      (p) => p.label.toLowerCase() === label.toLowerCase()
    );
    if (preset) {
      const Icon = preset.icon;
      return <Icon className="h-4 w-4 shrink-0" />;
    }
    return null;
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <input type="hidden" name={name} value={selected} />

      {topFour.length > 0 && !selected && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {topFour.map((cat) => (
            <button
              key={cat}
              type="button"
              className="badge badge-outline badge-sm cursor-pointer gap-1 hover:badge-primary"
              onClick={() => handleSelect(cat)}
            >
              {getIcon(cat)}
              {cat}
            </button>
          ))}
        </div>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          className="input input-bordered w-full pr-10"
          type="text"
          placeholder="Select or type a category"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelected("");
            setIsOpen(true);
            setHighlightIndex(-1);
          }}
          onFocus={() => {
            setIsOpen(true);
            setHighlightIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={`${name}-listbox`}
          aria-activedescendant={
            highlightIndex >= 0 ? `${name}-option-${highlightIndex}` : undefined
          }
        />
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-base-content/50"
          tabIndex={-1}
          onClick={() => {
            setIsOpen((o) => !o);
            inputRef.current?.focus();
          }}
          aria-label="Toggle category list"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {isOpen && (
        <ul
          ref={listRef}
          id={`${name}-listbox`}
          role="listbox"
          className="menu dropdown-content z-50 mt-1 w-full rounded-box border border-base-content/10 bg-base-100 p-1 shadow-lg max-h-60 overflow-y-auto"
        >
          {allOptions.length === 0 && (
            <li className="px-3 py-2 text-sm text-base-content/50">
              No matches found
            </li>
          )}
          {allOptions.map((opt, i) => {
            const isNew =
              isCustom && i === allOptions.length - 1;
            return (
              <li key={opt}>
                <button
                  type="button"
                  id={`${name}-option-${i}`}
                  role="option"
                  aria-selected={selected === opt}
                  className={`flex items-center gap-2 text-sm ${
                    highlightIndex === i ? "bg-primary/10" : ""
                  } ${selected === opt ? "font-semibold" : ""}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(opt)}
                  onMouseEnter={() => setHighlightIndex(i)}
                >
                  {isNew ? (
                    <Plus className="h-4 w-4 shrink-0" />
                  ) : (
                    getIcon(opt)
                  )}
                  <span>{opt}</span>
                  {isNew && (
                    <span className="badge badge-xs badge-primary ml-auto">
                      New
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

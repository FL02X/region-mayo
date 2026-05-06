"use client";

import { highlightText } from "@/lib/search-utils";

interface HighlightedTextProps {
  text: string;
  query: string;
}

export function HighlightedText({ text, query }: HighlightedTextProps) {
  const parts = highlightText(text, query);

  return (
    <>
      {parts.map((part, idx) =>
        part.isMatch ? (
          <mark
            key={idx}
            className="bg-yellow-200 dark:bg-yellow-900/40 text-inherit rounded px-0.5 no-underline"
          >
            {part.text}
          </mark>
        ) : (
          <span key={idx}>{part.text}</span>
        ),
      )}
    </>
  );
}

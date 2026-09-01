import type { ReactNode } from "react";

/**
 * Minimal Markdown renderer for the notes page. It builds React elements instead of
 * HTML strings, so note content can never inject markup or scripts.
 */

type Inline = { text: string; bold?: boolean; italic?: boolean; code?: boolean };

const INLINE_PATTERN = /(`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_)/g;

function inlines(text: string): ReactNode[] {
  return text.split(INLINE_PATTERN).map((part, i) => {
    if (!part) return null;
    let token: Inline = { text: part };
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      token = { text: part.slice(1, -1), code: true };
    } else if ((part.startsWith("**") || part.startsWith("__")) && part.length > 4) {
      token = { text: part.slice(2, -2), bold: true };
    } else if ((part.startsWith("*") || part.startsWith("_")) && part.length > 2) {
      token = { text: part.slice(1, -1), italic: true };
    }

    if (token.code) {
      return (
        <code key={i} className="rounded bg-surface-2 px-1 py-0.5 font-mono text-[0.85em]">
          {token.text}
        </code>
      );
    }
    if (token.bold) return <strong key={i}>{token.text}</strong>;
    if (token.italic) return <em key={i}>{token.text}</em>;
    return <span key={i}>{token.text}</span>;
  });
}

const HEADING_CLASS = [
  "mt-4 text-2xl font-bold",
  "mt-4 text-xl font-bold",
  "mt-3 text-lg font-semibold",
  "mt-3 text-base font-semibold",
  "mt-3 text-sm font-semibold",
  "mt-3 text-sm font-semibold text-muted",
];

export function renderMarkdown(source: string): ReactNode[] {
  const lines = source.split("\n");
  const out: ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("```")) {
      const code: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].startsWith("```")) {
        code.push(lines[i]);
        i += 1;
      }
      i += 1;
      out.push(
        <pre
          key={out.length}
          className="my-3 overflow-x-auto rounded-lg border border-line bg-surface-2 p-3 font-mono text-xs"
        >
          {code.join("\n")}
        </pre>
      );
      continue;
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      const Tag = `h${level}` as "h1";
      out.push(
        <Tag key={out.length} className={HEADING_CLASS[level - 1]}>
          {inlines(heading[2])}
        </Tag>
      );
      i += 1;
      continue;
    }

    if (/^\s*(-\s*-\s*-|\*\s*\*\s*\*|_\s*_\s*_)[-*_\s]*$/.test(line)) {
      out.push(<hr key={out.length} className="my-4 border-line" />);
      i += 1;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quote: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quote.push(lines[i].replace(/^>\s?/, ""));
        i += 1;
      }
      out.push(
        <blockquote key={out.length} className="my-3 border-l-2 border-line pl-3 text-muted">
          {inlines(quote.join(" "))}
        </blockquote>
      );
      continue;
    }

    if (/^\s*[-*+]\s+/.test(line) || /^\s*\d+[.)]\s+/.test(line)) {
      const ordered = /^\s*\d+[.)]\s+/.test(line);
      const items: ReactNode[] = [];
      while (
        i < lines.length &&
        (ordered ? /^\s*\d+[.)]\s+/.test(lines[i]) : /^\s*[-*+]\s+/.test(lines[i]))
      ) {
        const raw = lines[i].replace(ordered ? /^\s*\d+[.)]\s+/ : /^\s*[-*+]\s+/, "");
        const checkbox = /^\[( |x|X)\]\s+(.*)$/.exec(raw);
        items.push(
          checkbox ? (
            <li key={items.length} className="flex items-start gap-2 list-none -ml-5">
              <input
                type="checkbox"
                checked={checkbox[1].toLowerCase() === "x"}
                readOnly
                className="mt-1 h-3.5 w-3.5"
              />
              <span className={checkbox[1].toLowerCase() === "x" ? "text-muted line-through" : ""}>
                {inlines(checkbox[2])}
              </span>
            </li>
          ) : (
            <li key={items.length}>{inlines(raw)}</li>
          )
        );
        i += 1;
      }
      const ListTag = ordered ? "ol" : "ul";
      out.push(
        <ListTag
          key={out.length}
          className={`my-2 ml-5 space-y-1 ${ordered ? "list-decimal" : "list-disc"}`}
        >
          {items}
        </ListTag>
      );
      continue;
    }

    if (line.trim() === "") {
      i += 1;
      continue;
    }

    const paragraph: string[] = [];
    while (i < lines.length && lines[i].trim() !== "" && !/^(#{1,6}\s|>|```|\s*[-*+]\s|\s*\d+[.)]\s)/.test(lines[i])) {
      paragraph.push(lines[i]);
      i += 1;
    }
    out.push(
      <p key={out.length} className="my-2 leading-relaxed">
        {inlines(paragraph.join(" "))}
      </p>
    );
  }

  return out;
}

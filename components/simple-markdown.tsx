import { Fragment, ReactNode } from "react";

type SimpleMarkdownProps = {
  content: string;
  className?: string;
};

type InlineToken =
  | { type: "text"; value: string }
  | { type: "bold"; value: string }
  | { type: "italic"; value: string }
  | { type: "code"; value: string }
  | { type: "link"; label: string; href: string };

type Block =
  | { type: "heading1"; content: string }
  | { type: "heading2"; content: string }
  | { type: "heading3"; content: string }
  | { type: "paragraph"; content: string }
  | { type: "list"; items: string[] }
  | { type: "blockquote"; content: string }
  | { type: "divider" };

export function SimpleMarkdown({ content, className }: SimpleMarkdownProps) {
  const blocks = parseBlocks(content);

  return (
    <div className={["space-y-4 text-sm leading-7 text-foreground/88 md:text-[15px]", className].filter(Boolean).join(" ")}>
      {blocks.map((block, index) => renderBlock(block, index))}
    </div>
  );
}

function parseBlocks(content: string): Block[] {
  const lines = content.split(/\r?\n/);
  const blocks: Block[] = [];
  let paragraphLines: string[] = [];
  let listItems: string[] = [];

  function flushParagraph() {
    if (paragraphLines.length === 0) {
      return;
    }
    blocks.push({ type: "paragraph", content: paragraphLines.join(" ") });
    paragraphLines = [];
  }

  function flushList() {
    if (listItems.length === 0) {
      return;
    }
    blocks.push({ type: "list", items: listItems });
    listItems = [];
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    if (line === "---") {
      flushParagraph();
      flushList();
      blocks.push({ type: "divider" });
      continue;
    }

    if (line.startsWith("### ")) {
      flushParagraph();
      flushList();
      blocks.push({ type: "heading3", content: line.slice(4) });
      continue;
    }

    if (line.startsWith("## ")) {
      flushParagraph();
      flushList();
      blocks.push({ type: "heading2", content: line.slice(3) });
      continue;
    }

    if (line.startsWith("# ")) {
      flushParagraph();
      flushList();
      blocks.push({ type: "heading1", content: line.slice(2) });
      continue;
    }

    if (line.startsWith("> ")) {
      flushParagraph();
      flushList();
      blocks.push({ type: "blockquote", content: line.slice(2) });
      continue;
    }

    if (line.startsWith("- ") || line.startsWith("* ")) {
      flushParagraph();
      listItems.push(line.slice(2));
      continue;
    }

    paragraphLines.push(line);
  }

  flushParagraph();
  flushList();

  return blocks;
}

function renderBlock(block: Block, index: number) {
  switch (block.type) {
    case "heading1":
      return (
        <h1 key={index} className="text-2xl font-semibold leading-tight text-foreground md:text-3xl">
          {renderInline(block.content)}
        </h1>
      );
    case "heading2":
      return (
        <h2 key={index} className="text-xl font-semibold leading-tight text-foreground md:text-2xl">
          {renderInline(block.content)}
        </h2>
      );
    case "heading3":
      return (
        <h3 key={index} className="text-lg font-semibold leading-tight text-foreground">
          {renderInline(block.content)}
        </h3>
      );
    case "paragraph":
      return (
        <p key={index} className="whitespace-pre-wrap">
          {renderInline(block.content)}
        </p>
      );
    case "list":
      return (
        <ul key={index} className="space-y-2 pl-5">
          {block.items.map((item, itemIndex) => (
            <li key={`${index}-${itemIndex}`} className="list-disc">
              {renderInline(item)}
            </li>
          ))}
        </ul>
      );
    case "blockquote":
      return (
        <blockquote key={index} className="border-l-2 border-border/70 pl-4 italic text-foreground/72">
          {renderInline(block.content)}
        </blockquote>
      );
    case "divider":
      return <hr key={index} className="border-border/70" />;
    default:
      return null;
  }
}

function renderInline(content: string): ReactNode[] {
  const tokens = tokenizeInline(content);

  return tokens.map((token, index) => {
    switch (token.type) {
      case "bold":
        return <strong key={index} className="font-semibold text-foreground">{token.value}</strong>;
      case "italic":
        return <em key={index} className="italic">{token.value}</em>;
      case "code":
        return (
          <code key={index} className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.92em] text-foreground">
            {token.value}
          </code>
        );
      case "link":
        return (
          <a
            key={index}
            href={token.href}
            target="_blank"
            rel="noreferrer"
            className="text-primary underline underline-offset-4"
          >
            {token.label}
          </a>
        );
      default:
        return <Fragment key={index}>{token.value}</Fragment>;
    }
  });
}

function tokenizeInline(content: string): InlineToken[] {
  const pattern = /(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\))|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)/g;
  const tokens: InlineToken[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null = null;

  while ((match = pattern.exec(content)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: "text", value: content.slice(lastIndex, match.index) });
    }

    if (match[1]) {
      tokens.push({ type: "link", label: match[2], href: match[3] });
    } else if (match[4]) {
      tokens.push({ type: "bold", value: match[5] });
    } else if (match[6]) {
      tokens.push({ type: "italic", value: match[7] });
    } else if (match[8]) {
      tokens.push({ type: "code", value: match[9] });
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < content.length) {
    tokens.push({ type: "text", value: content.slice(lastIndex) });
  }

  return tokens;
}

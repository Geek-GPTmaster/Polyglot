"use client";

import { useMemo } from "react";

interface ArticleReaderProps {
  content: string;
  selectedWord: string | null;
  vocabSet: Set<string>;
  onWordClick: (word: string) => void;
}

interface Token {
  type: "word" | "space" | "punct" | "newline";
  value: string;
  key: string;
}

/** 将原始文本拆分为 token 数组 */
function tokenize(text: string): Token[] {
  // 按段落分割，段落内再拆 token
  const segments = text.split(/(\n{2,})/);
  const result: Token[] = [];
  let keyIdx = 0;

  for (const seg of segments) {
    // 段落间空行 → 段落分隔
    if (/^\n{2,}$/.test(seg)) {
      result.push({ type: "newline", value: "\n\n", key: `nl-${keyIdx++}` });
      continue;
    }
    // 段落内：匹配单词、空白、标点
    const parts = seg.match(/[a-zA-Z''\-]+|\s+|[^a-zA-Z''\-\s]/g) ?? [];
    for (const part of parts) {
      if (/^[a-zA-Z]/.test(part)) {
        result.push({ type: "word", value: part, key: `w-${keyIdx++}` });
      } else if (/^\s+$/.test(part)) {
        result.push({ type: "space", value: part, key: `s-${keyIdx++}` });
      } else {
        result.push({ type: "punct", value: part, key: `p-${keyIdx++}` });
      }
    }
  }
  return result;
}

export default function ArticleReader({
  content,
  selectedWord,
  vocabSet,
  onWordClick,
}: ArticleReaderProps) {
  const tokens = useMemo(() => tokenize(content), [content]);

  return (
    <article
      style={{
        fontFamily: "var(--font-serif)",
        fontSize: "1.1rem",
        lineHeight: 2,
        color: "var(--ink)",
        letterSpacing: "0.01em",
      }}
    >
      {/* 段落渲染：遇到 newline token 就开新 <p> */}
      {renderParagraphs(tokens, selectedWord, vocabSet, onWordClick)}
    </article>
  );
}

function renderParagraphs(
  tokens: Token[],
  selectedWord: string | null,
  vocabSet: Set<string>,
  onWordClick: (w: string) => void
) {
  // 按 newline token 切割成段落组
  const paragraphs: Token[][] = [];
  let current: Token[] = [];

  for (const token of tokens) {
    if (token.type === "newline") {
      if (current.length > 0) {
        paragraphs.push(current);
        current = [];
      }
    } else {
      current.push(token);
    }
  }
  if (current.length > 0) paragraphs.push(current);

  return paragraphs.map((para, pIdx) => (
    <p
      key={`para-${pIdx}`}
      style={{
        margin: "0 0 1.6em 0",
        textAlign: "justify",
      }}
    >
      {para.map((token) => {
        if (token.type !== "word") {
          return <span key={token.key}>{token.value}</span>;
        }

        const lower = token.value.toLowerCase().replace(/['']/g, "'");
        const isActive = lower === selectedWord?.toLowerCase();
        const isInVocab = vocabSet.has(lower);

        let className = "word-token";
        if (isActive) className += " active";
        if (isInVocab) className += " in-vocab";

        return (
          <span
            key={token.key}
            className={className}
            onClick={() => onWordClick(lower)}
          >
            {token.value}
          </span>
        );
      })}
    </p>
  ));
}

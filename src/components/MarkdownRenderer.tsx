import React, { useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { Check, Copy } from 'lucide-react';
import { soundFX } from '../utils/audio';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  const parts: Array<{ type: 'text' | 'code'; content: string; language?: string }> = [];

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: content.substring(lastIndex, match.index),
      });
    }

    parts.push({
      type: 'code',
      language: match[1] || 'plaintext',
      content: match[2].trim(),
    });

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({
      type: 'text',
      content: content.substring(lastIndex),
    });
  }

  return (
    <div className="space-y-3 leading-relaxed text-inherit">
      {parts.map((part, index) => {
        if (part.type === 'code') {
          return (
            <CodeBlock
              key={index}
              code={part.content}
              language={part.language || 'plaintext'}
            />
          );
        }

        const html = DOMPurify.sanitize(
          marked.parse(part.content, { breaks: true, gfm: true }) as string
        );

        return (
          <div
            key={index}
            className="markdown-content space-y-2 [&>p]:mb-2 [&>p]:leading-relaxed [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>li]:mb-1 [&>h1]:text-xl [&>h1]:font-bold [&>h1]:text-cyan-600 dark:[&>h1]:text-cyan-300 [&>h2]:text-lg [&>h2]:font-bold [&>h2]:text-cyan-600 dark:[&>h2]:text-cyan-300 [&>h3]:text-base [&>h3]:font-semibold [&>h3]:text-cyan-600 dark:[&>h3]:text-cyan-200 [&>table]:w-full [&>table]:border-collapse [&>table]:my-3 [&>table_th]:border [&>table_th]:border-slate-300 dark:[&>table_th]:border-slate-700 [&>table_th]:bg-slate-100 dark:[&>table_th]:bg-slate-800/80 [&>table_th]:p-2 [&>table_th]:text-left [&>table_td]:border [&>table_td]:border-slate-200 dark:[&>table_td]:border-slate-800 [&>table_td]:p-2 [&>blockquote]:border-l-4 [&>blockquote]:border-cyan-500 [&>blockquote]:pl-3 [&>blockquote]:italic [&>blockquote]:text-slate-500 dark:[&>blockquote]:text-slate-400 [&_code]:font-mono [&_code]:bg-slate-100 dark:[&_code]:bg-slate-800/70 [&_code]:text-cyan-700 dark:[&_code]:text-cyan-300 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_a]:text-cyan-600 dark:[&_a]:text-cyan-400 [&_a]:underline hover:[&_a]:text-cyan-700"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      })}
    </div>
  );
};

const CodeBlock: React.FC<{ code: string; language: string }> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      soundFX.playClick();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn('Copy failed', e);
    }
  };

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-slate-700/80 bg-[#0a0f1d] text-slate-100 shadow-md">
      <div className="flex items-center justify-between border-b border-slate-800/80 bg-[#0d1424] px-4 py-1.5 text-xs">
        <span className="font-mono font-medium text-cyan-400 uppercase tracking-wider text-[11px]">
          {language}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium text-[11px]">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="text-[11px]">Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="overflow-x-auto p-4 text-xs font-mono leading-relaxed text-slate-200 selection:bg-cyan-500/30">
        <pre className="m-0 font-mono">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};

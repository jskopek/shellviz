"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlayIcon } from "lucide-react";
import Copy from "./copy";
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from "next-themes";

// Register languages
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('bash', bash);
SyntaxHighlighter.registerLanguage('json', json);

interface CodeExampleFinalProps {
  code: string; // Code to execute
  displayCode: string; // Code to display
  language?: string;
}

export default function CodeExampleFinal({ code, displayCode, language = "javascript" }: CodeExampleFinalProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const { theme } = useTheme();

  const runCode = async () => {
    if (typeof window === "undefined" || !window.shellviz) {
      console.error("Shellviz not available");
      return;
    }

    setIsRunning(true);
    setHasRun(true);

    try {
      console.log('Executing code:', code);
      eval(code);
    } catch (error) {
      console.error("Error executing code:", error);
    } finally {
      setIsRunning(false);
    }
  };

  // Use theme-appropriate style
  const syntaxTheme = theme === 'dark' ? vscDarkPlus : vs;

  // Custom style that matches your existing theme
  const customStyle = {
    'pre[class*="language-"]': {
      background: 'transparent',
      margin: 0,
      padding: '2px 0',
      overflow: 'auto',
    },
    'code[class*="language-"]': {
      background: 'transparent',
      padding: '14px 0',
      display: 'grid',
    },
    '.token.keyword': {
      color: theme === 'dark' ? '#fb7185' : '#e11d48',
    },
    '.token.function': {
      color: theme === 'dark' ? '#38bdf8' : '#0ea5e9',
    },
    '.token.punctuation': {
      color: '#64748b',
    },
    '.token.comment': {
      color: '#94a3b8',
    },
    '.token.string': {
      color: theme === 'dark' ? '#fbbf24' : '#f59e0b',
    },
    '.token.number': {
      color: theme === 'dark' ? '#fbbf24' : '#f59e0b',
    },
    '.token.boolean': {
      color: theme === 'dark' ? '#fbbf24' : '#f59e0b',
    },
    '.token.constant': {
      color: theme === 'dark' ? '#fbbf24' : '#f59e0b',
    },
    '.token.annotation': {
      color: theme === 'dark' ? '#fbbf24' : '#f59e0b',
    },
    '.token.tag': {
      color: theme === 'dark' ? '#fb7185' : '#ec4899',
    },
    '.token.attr-name': {
      color: theme === 'dark' ? '#22c55e' : '#16a34a',
    },
    '.token.attr-value': {
      color: theme === 'dark' ? '#fb923c' : '#f97316',
    },
    '.token.operator': {
      color: '#64748b',
    },
  };

  return (
    <div className="my-5 relative">
      <div className="absolute top-3 right-2.5 z-10 sm:block hidden flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={runCode}
          disabled={isRunning}
          className="h-8 px-2"
        >
          {isRunning ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <PlayIcon className="w-4 h-4" />
          )}
        </Button>
        <Copy content={displayCode} />
      </div>
      
      <div className="relative">
        <SyntaxHighlighter
          language={language}
          style={syntaxTheme}
          customStyle={{
            background: 'transparent',
            padding: '14px 0',
            margin: 0,
            fontSize: '14px',
          }}
          codeTagProps={{
            className: `language-${language} code-highlight`,
            style: {}
          }}
          PreTag="pre"
          className={`language-${language}`}
          showLineNumbers={false}
          wrapLines={true}
          lineProps={{
            className: 'code-line',
            style: {}
          }}
        >
          {displayCode}
        </SyntaxHighlighter>
      </div>
      
      {hasRun && (
        <div className="mt-2 text-sm text-muted-foreground">
          ✓ Code executed in Shellviz
        </div>
      )}
    </div>
  );
}
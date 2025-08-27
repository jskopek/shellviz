"use client";

import React, { Children } from "react";
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

interface CodeExampleProps {
  language?: string;
  children: React.ReactNode;
  hideControls?: boolean;
}

function CodeExample({ language = "javascript", children, hideControls = false }: CodeExampleProps) {
  const { theme } = useTheme();
  
  // Convert children to string
  const code = React.isValidElement(children) 
    ? children.props.children || ''
    : typeof children === 'string'
    ? children.trim()
    : Array.isArray(children)
    ? Children.toArray(children).map(child => 
        typeof child === 'string' ? child : 
        React.isValidElement(child) ? child.props.children || '' : String(child)
      ).join('')
    : String(children || '').trim();


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
    <div className={hideControls ? "" : "my-5 relative"}>
      {!hideControls && (
        <div className="absolute top-3 right-2.5 z-10 sm:block hidden">
          <Copy content={code} />
        </div>
      )}
      
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
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

CodeExample.displayName = 'CodeExample';

export { CodeExample };
export default CodeExample;
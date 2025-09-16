"use client";

import React, { useState, Children, isValidElement, cloneElement } from "react";
import { Button } from "@/components/ui/button";
import { PlayIcon } from "lucide-react";
import Copy from "./copy";

interface CodeRunnerProps {
  code: string;
  children: React.ReactNode;
  showCopy?: boolean;
}

export function CodeRunner({ code, children, showCopy = false }: CodeRunnerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const runCode = async () => {
    if (typeof window === "undefined" || !window.shellviz) {
      console.error("Shellviz not available");
      return;
    }

    // always show the code in the shellviz
    window.shellviz.show(true);

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

  // Find all CodeExample children - prioritize code prop detection
  const codeExamples: React.ReactElement[] = [];
  Children.forEach(children, (child) => {
    if (isValidElement(child) && child.props && (child.props.code || child.props.language)) {
      // If it has a code or language prop, it's a CodeExample
      codeExamples.push(child);
    }
  });

  const hasMultipleTabs = codeExamples.length > 1;
  
  // Get the currently active code for copying
  const getActiveCode = () => {
    if (hasMultipleTabs && codeExamples[activeTab]) {
      const activeExample = codeExamples[activeTab];
      if (activeExample.props.code) {
        return activeExample.props.code.trim();
      }
      const children = activeExample.props.children;
      return typeof children === 'string' ? children.trim() : String(children || '').trim();
    } else if (codeExamples[0]) {
      if (codeExamples[0].props.code) {
        return codeExamples[0].props.code.trim();
      }
      const children = codeExamples[0].props.children;
      return typeof children === 'string' ? children.trim() : String(children || '').trim();
    }
    return '';
  };

  return (
    <div className="my-5 relative">
      {hasMultipleTabs && (
        <div className="flex border-b mb-0">
          {codeExamples.map((example, index) => {
            const language = example.props.language || 'javascript';
            return (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
                className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                  activeTab === index
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {language}
              </button>
            );
          })}
        </div>
      )}
      
      <div className="relative">
        <div className="absolute top-3 right-2.5 z-10 sm:block hidden flex gap-2">
          {code && <Button
            variant="outline"
            size="sm"
            onClick={runCode}
            disabled={isRunning}
            className="h-8 px-2"
          >
            {isRunning ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
                <div className="flex items-center gap-2">
                  <PlayIcon className="w-4 h-4" />
                  <span>Run</span>
                </div>
            )}
          </Button>}
          {showCopy && <Copy content={getActiveCode()} />}
        </div>

        {hasMultipleTabs ? (
          <>
            {codeExamples.map((example, index) => (
              <div key={index} className={activeTab === index ? 'block' : 'hidden'}>
                {cloneElement(example, { hideControls: true } as any)}
              </div>
            ))}
          </>
        ) : (
          <>
            {Children.map(children, (child) => {
              if (isValidElement(child) && child.props && (child.props.code || child.props.language)) {
                return cloneElement(child, { hideControls: true } as any);
              }
              return child;
            })}
          </>
        )}
      </div>

      {hasRun && (
        <div className="mt-2 text-sm text-muted-foreground">
          ✓ Code executed in Shellviz
        </div>
      )}
    </div>
  );
}
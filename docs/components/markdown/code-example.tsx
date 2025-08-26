"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PlayIcon, CopyIcon, CheckIcon } from "lucide-react";
import Copy from "./copy";

interface CodeExampleProps {
  code: string;
  language?: string;
  children?: React.ReactNode;
}

export default function CodeExample({ code, language = "javascript", children }: CodeExampleProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  const runCode = async () => {
    // Only run on client side
    if (typeof window === "undefined") {
      return;
    }

    if (!window.shellviz) {
      console.error("Shellviz not available");
      return;
    }

    setIsRunning(true);
    setHasRun(true);

    try {
      console.log('Executing code:', code);
      
      // Execute the code directly with eval (safe since it's written by the user)
      eval(code);
    } catch (error) {
      console.error("Error executing code:", error);
    } finally {
      setIsRunning(false);
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy code:", error);
    }
  };

  return (
    <div className="my-5 relative">
      {isClient && (
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
          <Button
            variant="outline"
            size="sm"
            onClick={copyCode}
            className="h-8 px-2"
          >
            {copied ? (
              <CheckIcon className="w-4 h-4" />
            ) : (
              <CopyIcon className="w-4 h-4" />
            )}
          </Button>
        </div>
      )}
      
      <div className="relative">
        <pre className={`language-${language}`}>
          <code className={`language-${language}`}>
            {children}
          </code>
        </pre>
      </div>
      
      {hasRun && (
        <div className="mt-2 text-sm text-muted-foreground">
          ✓ Code executed in Shellviz
        </div>
      )}
    </div>
  );
}

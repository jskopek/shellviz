import { faLayerGroup } from "@fortawesome/free-solid-svg-icons";
import React, { useState } from "react";


// Evaluator: checks if data matches the stack array structure
function isStackData(data) {
  return Array.isArray(data) && data.every(
    frame => typeof frame === 'object' && 'function' in frame && 'filename' in frame && 'lineno' in frame && 'locals' in frame
  );
}

// Helper: pretty-print locals with type coloring and type labels (styled as flex rows, not table)
function LocalsBlock({ locals }) {
  if (!locals || Object.keys(locals).length === 0) return <div className="text-gray-400 italic">No locals</div>;
  // Helper to get type
  const getType = value => {
    if (value === null) return "null";
    if (Array.isArray(value)) return "array";
    if (typeof value === "number") return Number.isInteger(value) ? "int" : "float";
    return typeof value;
  };
  // Helper to format value
  const formatValue = (value, type) => {
    switch (type) {
      case "string": return <span className="text-orange-500">"{value}"</span>;
      case "int":
      case "float":
      case "number": return <span className="text-blue-500">{value}</span>;
      case "boolean": return <span className="text-purple-500">{value.toString()}</span>;
      case "null": return <span className="text-gray-400">null</span>;
      case "object": return <span className="text-gray-500">{JSON.stringify(value)}</span>;
      case "array": return <span className="text-gray-500">[{value.join(", ")}]</span>;
      default: return <span>{String(value)}</span>;
    }
  };
  return (
    <div className="font-mono text-sm space-y-1">
      {Object.entries(locals).map(([key, value], idx) => {
        const type = getType(value);
        return (
          <div key={idx} className="flex items-start">
            <span className="text-gray-800">"{key}"</span>
            <span className="text-gray-400 ml-1">{type}</span>
            <span className="ml-1">{formatValue(value, type)}</span>
          </div>
        );
      })}
    </div>
  );
}

// Accordion-style stack trace view with card and header
function StackAccordion({ stack }) {
  stack = stack.reverse()
  // Only topmost (last) frame expanded by default
  const [expandedFrames, setExpandedFrames] = useState(
    stack.reduce((acc, _, idx) => ({ ...acc, [idx]: idx === 0 }), {})
  );
  // Toggle a frame
  const toggleFrameExpanded = idx =>
    setExpandedFrames(prev => ({ ...prev, [idx]: !prev[idx] }));
  // SVGs for chevrons and function icon
  const ChevronDownSvg = (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M6 8l4 4 4-4" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
  );
  const ChevronRightSvg = (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M8 6l4 4-4 4" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
  );
  const FunctionIconSvg = (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="6" stroke="#6B7280" strokeWidth="1.5"/></svg>
  );
  return (
    <div className="font-mono text-sm">
      {stack.map((frame, idx) => {
        const hasLocals = frame.locals && Object.keys(frame.locals).length > 0;
        const expanded = expandedFrames[idx];
        return (
          <div key={idx} className="border-b last:border-b-0">
            {/* Frame header */}
            {hasLocals ? (
              <div
                className={`py-2 px-3 hover:bg-gray-50 cursor-pointer flex items-center ${idx === 0 ? "bg-gray-50" : ""}`}
                onClick={() => toggleFrameExpanded(idx)}
              >
                <span className="mr-2 flex-shrink-0">{expanded ? ChevronDownSvg : ChevronRightSvg}</span>
                <span className="mr-2 flex-shrink-0">{FunctionIconSvg}</span>
                <div className="text-xs text-gray-700">{frame.function}</div>
                <div className="text-xs text-gray-500 ml-auto flex-shrink-0">
                  {frame.filename}:{frame.lineno}
                  {frame.column ? `:${frame.column}` : ""}
                </div>
              </div>
            ) : (
              <div
                className={`py-2 px-3 flex items-center ${idx === 0 ? "bg-gray-50" : ""}`}
                // No onClick, not expandable
              >
                {/* No chevron */}
                <span className="mr-2 flex-shrink-0" />
                <span className="mr-2 flex-shrink-0">{FunctionIconSvg}</span>
                <div className="text-xs text-gray-700">{frame.function}</div>
                <div className="text-xs text-gray-500 ml-auto flex-shrink-0">
                  {frame.filename}:{frame.lineno}
                  {frame.column ? `:${frame.column}` : ""}
                </div>
              </div>
            )}
            {/* Frame details */}
            {hasLocals && expanded && (
              <div className="px-3 pb-3 pt-1">
                <div className="p-3 font-mono">
                  <LocalsBlock locals={frame.locals} />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export const StackView = {
  name: "stack",
  label: "Stack",
  icon: faLayerGroup,
  evaluator: isStackData,
  Component: ({ data }) => (
    <div className="p-2 max-w-full">
      <StackAccordion stack={data} />
    </div>
  ),
};

export default StackView;


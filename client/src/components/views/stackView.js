import { faLayerGroup } from "@fortawesome/free-solid-svg-icons";
import React, { useState } from "react";

// Evaluator: checks if data matches the stack array structure
function isStackData(data) {
  return Array.isArray(data) && data.every(
    frame => typeof frame === 'object' && 'function' in frame && 'filename' in frame && 'lineno' in frame && 'locals' in frame
  );
}

// Helper: pretty-print locals with type coloring and type labels
function LocalsTable({ locals }) {
  if (!locals || Object.keys(locals).length === 0) return <div className="text-gray-400 italic">No locals</div>;
  return (
    <table className="min-w-fit text-sm font-mono bg-gray-50 rounded mb-2">
      <tbody>
        {Object.entries(locals).map(([key, value]) => {
          let parsed, typeLabel, displayVal;
          try {
            parsed = JSON.parse(value);
            typeLabel = typeof parsed;
            displayVal = parsed;
          } catch {
            typeLabel = value === 'null' ? 'null' : (value.startsWith('"<') ? 'object' : 'str');
            displayVal = value;
          }
          let color =
            typeLabel === 'number' ? "text-blue-600" :
            typeLabel === 'string' ? "text-orange-600" :
            typeLabel === 'boolean' ? "text-purple-600" :
            typeLabel === 'object' ? "text-gray-800" :
            typeLabel === 'null' ? "text-gray-400" :
            "text-gray-800";
          return (
            <tr key={key}>
              <td className="pr-2 text-gray-500">"{key}"<span className="text-xs text-gray-400">: {typeLabel}</span></td>
              <td>
                <span className={color}>{typeof displayVal === 'string' ? displayVal.replace(/^"|"$/g, '') : JSON.stringify(displayVal)}</span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// Accordion-style stack trace view
function StackAccordion({ stack }) {
  // Only topmost (last) frame expanded by default
  const [open, setOpen] = useState([stack.length - 1]);
  const toggle = idx => setOpen(open => open.includes(idx) ? open.filter(i => i !== idx) : [...open, idx]);

  return (
    <div className="rounded border border-gray-200 divide-y divide-gray-100 bg-white">
      {stack.slice().reverse().map((frame, revIdx) => {
        const idx = stack.length - 1 - revIdx;
        const hasLocals = frame.locals && Object.keys(frame.locals).length > 0;
        const expanded = open.includes(idx);
        return (
          <div key={idx}>
            {hasLocals ? (
              <>
                <button
                  className="w-full flex items-center justify-between px-3 py-2 font-mono text-gray-900 bg-gray-50 hover:bg-gray-100 focus:outline-none"
                  onClick={() => toggle(idx)}
                  aria-expanded={expanded}
                  style={{ cursor: 'pointer' }}
                >
                  <span className="flex items-center">
                    <span className={expanded ? "mr-2" : "mr-2 rotate-90"}>
                      {expanded ? "▾" : "▸"}
                    </span>
                    <span className="font-semibold">{frame.function}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      {frame.filename.split("/").slice(-1)[0]}:{frame.lineno}
                    </span>
                  </span>
                  <span className="text-xs text-gray-400">{frame.code}</span>
                </button>
                {expanded && (
                  <div className="px-5 pb-2 pt-1 bg-white">
                    <LocalsTable locals={frame.locals} />
                  </div>
                )}
              </>
            ) : (
              <div className="w-full flex items-center justify-between px-3 py-2 font-mono text-gray-900 bg-gray-50">
                <span className="flex items-center">
                  <span className="mr-2 opacity-0">▸</span>
                  <span className="font-semibold">{frame.function}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    {frame.filename.split("/").slice(-1)[0]}:{frame.lineno}
                  </span>
                </span>
                <span className="text-xs text-gray-400">{frame.code}</span>
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


"use client";

import { useState, type ReactNode } from "react";

type ReadMoreProps = {
  children: ReactNode;
  lines?: number;
  className?: string;
};

export function ReadMore({
  children,
  lines = 3,
  className = "",
}: ReadMoreProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={className}>
      <div
        className={expanded ? "wrap-break-word" : "overflow-hidden wrap-break-word"}
        style={
          expanded
            ? undefined
            : {
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: lines,
              }
        }
      >
        {children}
      </div>

      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="mt-2 text-xs font-bold text-[#702f2b] underline underline-offset-4 transition hover:text-[#a8793d]"
      >
        {expanded ? "Read less" : "Read more"}
      </button>
    </div>
  );
}

"use client";

import { useState } from "react";

type WatchSynopsisProps = {
  description: string;
};

export function WatchSynopsis({ description }: WatchSynopsisProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Clean description from HTML tag if necessary, but keep structure
  const hasLongDescription = description.length > 280;

  return (
    <div className="space-y-2 text-left">
      <h3 className="font-semibold text-base text-white">Synopsis</h3>
      <div className="relative">
        <div
          className={`text-white/60 leading-relaxed text-sm transition-all duration-300 ${
            !isExpanded && hasLongDescription ? "max-h-24 overflow-hidden" : ""
          }`}
          dangerouslySetInnerHTML={{ __html: description }}
        />
        {!isExpanded && hasLongDescription && (
          <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[#111111] to-transparent pointer-events-none" />
        )}
      </div>
      {hasLongDescription && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs font-bold text-amber-500 hover:text-amber-400 transition-colors uppercase tracking-wider outline-none"
        >
          {isExpanded ? "Show Less" : "Read More"}
        </button>
      )}
    </div>
  );
}

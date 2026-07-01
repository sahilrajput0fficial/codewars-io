"use client";

/**
 * features/auth/components/copy-link-button.tsx
 * Copies the current page URL to clipboard with a 2-second "Copied!" feedback.
 */

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyLinkButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-3 h-8 text-xs font-semibold rounded-lg border border-cw-border text-cw-text-secondary transition-colors duration-fast ease-snap hover:text-cw-text-primary hover:border-cw-text-tertiary"
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5" style={{ color: "var(--color-success)" }} />
          <span>Copied!</span>
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" />
          <span>Copy Profile Link</span>
        </>
      )}
    </button>
  );
}

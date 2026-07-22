'use client';

import { useState } from 'react';

export function CopyEventLinkButton({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const url = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this event link:', url);
    }
  };

  return (
    <button type="button" className="btn-secondary" onClick={copy}>
      {copied ? 'Link copied' : 'Copy share link'}
    </button>
  );
}

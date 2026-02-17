"use client";
import React, { useState } from "react";

type Props = {
  symbol: string;
  isInWatchlist?: boolean;
  type?: "button" | "icon";
  onWatchlistChange?: (symbol: string, isAdded: boolean) => void;
};

export default function WatchlistButton({
  symbol,
  isInWatchlist = false,
  onWatchlistChange,
}: Props) {
  const [added, setAdded] = useState<boolean>(isInWatchlist);

  function toggle() {
    const next = !added;
    setAdded(next);
    if (onWatchlistChange) onWatchlistChange(symbol, next);
  }

  return (
    <button
      onClick={toggle}
      className={added ? "watchlist-btn bg-red-600!" : "watchlist-btn"}
      aria-pressed={added}
    >
      {added
        ? `Remove from Watchlist • ${symbol?.toUpperCase()}`
        : `Add ${symbol?.toUpperCase()} to Watchlist`}
    </button>
  );
}

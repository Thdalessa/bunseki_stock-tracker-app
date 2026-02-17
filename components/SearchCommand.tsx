"use client";

import { useEffect, useState } from "react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "./ui/button";
import { Loader2, StarIcon, TrendingUp } from "lucide-react";
import { isSea } from "node:sea";
import Link from "next/link";
import { searchStocks } from "@/lib/actions/finnhub.actions";
import { useDebounce } from "@/hooks/useDebounce";

export function SearchCommand({
  renderAs = "button",
  buttonLabel,
  initialStocks,
}: SearchCommandProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [stocks, setStocks] =
    useState<StockWithWatchlistStatus[]>(initialStocks);

  const isSearchMode = !!searchTerm.trim();
  const displayStocks = isSearchMode ? stocks : stocks?.slice(0, 5);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSearch = async () => {
    if (!isSearchMode) return setStocks(initialStocks);

    setLoading(true);
    try {
      const results = await searchStocks(searchTerm);
      setStocks(results);
    } catch (error) {
      console.error("Error searching stocks:", error);
      setStocks([]);
    } finally {
      setLoading(false);
    }
  };

  const debounceSearch = useDebounce(handleSearch, 300);

  useEffect(() => {
    debounceSearch();
  }, [searchTerm]);

  const handleSelectStock = (symbol: string) => {
    setOpen(false);
    setSearchTerm("");
    setStocks(initialStocks);
  };

  return (
    <>
      {renderAs === "text" ? (
        <span className="search-text" onClick={() => setOpen(true)}>
          {buttonLabel}
        </span>
      ) : (
        <Button onClick={() => setOpen(true)} className="search-btn">
          {buttonLabel}
        </Button>
      )}
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        className="search-dialog"
      >
        <div className="search-field">
          <CommandInput
            placeholder="Search stocks..."
            value={searchTerm}
            onValueChange={setSearchTerm}
            className="search-input"
          />
          {loading && <Loader2 className="search-loader" />}
        </div>
        <CommandList className="search-list">
          {loading ? (
            <CommandEmpty className="search-list-empty">
              Loading stocks...
            </CommandEmpty>
          ) : stocks.length === 0 ? (
            <CommandEmpty className="search-list-empty">
              {isSearchMode ? "No stocks found." : "No stocks available."}
            </CommandEmpty>
          ) : (
            <ul>
              <div className="search-count">
                {isSearchMode ? "Search results" : "Popular stocks"}
                {` `}
                {displayStocks.length || 0}
              </div>
              {displayStocks.map((stock) => (
                <li key={stock.symbol} className="search-item">
                  <Link
                    href={`/stock/${stock.symbol}`}
                    onClick={() => handleSelectStock(stock.symbol)}
                    className="search-item-link"
                  >
                    <TrendingUp className="h-4 w-4 text-gray-500" />
                    <div className="flex-1">
                      <div className="search-item-name">{stock.name}</div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {stock.symbol} | {stock.exchange} | {stock.type}
                    </div>
                  </Link>
                  {/* <StarIcon /> */}
                </li>
              ))}
            </ul>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}

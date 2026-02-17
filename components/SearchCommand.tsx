"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandList,
} from "@/components/ui/command";
import { Button } from "./ui/button";
import { Loader2, StarIcon, TrendingUp } from "lucide-react";
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
  const displayStocks = isSearchMode ? stocks : stocks?.slice(0, 10);

  const router = useRouter();
  // Keep stocks in sync with initialStocks prop
  useEffect(() => {
    setStocks(initialStocks);
  }, [initialStocks]);

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
  }, [searchTerm, debounceSearch]);

  const handleSelectStock = (symbol: string) => {
    setOpen(false);
    setSearchTerm("");
    setStocks(initialStocks);
    router.push(`/stock/${symbol}`);
  };

  return (
    <>
      {renderAs === "text" ? (
        <button
          type="button"
          className="search-text"
          onClick={() => setOpen(true)}
          aria-label={buttonLabel}
        >
          {buttonLabel}
        </button>
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
        <Command>
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
              <div className="search-list-empty">
                {isSearchMode ? "No stocks found." : "No stocks available."}
              </div>
            ) : (
              <ul className="p-0! pb-2 ">
                <div className="search-count ">
                  {isSearchMode ? "Search results" : "Popular stocks"}
                  {` `}
                  {displayStocks.length || 0}
                </div>
                {displayStocks.map((stock, i) => {
                  return (
                    <li
                      key={stock.symbol}
                      value={stock.symbol}
                      onClick={() => handleSelectStock(stock.symbol)}
                      className={`search-item my-0! p-0! ${i === stocks.length - 1 ? "rounded-b-sm!" : ""} hover:bg-gray-600`}
                    >
                      <div className="search-item-link flex items-center w-full py-2">
                        <TrendingUp className="h-4 w-4 text-gray-500" />
                        <div className="flex-1">
                          <div className="search-item-name">{stock.name}</div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {stock.symbol} |{" "}
                          {stock.exchange ? stock.exchange + "|" : ""}{" "}
                          {stock.type}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}

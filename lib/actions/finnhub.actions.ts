"use server";

import { formatArticle, getDateRange, validateArticle } from "@/lib/utils";
import { cache } from "react";
import { POPULAR_STOCK_SYMBOLS } from "../constants";

// Constants
const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";
const FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;

if (!FINNHUB_API_KEY) {
  throw new Error(
    "NEXT_PUBLIC_FINNHUB_API_KEY environment variable is required",
  );
}

/**
 * Fetch JSON from Finnhub API with caching support
 * @param url Full URL to fetch
 * @param revalidateSeconds Optional cache revalidation time in seconds
 * @returns Parsed JSON response
 */
const fetchJSON = async <T>(
  url: string,
  revalidateSeconds?: number,
): Promise<T> => {
  const options: RequestInit = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (revalidateSeconds) {
    options.cache = "force-cache";
    options.next = { revalidate: revalidateSeconds };
  } else {
    options.cache = "no-store";
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(
      `Finnhub API error: ${response.status} ${response.statusText}`,
    );
  }

  return response.json() as Promise<T>;
};

/**
 * Fetch news for given symbols or general market news
 * @param symbols Optional array of stock symbols
 * @returns Array of formatted news articles
 */
export const getNews = async (
  symbols?: string[],
): Promise<MarketNewsArticle[]> => {
  try {
    const articles: MarketNewsArticle[] = [];
    const dateRange = getDateRange(5);

    if (symbols && symbols.length > 0) {
      // Clean and uppercase symbols
      const cleanedSymbols = symbols
        .map((s) => s.trim().toUpperCase())
        .filter((s) => s.length > 0)
        .slice(0, 6);

      if (cleanedSymbols.length === 0) {
        throw new Error("No valid symbols provided");
      }

      // Round-robin through symbols, max 6 iterations
      const maxRounds = Math.min(6, cleanedSymbols.length);

      for (let round = 0; round < maxRounds; round++) {
        const symbolIndex = round % cleanedSymbols.length;
        const symbol = cleanedSymbols[symbolIndex];

        try {
          const url = `${FINNHUB_BASE_URL}/company-news?symbol=${symbol}&from=${dateRange.from}&to=${dateRange.to}&token=${FINNHUB_API_KEY}`;
          const response = await fetchJSON<RawNewsArticle[]>(url, 3600);

          // Find first valid article for this round
          const validArticle = response.find((article) =>
            validateArticle(article),
          );

          if (validArticle) {
            articles.push(formatArticle(validArticle, true, symbol, round));
          }
        } catch (error) {
          console.error(`Error fetching news for symbol ${symbol}:`, error);
          // Continue to next symbol on error
        }
      }

      if (articles.length === 0) {
        throw new Error("No valid articles found for provided symbols");
      }
    } else {
      // Fetch general market news
      try {
        const url = `${FINNHUB_BASE_URL}/news?category=general&minId=0&token=${FINNHUB_API_KEY}`;
        const response = await fetchJSON<RawNewsArticle[]>(url, 3600);

        // Deduplicate by id, url, and headline
        const seen = new Set<string>();
        const deduped: RawNewsArticle[] = [];

        for (const article of response) {
          if (!validateArticle(article)) continue;

          const key = `${article.id}-${article.url}-${article.headline}`;
          if (!seen.has(key)) {
            seen.add(key);
            deduped.push(article);
          }
        }

        // Take top 6 and format
        deduped.slice(0, 6).forEach((article, index) => {
          articles.push(formatArticle(article, false, undefined, index));
        });

        if (articles.length === 0) {
          throw new Error("No valid general news articles found");
        }
      } catch (error) {
        console.error("Error fetching general market news:", error);
        throw new Error("Failed to fetch news");
      }
    }

    // Sort by datetime (newest first)
    articles.sort((a, b) => b.datetime - a.datetime);

    return articles;
  } catch (error) {
    console.error("Error in getNews:", error);
    throw new Error("Failed to fetch news");
  }
};

export const searchStocks = cache(
  async (query?: string): Promise<StockWithWatchlistStatus[]> => {
    try {
      const token = FINNHUB_API_KEY;
      if (!token) {
        // If no token, log and return empty to avoid throwing per requirements
        console.error(
          "Error in stock search:",
          new Error("FINNHUB API key is not configured"),
        );
        return [];
      }

      const trimmed = typeof query === "string" ? query.trim() : "";

      let results: FinnhubSearchResult[] = [];

      if (!trimmed) {
        // Fetch top 10 popular symbols' profiles
        const top = POPULAR_STOCK_SYMBOLS.slice(0, 10);
        const profiles = await Promise.all(
          top.map(async (sym) => {
            try {
              const url = `${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(sym)}&token=${token}`;
              // Revalidate every hour
              const profile = await fetchJSON<any>(url, 3600);
              return { sym, profile } as { sym: string; profile: any };
            } catch (e) {
              console.error("Error fetching profile2 for", sym, e);
              return { sym, profile: null } as { sym: string; profile: any };
            }
          }),
        );

        results = profiles
          .map(({ sym, profile }) => {
            const symbol = sym.toUpperCase();
            const name: string | undefined =
              profile?.name || profile?.ticker || undefined;
            const exchange: string | undefined = profile?.exchange || undefined;
            if (!name) return undefined;
            const r: FinnhubSearchResult = {
              symbol,
              description: name,
              displaySymbol: symbol,
              type: "Common Stock",
            };
            // We don't include exchange in FinnhubSearchResult type, so carry via mapping later using profile
            // To keep pipeline simple, attach exchange via closure map stage
            // We'll reconstruct exchange when mapping to final type
            (r as any).__exchange = exchange; // internal only
            return r;
          })
          .filter((x): x is FinnhubSearchResult => Boolean(x));
      } else {
        const url = `${FINNHUB_BASE_URL}/search?q=${encodeURIComponent(trimmed)}&token=${token}`;
        const data = await fetchJSON<FinnhubSearchResponse>(url, 1800);
        results = Array.isArray(data?.result) ? data.result : [];
      }

      const mapped: StockWithWatchlistStatus[] = results
        .map((r) => {
          const upper = (r.symbol || "").toUpperCase();
          const name = r.description || upper;
          const exchangeFromDisplay =
            (r.displaySymbol as string | undefined) || undefined;
          const exchangeFromProfile = (r as any).__exchange as
            | string
            | undefined;
          const exchange = exchangeFromDisplay || exchangeFromProfile || "US";
          const type = r.type || "Stock";
          const item: StockWithWatchlistStatus = {
            symbol: upper,
            name,
            exchange,
            type,
            isInWatchlist: false,
          };
          return item;
        })
        .slice(0, 15);

      return mapped;
    } catch (err) {
      console.error("Error in stock search:", err);
      return [];
    }
  },
);

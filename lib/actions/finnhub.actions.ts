"use server";

import { formatArticle, getDateRange, validateArticle } from "@/lib/utils";

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

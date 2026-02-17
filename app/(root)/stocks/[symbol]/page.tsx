import React from "react";
import TradingViewWidget from "@/components/TradingViewWidget";
import WatchlistButton from "@/components/WatchlistButton";
import {
  baseUrl,
  SYMBOL_INFO_WIDGET_CONFIG,
  CANDLE_CHART_WIDGET_CONFIG,
  TECHNICAL_ANALYSIS_WIDGET_CONFIG,
  COMPANY_FINANCIALS_WIDGET_CONFIG,
} from "@/lib/constants";

type Props = {
  params: Promise<{ symbol: string }>;
};

const StockDetails = async ({ params }: Props) => {
  const { symbol } = await params;

  return (
    <div className="h-full">
      <div className="grid grid-cols-1 lg:grid-cols-3  gap-6 h-full">
        {/* Left column */}
        <section className="lg:col-span-2 h-full flex flex-col gap-4">
          <TradingViewWidget
            scriptUrl={`${baseUrl}symbol-info.js`}
            config={SYMBOL_INFO_WIDGET_CONFIG(symbol)}
          />

          <TradingViewWidget
            scriptUrl={`${baseUrl}advanced-chart.js`}
            config={CANDLE_CHART_WIDGET_CONFIG(symbol)}
            className="custom-chart"
          />

          {/* <TradingViewWidget
            scriptUrl={`${baseUrl}advanced-chart.js`}
            config={BASELINE_WIDGET_CONFIG(symbol)}
            className="custom-chart"
          /> */}
        </section>

        {/* Right column */}
        <aside className="lg:col-span-1 space-y-4 h-full">
          <WatchlistButton symbol={symbol} isInWatchlist={false} />

          <TradingViewWidget
            scriptUrl={`${baseUrl}technical-analysis.js`}
            config={TECHNICAL_ANALYSIS_WIDGET_CONFIG(symbol)}
          />

          <TradingViewWidget
            scriptUrl={`${baseUrl}financials.js`}
            config={COMPANY_FINANCIALS_WIDGET_CONFIG(symbol)}
          />
        </aside>
      </div>
    </div>
  );
};

export default StockDetails;

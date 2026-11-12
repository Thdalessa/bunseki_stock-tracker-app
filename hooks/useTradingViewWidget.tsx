import { useEffect, useRef } from "react";

const useTradingViewWidget = (
  scriptUrl: string,
  config: Record<string, unknown>,
  height: number = 600
) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Callers pass `config` as an inline object, so its identity changes on
  // every render. Depending on the serialized string re-initialises the
  // widget only when the config's content actually changes.
  const configJson = JSON.stringify(config);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (container.dataset.loaded) return;
    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    widgetDiv.style.width = "100%";
    widgetDiv.style.height = `${height}px`;
    container.innerHTML = "";
    container.appendChild(widgetDiv);
    const script = document.createElement("script");
    script.src = scriptUrl;
    script.async = true;
    script.textContent = configJson;
    container.appendChild(script);
    container.dataset.loaded = "true";

    return () => {
      container.innerHTML = "";
      delete container.dataset.loaded;
    };
  }, [scriptUrl, configJson, height]);

  return containerRef;
};

export default useTradingViewWidget;

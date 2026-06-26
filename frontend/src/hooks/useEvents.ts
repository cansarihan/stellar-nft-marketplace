import { useEffect, useRef, useState } from "react";
import { EventStreamer, type MarketEvent } from "../lib/events";

const MAX_EVENTS = 40;

/**
 * Subscribe to the on-chain event stream. `onActivity` fires whenever new
 * events land so the caller can refresh derived state (e.g. the gallery).
 */
export function useEvents(onActivity?: () => void) {
  const [events, setEvents] = useState<MarketEvent[]>([]);
  const [live, setLive] = useState(false);
  const onActivityRef = useRef(onActivity);
  onActivityRef.current = onActivity;

  useEffect(() => {
    const streamer = new EventStreamer();
    let cancelled = false;

    streamer
      .start((incoming) => {
        if (cancelled) return;
        setLive(true);
        setEvents((prev) => {
          const seen = new Set(prev.map((e) => e.id));
          const fresh = incoming.filter((e) => !seen.has(e.id));
          if (fresh.length === 0) return prev;
          onActivityRef.current?.();
          return [...fresh.reverse(), ...prev].slice(0, MAX_EVENTS);
        });
      })
      .catch((err) => console.warn("event stream failed to start", err));

    return () => {
      cancelled = true;
      streamer.stop();
    };
  }, []);

  return { events, live };
}

import { describeEvent, type MarketEvent } from "../lib/events";
import { EXPLORER_TX } from "../config";

const ICONS: Record<string, string> = {
  mint: "🪙",
  listed: "🏷️",
  sold: "✅",
  cancelled: "↩️",
  transfer: "🔁",
  approve: "🔑",
  unknown: "•",
};

export function EventFeed({
  events,
  live,
}: {
  events: MarketEvent[];
  live: boolean;
}) {
  return (
    <aside className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Live activity</h2>
        <span className="flex items-center gap-1.5 text-[11px] text-white/50">
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              live ? "animate-pulse bg-emerald-400" : "bg-white/30"
            }`}
          />
          {live ? "streaming" : "connecting…"}
        </span>
      </div>

      {events.length === 0 ? (
        <p className="py-6 text-center text-xs text-white/40">
          Waiting for on-chain activity…
        </p>
      ) : (
        <ul className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto">
          {events.map((e) => (
            <li
              key={e.id}
              className="flex items-start gap-2 rounded-lg bg-black/20 px-3 py-2"
            >
              <span className="text-base">{ICONS[e.kind] ?? "•"}</span>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-white/90">{describeEvent(e)}</p>
                <p className="text-[10px] text-white/40">
                  ledger {e.ledger}
                  {e.txHash && (
                    <>
                      {" · "}
                      <a
                        href={EXPLORER_TX(e.txHash)}
                        target="_blank"
                        rel="noreferrer"
                        className="underline hover:text-indigo-300"
                      >
                        tx
                      </a>
                    </>
                  )}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}

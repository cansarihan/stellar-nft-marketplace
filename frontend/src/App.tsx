import { useCallback, useEffect, useRef, useState } from "react";
import { Header } from "./components/Header";
import { MintForm } from "./components/MintForm";
import { Gallery } from "./components/Gallery";
import { EventFeed } from "./components/EventFeed";
import { useWallet } from "./hooks/useWallet";
import { useEvents } from "./hooks/useEvents";
import { loadItems, type NftItem } from "./lib/market";
import { EXPLORER_TX } from "./config";

export default function App() {
  const wallet = useWallet();
  const [items, setItems] = useState<NftItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; hash?: string } | null>(null);

  // guard against overlapping refreshes triggered by rapid events/actions
  const refreshing = useRef(false);

  const refresh = useCallback(async () => {
    if (refreshing.current) return;
    refreshing.current = true;
    setError(null);
    try {
      setItems(await loadItems());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load marketplace");
    } finally {
      setLoading(false);
      refreshing.current = false;
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // real-time: refresh the gallery whenever new contract events arrive
  const { events, live } = useEvents(refresh);

  const onTx = useCallback(
    (hash: string) => {
      setToast({ msg: "Transaction confirmed", hash: hash || undefined });
      void refresh();
    },
    [refresh],
  );

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <div className="min-h-screen text-white">
      <Header wallet={wallet} />

      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <MintForm address={wallet.address} onMinted={onTx} />
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Marketplace</h2>
              <button
                onClick={refresh}
                className="text-xs text-indigo-300 hover:text-indigo-200"
              >
                ↻ Refresh
              </button>
            </div>
            <Gallery
              items={items}
              loading={loading}
              error={error}
              address={wallet.address}
              onAction={onTx}
              onRetry={refresh}
            />
          </section>
        </div>

        <EventFeed events={events} live={live} />
      </main>

      {toast && (
        <div className="fixed inset-x-0 bottom-4 z-30 flex justify-center px-4">
          <div className="flex items-center gap-3 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-4 py-2 text-sm text-emerald-200 backdrop-blur">
            ✅ {toast.msg}
            {toast.hash && (
              <a
                href={EXPLORER_TX(toast.hash)}
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-white"
              >
                view tx
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

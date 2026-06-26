import { useState } from "react";
import type { NftItem } from "../lib/market";
import { buy, cancel, listForSale } from "../lib/actions";
import { shorten, stroopsToXlm, xlmToStroops } from "../lib/format";
import { MARKETPLACE_CONTRACT_ID } from "../config";

interface Props {
  item: NftItem;
  address: string | null;
  onAction: (txHash: string) => void;
}

export function NftCard({ item, address, onAction }: Props) {
  const [price, setPrice] = useState("");
  const [busy, setBusy] = useState<null | "buy" | "list" | "cancel">(null);
  const [error, setError] = useState<string | null>(null);

  const isListed = Boolean(item.listing);
  const iAmSeller = address && item.listing?.seller === address;
  // when escrowed, owner == marketplace; the seller field is the real owner
  const iAmOwner =
    address &&
    (item.owner === address ||
      (item.owner === MARKETPLACE_CONTRACT_ID && iAmSeller));

  async function run(kind: "buy" | "list" | "cancel") {
    if (!address) return;
    setBusy(kind);
    setError(null);
    try {
      let hash = "";
      if (kind === "buy") hash = await buy(address, item.id);
      if (kind === "cancel") hash = await cancel(address, item.id);
      if (kind === "list") hash = await listForSale(address, item.id, xlmToStroops(price));
      setPrice("");
      onAction(hash);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transaction failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition hover:border-indigo-400/40">
      <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-indigo-500/30 via-fuchsia-500/20 to-cyan-400/20 text-5xl">
        🖼️
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center justify-between">
          <span className="font-bold text-white">NFT #{item.id.toString()}</span>
          {isListed ? (
            <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-xs font-medium text-emerald-300">
              {stroopsToXlm(item.listing!.price)} XLM
            </span>
          ) : (
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/60">
              Not listed
            </span>
          )}
        </div>
        <p className="truncate text-xs text-indigo-300/70" title={item.uri}>
          {item.uri}
        </p>
        <p className="text-[11px] text-white/40">
          Owner: {shorten(isListed ? item.listing!.seller : item.owner)}
          {isListed && " (escrow)"}
        </p>

        <div className="mt-auto pt-2">
          {isListed && !iAmSeller && (
            <button
              onClick={() => run("buy")}
              disabled={!address || busy !== null}
              className="w-full rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-50"
            >
              {busy === "buy" ? "Buying…" : "Buy"}
            </button>
          )}

          {isListed && iAmSeller && (
            <button
              onClick={() => run("cancel")}
              disabled={busy !== null}
              className="w-full rounded-lg border border-red-400/40 bg-red-400/10 px-3 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-400/20 disabled:opacity-50"
            >
              {busy === "cancel" ? "Cancelling…" : "Cancel listing"}
            </button>
          )}

          {!isListed && iAmOwner && (
            <div className="flex gap-2">
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                inputMode="decimal"
                placeholder="Price (XLM)"
                className="w-full min-w-0 flex-1 rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-sm text-white placeholder:text-white/30 focus:border-indigo-400 focus:outline-none"
              />
              <button
                onClick={() => run("list")}
                disabled={busy !== null || price.trim() === ""}
                className="rounded-lg bg-indigo-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-50"
              >
                {busy === "list" ? "…" : "List"}
              </button>
            </div>
          )}

          {!isListed && !iAmOwner && (
            <p className="text-center text-xs text-white/30">Owned by collector</p>
          )}
        </div>
        {error && <p className="text-xs text-red-300">{error}</p>}
      </div>
    </article>
  );
}

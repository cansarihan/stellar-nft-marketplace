import type { NftItem } from "../lib/market";
import { NftCard } from "./NftCard";

interface Props {
  items: NftItem[];
  loading: boolean;
  error: string | null;
  address: string | null;
  onAction: (txHash: string) => void;
  onRetry: () => void;
}

export function Gallery({ items, loading, error, address, onAction, onRetry }: Props) {
  if (loading && items.length === 0) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-72 animate-pulse rounded-2xl border border-white/10 bg-white/5"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-400/30 bg-red-400/5 p-8 text-center">
        <p className="text-sm text-red-300">{error}</p>
        <button
          onClick={onRetry}
          className="mt-3 rounded-lg bg-red-500/80 px-4 py-2 text-sm font-medium text-white hover:bg-red-500"
        >
          Retry
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-white/50">
        No NFTs yet. Mint the first one above! ✨
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <NftCard
          key={item.id.toString()}
          item={item}
          address={address}
          onAction={onAction}
        />
      ))}
    </div>
  );
}

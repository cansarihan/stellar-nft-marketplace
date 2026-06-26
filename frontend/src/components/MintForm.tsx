import { useState } from "react";
import { mint } from "../lib/actions";

export function MintForm({
  address,
  onMinted,
}: {
  address: string | null;
  onMinted: (txHash: string) => void;
}) {
  const [uri, setUri] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disabled = !address || busy;

  async function handleMint(e: React.FormEvent) {
    e.preventDefault();
    if (!address) return;
    setBusy(true);
    setError(null);
    try {
      const value = uri.trim() || `ipfs://demo/${Date.now()}.json`;
      const hash = await mint(address, value);
      setUri("");
      onMinted(hash);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mint failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={handleMint}
      className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5"
    >
      <h2 className="mb-1 text-sm font-semibold text-white">Mint a new NFT</h2>
      <p className="mb-3 text-xs text-indigo-300/70">
        Provide a metadata URI (IPFS, HTTPS…) or leave blank for a demo token.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={uri}
          onChange={(e) => setUri(e.target.value)}
          placeholder="ipfs://… / https://…"
          className="w-full flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-indigo-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={disabled}
          className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Minting…" : "Mint"}
        </button>
      </div>
      {!address && (
        <p className="mt-2 text-xs text-amber-300/80">
          Connect your wallet to mint.
        </p>
      )}
      {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
    </form>
  );
}

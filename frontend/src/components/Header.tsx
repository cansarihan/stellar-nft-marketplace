import { shorten } from "../lib/format";
import type { WalletState } from "../hooks/useWallet";

export function Header({ wallet }: { wallet: WalletState }) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0b0b14]/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">✦</span>
          <div>
            <h1 className="text-base font-bold text-white sm:text-lg">
              Stellar NFT Marketplace
            </h1>
            <p className="text-[11px] text-indigo-300/80">
              Soroban · Testnet · escrow-based trading
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {wallet.address ? (
            <button
              onClick={wallet.disconnect}
              className="group rounded-full border border-emerald-400/40 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-400/20"
              title={wallet.address}
            >
              <span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-400" />
              {shorten(wallet.address)}
              <span className="ml-2 text-emerald-300/60 group-hover:text-emerald-200">
                ⏻
              </span>
            </button>
          ) : (
            <button
              onClick={wallet.connect}
              disabled={wallet.connecting}
              className="rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-50"
            >
              {wallet.connecting ? "Connecting…" : "Connect Freighter"}
            </button>
          )}
        </div>
      </div>
      {wallet.error && (
        <p className="bg-red-500/10 px-4 py-2 text-center text-xs text-red-300">
          {wallet.error}
          {!wallet.installed && (
            <>
              {" "}
              —{" "}
              <a
                className="underline"
                href="https://www.freighter.app/"
                target="_blank"
                rel="noreferrer"
              >
                install Freighter
              </a>
            </>
          )}
        </p>
      )}
    </header>
  );
}

import { useCallback, useEffect, useState } from "react";
import {
  connect as freighterConnect,
  currentAddress,
  freighterInstalled,
} from "../lib/wallet";

export interface WalletState {
  address: string | null;
  installed: boolean;
  connecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

export function useWallet(): WalletState {
  const [address, setAddress] = useState<string | null>(null);
  const [installed, setInstalled] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const has = await freighterInstalled();
      if (!active) return;
      setInstalled(has);
      if (has) {
        const addr = await currentAddress();
        if (active) setAddress(addr);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      if (!(await freighterInstalled())) {
        setInstalled(false);
        throw new Error("Freighter wallet is not installed");
      }
      setAddress(await freighterConnect());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to connect");
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => setAddress(null), []);

  return { address, installed, connecting, error, connect, disconnect };
}

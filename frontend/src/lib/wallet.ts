import {
  isConnected,
  requestAccess,
  getAddress,
  signTransaction,
  getNetwork,
} from "@stellar/freighter-api";
import { NETWORK_PASSPHRASE } from "../config";

export class WalletError extends Error {}

/** Whether the Freighter extension is installed and reachable. */
export async function freighterInstalled(): Promise<boolean> {
  try {
    const res = await isConnected();
    return Boolean(res.isConnected);
  } catch {
    return false;
  }
}

/** Prompt the user to connect and return the selected public key. */
export async function connect(): Promise<string> {
  const access = await requestAccess();
  if (access.error) throw new WalletError(access.error);
  if (!access.address) throw new WalletError("No account selected in Freighter");
  return access.address;
}

/** Read the already-authorized address, or null if not connected. */
export async function currentAddress(): Promise<string | null> {
  try {
    const res = await getAddress();
    if (res.error || !res.address) return null;
    return res.address;
  } catch {
    return null;
  }
}

/** Ensure Freighter is pointed at the same network as the app. */
export async function assertNetwork(): Promise<void> {
  const net = await getNetwork();
  if (net.error) throw new WalletError(net.error);
  if (net.networkPassphrase && net.networkPassphrase !== NETWORK_PASSPHRASE) {
    throw new WalletError(
      `Freighter is on the wrong network. Please switch to Testnet.`,
    );
  }
}

/**
 * Signer compatible with stellar-sdk's AssembledTransaction.signAndSend().
 * Delegates the actual signing to the Freighter extension.
 */
export async function signWithFreighter(
  xdr: string,
  opts?: { networkPassphrase?: string },
): Promise<{ signedTxXdr: string; signerAddress?: string }> {
  const result = await signTransaction(xdr, {
    networkPassphrase: opts?.networkPassphrase ?? NETWORK_PASSPHRASE,
  });
  if (result.error) throw new WalletError(String(result.error));
  return {
    signedTxXdr: result.signedTxXdr,
    signerAddress: result.signerAddress,
  };
}

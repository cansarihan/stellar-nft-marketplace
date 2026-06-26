import { nftClient, marketplaceClient } from "./clients";

/**
 * All four write actions follow the same shape:
 *   1. build + simulate the invocation (typed binding),
 *   2. sign the transaction envelope with Freighter,
 *   3. submit and wait for confirmation,
 *   4. return the transaction hash for the UI / explorer link.
 *
 * The connected wallet is always the transaction source, so Soroban's
 * source-account authorization covers every `require_auth` in these flows.
 */

async function send(tx: { signAndSend: () => Promise<unknown> }): Promise<string> {
  const sent = (await tx.signAndSend()) as {
    sendTransactionResponse?: { hash?: string };
    getTransactionResponse?: { txHash?: string };
  };
  return (
    sent.sendTransactionResponse?.hash ??
    sent.getTransactionResponse?.txHash ??
    ""
  );
}

export async function mint(publicKey: string, uri: string): Promise<string> {
  const nft = nftClient({ publicKey });
  const tx = await nft.mint({ to: publicKey, uri });
  return send(tx);
}

export async function listForSale(
  publicKey: string,
  tokenId: bigint,
  priceStroops: bigint,
): Promise<string> {
  const market = marketplaceClient({ publicKey });
  const tx = await market.list({
    seller: publicKey,
    token_id: tokenId,
    price: priceStroops,
  });
  return send(tx);
}

export async function buy(publicKey: string, tokenId: bigint): Promise<string> {
  const market = marketplaceClient({ publicKey });
  const tx = await market.buy({ buyer: publicKey, token_id: tokenId });
  return send(tx);
}

export async function cancel(publicKey: string, tokenId: bigint): Promise<string> {
  const market = marketplaceClient({ publicKey });
  const tx = await market.cancel({ token_id: tokenId });
  return send(tx);
}

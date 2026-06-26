import { Client as NftClient } from "../contracts/nft";
import { Client as MarketplaceClient } from "../contracts/marketplace";
import {
  NETWORK_PASSPHRASE,
  RPC_URL,
  NFT_CONTRACT_ID,
  MARKETPLACE_CONTRACT_ID,
} from "../config";
import { signWithFreighter } from "./wallet";

interface ClientCtx {
  /** Connected wallet address; omit for read-only (simulation) clients. */
  publicKey?: string;
}

function baseOptions(ctx: ClientCtx) {
  return {
    networkPassphrase: NETWORK_PASSPHRASE,
    rpcUrl: RPC_URL,
    allowHttp: RPC_URL.startsWith("http://"),
    publicKey: ctx.publicKey,
    // only attach a signer when we have a connected wallet
    signTransaction: ctx.publicKey ? signWithFreighter : undefined,
  };
}

export function nftClient(ctx: ClientCtx = {}): NftClient {
  return new NftClient({ ...baseOptions(ctx), contractId: NFT_CONTRACT_ID });
}

export function marketplaceClient(ctx: ClientCtx = {}): MarketplaceClient {
  return new MarketplaceClient({
    ...baseOptions(ctx),
    contractId: MARKETPLACE_CONTRACT_ID,
  });
}

// Network + contract configuration.
//
// Values fall back to the live testnet deployment so the app works out of the
// box, but every value can be overridden via Vite env vars (see .env.example).

export const NETWORK_PASSPHRASE =
  import.meta.env.VITE_NETWORK_PASSPHRASE ?? "Test SDF Network ; September 2015";

export const RPC_URL =
  import.meta.env.VITE_RPC_URL ?? "https://soroban-testnet.stellar.org";

export const NFT_CONTRACT_ID =
  import.meta.env.VITE_NFT_CONTRACT ??
  "CBRYT3WCYXUINJCW7TV5NRRWROGNFVCG6TA6SMSK4MUDIDJYDLZS7RKF";

export const MARKETPLACE_CONTRACT_ID =
  import.meta.env.VITE_MARKETPLACE_CONTRACT ??
  "CB5ZDO6BPMMWWA3JWOHYEDTMEEY2S37IOEGBXLBS3BJW4MXUODKG4RJ2";

export const PAY_TOKEN_ID =
  import.meta.env.VITE_PAY_TOKEN ??
  "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";

export const EXPLORER_TX = (hash: string) =>
  `https://stellar.expert/explorer/testnet/tx/${hash}`;

export const EXPLORER_CONTRACT = (id: string) =>
  `https://stellar.expert/explorer/testnet/contract/${id}`;

// XLM has 7 decimal places (1 XLM = 10_000_000 stroops).
export const STROOPS_PER_XLM = 10_000_000n;

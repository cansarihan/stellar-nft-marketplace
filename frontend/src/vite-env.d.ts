/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NETWORK_PASSPHRASE?: string;
  readonly VITE_RPC_URL?: string;
  readonly VITE_NFT_CONTRACT?: string;
  readonly VITE_MARKETPLACE_CONTRACT?: string;
  readonly VITE_PAY_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

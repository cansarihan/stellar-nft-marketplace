#!/usr/bin/env bash
#
# Reproducible deployment workflow for the Stellar NFT Marketplace.
#
# Usage:
#   ./scripts/deploy.sh [network] [identity]
#
# Examples:
#   ./scripts/deploy.sh testnet deployer
#
# Prerequisites:
#   - stellar CLI (>= 22)
#   - a funded identity:  stellar keys generate <id> --network testnet --fund
#
# The script builds both contracts, deploys them, wires the marketplace to the
# NFT + payment token, and prints a copy-paste block for the frontend config.
set -euo pipefail

NETWORK="${1:-testnet}"
IDENTITY="${2:-deployer}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "▶ Building contracts…"
stellar contract build >/dev/null

NFT_WASM="target/wasm32v1-none/release/nft.wasm"
MKT_WASM="target/wasm32v1-none/release/marketplace.wasm"

ADMIN="$(stellar keys address "$IDENTITY")"
echo "▶ Admin / deployer: $ADMIN"

echo "▶ Deploying NFT contract…"
NFT_ID="$(stellar contract deploy --wasm "$NFT_WASM" --source "$IDENTITY" --network "$NETWORK")"

echo "▶ Deploying Marketplace contract…"
MKT_ID="$(stellar contract deploy --wasm "$MKT_WASM" --source "$IDENTITY" --network "$NETWORK")"

echo "▶ Resolving native (XLM) payment token…"
PAY_TOKEN="$(stellar contract id asset --asset native --network "$NETWORK")"

echo "▶ Initializing NFT contract…"
stellar contract invoke --id "$NFT_ID" --source "$IDENTITY" --network "$NETWORK" \
  -- init --admin "$ADMIN" >/dev/null

echo "▶ Initializing Marketplace contract…"
stellar contract invoke --id "$MKT_ID" --source "$IDENTITY" --network "$NETWORK" \
  -- init --admin "$ADMIN" --nft_contract "$NFT_ID" --pay_token "$PAY_TOKEN" >/dev/null

cat <<EOF

✅ Deployment complete.

Frontend env (frontend/.env.local):
  VITE_NFT_CONTRACT="$NFT_ID"
  VITE_MARKETPLACE_CONTRACT="$MKT_ID"
  VITE_PAY_TOKEN="$PAY_TOKEN"

Regenerate typed bindings (optional):
  stellar contract bindings typescript --network $NETWORK --id $NFT_ID --output-dir frontend/packages/nft-client --overwrite
  stellar contract bindings typescript --network $NETWORK --id $MKT_ID --output-dir frontend/packages/marketplace-client --overwrite
EOF

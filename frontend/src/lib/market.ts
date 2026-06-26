import { nftClient, marketplaceClient } from "./clients";

export interface Listing {
  seller: string;
  price: bigint;
}

export interface NftItem {
  id: bigint;
  owner: string;
  uri: string;
  listing?: Listing;
}

/**
 * Load every minted token together with its current listing (if any).
 *
 * Reads are pure simulations — no wallet or signature required — so the gallery
 * renders for anonymous visitors too.
 */
export async function loadItems(): Promise<NftItem[]> {
  const nft = nftClient();
  const market = marketplaceClient();

  const total = (await nft.total_supply()).result as bigint;

  const items: NftItem[] = [];
  for (let id = 1n; id <= total; id++) {
    const [ownerTx, uriTx, listingTx] = await Promise.all([
      nft.owner_of({ token_id: id }),
      nft.token_uri({ token_id: id }),
      market.get_listing({ token_id: id }),
    ]);

    const owner = unwrap<string>(ownerTx.result);
    const uri = unwrap<string>(uriTx.result);
    const rawListing = listingTx.result as
      | { seller: string; price: bigint }
      | undefined;

    items.push({
      id,
      owner,
      uri,
      listing: rawListing
        ? { seller: rawListing.seller, price: BigInt(rawListing.price) }
        : undefined,
    });
  }

  // newest first
  return items.reverse();
}

// The contract returns `Result<T, Error>`; the bindings expose `.unwrap()`.
function unwrap<T>(result: unknown): T {
  if (result && typeof (result as { unwrap?: unknown }).unwrap === "function") {
    return (result as { unwrap: () => T }).unwrap();
  }
  return result as T;
}

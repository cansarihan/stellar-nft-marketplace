#![cfg(test)]

use super::*;
use nft::{Nft, NftClient as NftFullClient};
use soroban_sdk::{testutils::Address as _, token, Address, Env, String};

struct World {
    env: Env,
    market: MarketplaceClient<'static>,
    nft: NftFullClient<'static>,
    token_admin: token::StellarAssetClient<'static>,
    token: token::Client<'static>,
}

fn setup() -> World {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);

    // NFT contract
    let nft_id = env.register(Nft, ());
    let nft = NftFullClient::new(&env, &nft_id);
    nft.init(&admin);

    // Payment token (Stellar Asset Contract)
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let token_addr = sac.address();
    let token_admin = token::StellarAssetClient::new(&env, &token_addr);
    let token = token::Client::new(&env, &token_addr);

    // Marketplace contract
    let market_id = env.register(Marketplace, ());
    let market = MarketplaceClient::new(&env, &market_id);
    market.init(&admin, &nft_id, &token_addr);

    World {
        env,
        market,
        nft,
        token_admin,
        token,
    }
}

fn mint_to(w: &World, owner: &Address) -> u128 {
    let uri = String::from_str(&w.env, "ipfs://art");
    w.nft.mint(owner, &uri)
}

#[test]
fn test_list_escrows_nft() {
    let w = setup();
    let seller = Address::generate(&w.env);
    let id = mint_to(&w, &seller);

    w.market.list(&seller, &id, &100);

    // NFT now held by the marketplace (escrow)
    assert_eq!(w.nft.owner_of(&id), w.market.address);
    let listing = w.market.get_listing(&id).unwrap();
    assert_eq!(listing.seller, seller);
    assert_eq!(listing.price, 100);
}

#[test]
fn test_buy_transfers_nft_and_pays_seller() {
    let w = setup();
    let seller = Address::generate(&w.env);
    let buyer = Address::generate(&w.env);
    w.token_admin.mint(&buyer, &1_000);

    let id = mint_to(&w, &seller);
    w.market.list(&seller, &id, &250);
    w.market.buy(&buyer, &id);

    // ownership moved to buyer, listing cleared
    assert_eq!(w.nft.owner_of(&id), buyer);
    assert!(w.market.get_listing(&id).is_none());
    // funds moved buyer -> seller
    assert_eq!(w.token.balance(&seller), 250);
    assert_eq!(w.token.balance(&buyer), 750);
}

#[test]
fn test_cancel_returns_nft_to_seller() {
    let w = setup();
    let seller = Address::generate(&w.env);
    let id = mint_to(&w, &seller);

    w.market.list(&seller, &id, &100);
    w.market.cancel(&id);

    assert_eq!(w.nft.owner_of(&id), seller);
    assert!(w.market.get_listing(&id).is_none());
}

#[test]
fn test_buy_unlisted_fails() {
    let w = setup();
    let buyer = Address::generate(&w.env);
    let res = w.market.try_buy(&buyer, &999);
    assert_eq!(res, Err(Ok(Error::NotListed)));
}

#[test]
fn test_double_list_fails() {
    let w = setup();
    let seller = Address::generate(&w.env);
    let id = mint_to(&w, &seller);
    w.market.list(&seller, &id, &100);
    // already escrowed; second list must fail
    let res = w.market.try_list(&seller, &id, &100);
    assert_eq!(res, Err(Ok(Error::AlreadyListed)));
}

#[test]
fn test_list_invalid_price_fails() {
    let w = setup();
    let seller = Address::generate(&w.env);
    let id = mint_to(&w, &seller);
    let res = w.market.try_list(&seller, &id, &0);
    assert_eq!(res, Err(Ok(Error::InvalidPrice)));
}

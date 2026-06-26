#![no_std]
//! NFT marketplace contract with on-chain escrow.
//!
//! Demonstrates **inter-contract communication**: the marketplace calls into the
//! NFT contract (to escrow / release tokens) and into a token contract (to settle
//! payment). The flow is:
//!
//! 1. `list`   — seller authorizes; marketplace pulls the NFT into escrow.
//! 2. `buy`    — buyer authorizes; marketplace pays the seller and releases the NFT.
//! 3. `cancel` — seller authorizes; marketplace returns the escrowed NFT.
//!
//! Every step emits an event for the real-time frontend feed.

use soroban_sdk::{
    contract, contractclient, contracterror, contractimpl, contracttype, symbol_short, token,
    Address, Env, Symbol,
};

/// Minimal view of the NFT contract that the marketplace needs to call.
///
/// Declaring it as a `#[contractclient]` trait generates a typed cross-contract
/// `NftClient` **without** linking the NFT contract's own exported entrypoints
/// into this contract's WASM (which would collide on shared names like `init`).
#[contractclient(name = "NftClient")]
pub trait NftInterface {
    fn transfer(env: Env, from: Address, to: Address, token_id: u128);
}

const LISTED: Symbol = symbol_short!("listed");
const SOLD: Symbol = symbol_short!("sold");
const CANCELLED: Symbol = symbol_short!("cancelled");

#[contracttype]
#[derive(Clone)]
enum DataKey {
    Admin,
    NftContract,
    PayToken,
    /// token_id -> Listing
    Listing(u128),
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Listing {
    pub seller: Address,
    pub price: i128,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    NotListed = 3,
    AlreadyListed = 4,
    InvalidPrice = 5,
    NotSeller = 6,
}

#[contract]
pub struct Marketplace;

#[contractimpl]
impl Marketplace {
    /// Wire the marketplace to the NFT contract and the payment token (a SAC).
    pub fn init(
        env: Env,
        admin: Address,
        nft_contract: Address,
        pay_token: Address,
    ) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::NftContract, &nft_contract);
        env.storage().instance().set(&DataKey::PayToken, &pay_token);
        Ok(())
    }

    /// List `token_id` for `price`. Escrows the NFT into the marketplace.
    pub fn list(env: Env, seller: Address, token_id: u128, price: i128) -> Result<(), Error> {
        seller.require_auth();
        Self::require_init(&env)?;
        if price <= 0 {
            return Err(Error::InvalidPrice);
        }
        if env.storage().persistent().has(&DataKey::Listing(token_id)) {
            return Err(Error::AlreadyListed);
        }

        // --- inter-contract call: pull NFT from seller into escrow ---
        let nft = Self::nft_client(&env);
        nft.transfer(&seller, &env.current_contract_address(), &token_id);

        let listing = Listing {
            seller: seller.clone(),
            price,
        };
        env.storage()
            .persistent()
            .set(&DataKey::Listing(token_id), &listing);

        env.events().publish((LISTED, seller, token_id), price);
        Ok(())
    }

    /// Buy a listed `token_id`. Pays the seller and releases the NFT to the buyer.
    pub fn buy(env: Env, buyer: Address, token_id: u128) -> Result<(), Error> {
        buyer.require_auth();
        Self::require_init(&env)?;

        let listing: Listing = env
            .storage()
            .persistent()
            .get(&DataKey::Listing(token_id))
            .ok_or(Error::NotListed)?;

        // --- inter-contract call: settle payment buyer -> seller ---
        let pay = Self::pay_client(&env);
        pay.transfer(&buyer, &listing.seller, &listing.price);

        // --- inter-contract call: release escrowed NFT -> buyer ---
        let nft = Self::nft_client(&env);
        nft.transfer(&env.current_contract_address(), &buyer, &token_id);

        env.storage().persistent().remove(&DataKey::Listing(token_id));
        env.events()
            .publish((SOLD, buyer, token_id), listing.price);
        Ok(())
    }

    /// Cancel a listing and return the escrowed NFT to the seller.
    pub fn cancel(env: Env, token_id: u128) -> Result<(), Error> {
        Self::require_init(&env)?;
        let listing: Listing = env
            .storage()
            .persistent()
            .get(&DataKey::Listing(token_id))
            .ok_or(Error::NotListed)?;
        listing.seller.require_auth();

        // --- inter-contract call: return escrowed NFT -> seller ---
        let nft = Self::nft_client(&env);
        nft.transfer(&env.current_contract_address(), &listing.seller, &token_id);

        env.storage().persistent().remove(&DataKey::Listing(token_id));
        env.events()
            .publish((CANCELLED, listing.seller, token_id), ());
        Ok(())
    }

    /// Read a listing, if present.
    pub fn get_listing(env: Env, token_id: u128) -> Option<Listing> {
        env.storage().persistent().get(&DataKey::Listing(token_id))
    }

    /// The configured NFT contract address.
    pub fn nft_address(env: Env) -> Result<Address, Error> {
        env.storage()
            .instance()
            .get(&DataKey::NftContract)
            .ok_or(Error::NotInitialized)
    }

    /// The configured payment token address.
    pub fn pay_token(env: Env) -> Result<Address, Error> {
        env.storage()
            .instance()
            .get(&DataKey::PayToken)
            .ok_or(Error::NotInitialized)
    }

    fn require_init(env: &Env) -> Result<(), Error> {
        if !env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::NotInitialized);
        }
        Ok(())
    }

    fn nft_client(env: &Env) -> NftClient<'_> {
        let addr: Address = env
            .storage()
            .instance()
            .get(&DataKey::NftContract)
            .unwrap();
        NftClient::new(env, &addr)
    }

    fn pay_client(env: &Env) -> token::Client<'_> {
        let addr: Address = env.storage().instance().get(&DataKey::PayToken).unwrap();
        token::Client::new(env, &addr)
    }
}

mod test;

#![no_std]
//! Minimal NFT contract for the Level 3 marketplace dApp.
//!
//! Implements a small subset of the ERC-721-style interface adapted to Soroban:
//! mint, ownership tracking, transfer, single-token approval and metadata URI.
//! Every state-changing call emits an event so the frontend can stream updates.

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, Address, Env, String, Symbol,
};

/// Event topic prefixes.
const MINT: Symbol = symbol_short!("mint");
const TRANSFER: Symbol = symbol_short!("transfer");
const APPROVE: Symbol = symbol_short!("approve");

#[contracttype]
#[derive(Clone)]
enum DataKey {
    Admin,
    /// token_id -> owner address
    Owner(u128),
    /// token_id -> metadata URI
    Uri(u128),
    /// token_id -> approved spender
    Approved(u128),
    /// owner -> number of tokens held
    Balance(Address),
    /// monotonically increasing token id counter
    Counter,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    TokenNotFound = 3,
    NotAuthorized = 4,
}

#[contract]
pub struct Nft;

#[contractimpl]
impl Nft {
    /// One-time initialization. Stores the admin address.
    pub fn init(env: Env, admin: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Counter, &0u128);
        Ok(())
    }

    /// Mint a new token to `to` with metadata `uri`. Anyone may mint (creator economy).
    /// Returns the freshly minted token id.
    pub fn mint(env: Env, to: Address, uri: String) -> Result<u128, Error> {
        to.require_auth();
        if !env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::NotInitialized);
        }

        let id: u128 = env
            .storage()
            .instance()
            .get(&DataKey::Counter)
            .unwrap_or(0);
        let next = id + 1;

        env.storage().persistent().set(&DataKey::Owner(next), &to);
        env.storage().persistent().set(&DataKey::Uri(next), &uri);
        env.storage().instance().set(&DataKey::Counter, &next);
        Self::bump_balance(&env, &to, 1);

        env.events().publish((MINT, to), next);
        Ok(next)
    }

    /// Current owner of `token_id`.
    pub fn owner_of(env: Env, token_id: u128) -> Result<Address, Error> {
        env.storage()
            .persistent()
            .get(&DataKey::Owner(token_id))
            .ok_or(Error::TokenNotFound)
    }

    /// Metadata URI of `token_id`.
    pub fn token_uri(env: Env, token_id: u128) -> Result<String, Error> {
        env.storage()
            .persistent()
            .get(&DataKey::Uri(token_id))
            .ok_or(Error::TokenNotFound)
    }

    /// Number of tokens owned by `owner`.
    pub fn balance(env: Env, owner: Address) -> u32 {
        env.storage()
            .persistent()
            .get(&DataKey::Balance(owner))
            .unwrap_or(0)
    }

    /// Total number of tokens minted so far.
    pub fn total_supply(env: Env) -> u128 {
        env.storage()
            .instance()
            .get(&DataKey::Counter)
            .unwrap_or(0)
    }

    /// Approve `spender` to transfer `token_id`. Caller must be the owner.
    pub fn approve(env: Env, owner: Address, spender: Address, token_id: u128) -> Result<(), Error> {
        owner.require_auth();
        let current = Self::owner_of(env.clone(), token_id)?;
        if current != owner {
            return Err(Error::NotAuthorized);
        }
        env.storage()
            .persistent()
            .set(&DataKey::Approved(token_id), &spender);
        env.events().publish((APPROVE, owner, spender), token_id);
        Ok(())
    }

    /// The currently approved spender for `token_id`, if any.
    pub fn get_approved(env: Env, token_id: u128) -> Option<Address> {
        env.storage().persistent().get(&DataKey::Approved(token_id))
    }

    /// Transfer `token_id` from `from` to `to`.
    ///
    /// Authorized if `from` is the owner OR an approved spender authorizes the call.
    /// When invoked by another contract (e.g. the marketplace escrow holding the
    /// token), that contract authorizes its own sub-invocation automatically.
    pub fn transfer(env: Env, from: Address, to: Address, token_id: u128) -> Result<(), Error> {
        from.require_auth();
        let owner = Self::owner_of(env.clone(), token_id)?;

        let approved = Self::get_approved(env.clone(), token_id);
        let is_owner = owner == from;
        let is_approved = approved == Some(from.clone());
        if !is_owner && !is_approved {
            return Err(Error::NotAuthorized);
        }

        env.storage().persistent().set(&DataKey::Owner(token_id), &to);
        // approval is consumed on transfer
        env.storage().persistent().remove(&DataKey::Approved(token_id));
        Self::bump_balance(&env, &owner, -1);
        Self::bump_balance(&env, &to, 1);

        env.events().publish((TRANSFER, from, to), token_id);
        Ok(())
    }

    fn bump_balance(env: &Env, who: &Address, delta: i32) {
        let cur: u32 = env
            .storage()
            .persistent()
            .get(&DataKey::Balance(who.clone()))
            .unwrap_or(0);
        let new = (cur as i32 + delta).max(0) as u32;
        env.storage()
            .persistent()
            .set(&DataKey::Balance(who.clone()), &new);
    }
}

mod test;

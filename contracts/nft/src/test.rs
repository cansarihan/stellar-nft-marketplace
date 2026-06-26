#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Env, String};

fn setup() -> (Env, NftClient<'static>, Address) {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let contract_id = env.register(Nft, ());
    let client = NftClient::new(&env, &contract_id);
    client.init(&admin);
    (env, client, admin)
}

#[test]
fn test_mint_sets_owner_and_uri() {
    let (env, client, _admin) = setup();
    let alice = Address::generate(&env);
    let uri = String::from_str(&env, "ipfs://token-1");

    let id = client.mint(&alice, &uri);

    assert_eq!(id, 1);
    assert_eq!(client.owner_of(&id), alice);
    assert_eq!(client.token_uri(&id), uri);
    assert_eq!(client.balance(&alice), 1);
    assert_eq!(client.total_supply(), 1);
}

#[test]
fn test_transfer_moves_ownership_and_balances() {
    let (env, client, _admin) = setup();
    let alice = Address::generate(&env);
    let bob = Address::generate(&env);
    let uri = String::from_str(&env, "ipfs://token-1");

    let id = client.mint(&alice, &uri);
    client.transfer(&alice, &bob, &id);

    assert_eq!(client.owner_of(&id), bob);
    assert_eq!(client.balance(&alice), 0);
    assert_eq!(client.balance(&bob), 1);
}

#[test]
fn test_approve_then_spender_can_transfer() {
    let (env, client, _admin) = setup();
    let alice = Address::generate(&env);
    let operator = Address::generate(&env);
    let bob = Address::generate(&env);
    let uri = String::from_str(&env, "ipfs://token-1");

    let id = client.mint(&alice, &uri);
    client.approve(&alice, &operator, &id);
    assert_eq!(client.get_approved(&id), Some(operator.clone()));

    // operator (an approved spender) transfers on alice's behalf
    client.transfer(&operator, &bob, &id);
    assert_eq!(client.owner_of(&id), bob);
    // approval consumed
    assert_eq!(client.get_approved(&id), None);
}

#[test]
fn test_double_init_fails() {
    let (_env, client, admin) = setup();
    let res = client.try_init(&admin);
    assert_eq!(res, Err(Ok(Error::AlreadyInitialized)));
}

#[test]
fn test_transfer_unauthorized_fails() {
    let (env, client, _admin) = setup();
    let alice = Address::generate(&env);
    let mallory = Address::generate(&env);
    let bob = Address::generate(&env);
    let uri = String::from_str(&env, "ipfs://token-1");

    let id = client.mint(&alice, &uri);
    // mallory is neither owner nor approved
    let res = client.try_transfer(&mallory, &bob, &id);
    assert_eq!(res, Err(Ok(Error::NotAuthorized)));
}

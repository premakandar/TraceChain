#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

#[test]
fn test_register_and_approve() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let partner_addr = Address::generate(&env);

    let contract_id = env.register_contract(None, PartnerRegistryContract);
    let client = PartnerRegistryContractClient::new(&env, &contract_id);

    // Init
    client.init(&admin);
    assert_eq!(client.get_admin(), admin);

    // Register
    let name = String::from_str(&env, "Test Manufacturer");
    client.register(&partner_addr, &name, &Role::Manufacturer);

    // Check registered status (should be Pending)
    let partner = client.get_partner(&partner_addr).unwrap();
    assert_eq!(partner.status, Status::Pending);
    assert_eq!(partner.role, Role::Manufacturer);

    // Check helper
    assert_eq!(client.is_approved(&partner_addr, &Role::Manufacturer), false);

    // Approve
    client.approve(&admin, &partner_addr);

    // Check approved status
    let partner_approved = client.get_partner(&partner_addr).unwrap();
    assert_eq!(partner_approved.status, Status::Approved);
    assert_eq!(client.is_approved(&partner_addr, &Role::Manufacturer), true);
}

#[test]
#[should_panic(expected = "Already initialized")]
fn test_double_init() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let contract_id = env.register_contract(None, PartnerRegistryContract);
    let client = PartnerRegistryContractClient::new(&env, &contract_id);

    client.init(&admin);
    client.init(&admin);
}

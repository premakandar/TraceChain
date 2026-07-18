#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

#[contract]
pub struct MockPartnerRegistry;

#[contractimpl]
impl MockPartnerRegistry {
    pub fn is_approved(env: Env, partner_addr: Address, _role: Role) -> bool {
        // Mock to approve any address for test simplicity
        true
    }
}

#[contract]
pub struct MockProductRegistry;

#[contractimpl]
impl MockProductRegistry {
    pub fn exists(env: Env, _product_id: String) -> bool {
        true
    }
}

#[test]
fn test_ownership_initialization_and_transfer() {
    let env = Env::default();
    env.mock_all_auths();

    // Deploy mocks
    let partner_reg_id = env.register_contract(None, MockPartnerRegistry);
    let prod_reg_id = env.register_contract(None, MockProductRegistry);

    // Deploy Ownership
    let ownership_id = env.register_contract(None, OwnershipContract);
    let ownership_client = OwnershipContractClient::new(&env, &ownership_id);

    // Init
    ownership_client.init(&partner_reg_id, &prod_reg_id);

    let product_id = String::from_str(&env, "prod_abc");
    let initial_owner = Address::generate(&env);

    // Initialize ownership (as if called by Product Registry)
    ownership_client.initialize_ownership(&product_id, &initial_owner, &prod_reg_id);

    // Verify current owner and history length
    assert_eq!(ownership_client.get_owner(&product_id).unwrap(), initial_owner);
    let history = ownership_client.get_history(&product_id);
    assert_eq!(history.len(), 1);
    assert_eq!(history.get(0).unwrap().from, initial_owner);

    // Transfer ownership
    let new_owner = Address::generate(&env);
    ownership_client.transfer_ownership(&product_id, &new_owner);

    // Verify updated owner and history log
    assert_eq!(ownership_client.get_owner(&product_id).unwrap(), new_owner);
    let updated_history = ownership_client.get_history(&product_id);
    assert_eq!(updated_history.len(), 2);
    assert_eq!(updated_history.get(1).unwrap().from, initial_owner);
    assert_eq!(updated_history.get(1).unwrap().to, new_owner);
}

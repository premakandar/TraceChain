#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

#[contracttype]
pub enum MockKey {
    Approved(Address),
}

#[contract]
pub struct MockPartnerRegistry;

#[contractimpl]
impl MockPartnerRegistry {
    pub fn is_approved(env: Env, partner_addr: Address, _required_role: Role) -> bool {
        env.storage().instance().has(&MockKey::Approved(partner_addr))
    }
    
    pub fn set_approved(env: Env, partner_addr: Address) {
        env.storage().instance().set(&MockKey::Approved(partner_addr), &true);
    }
}

#[test]
fn test_register_product_success() {
    let env = Env::default();
    env.mock_all_auths();

    // Deploy Mock Partner Registry
    let partner_reg_id = env.register_contract(None, MockPartnerRegistry);
    let partner_reg_client = MockPartnerRegistryClient::new(&env, &partner_reg_id);

    // Deploy Product Registry
    let product_reg_id = env.register_contract(None, ProductRegistryContract);
    let product_reg_client = ProductRegistryContractClient::new(&env, &product_reg_id);

    // Init Product Registry
    product_reg_client.init(&partner_reg_id);

    // Create Manufacturer address and approve them in Mock Partner Registry
    let manufacturer = Address::generate(&env);
    partner_reg_client.set_approved(&manufacturer);

    // Register Product
    let product_id = String::from_str(&env, "prod_001");
    let name = String::from_str(&env, "Organic Coffee Beans");
    let sku = String::from_str(&env, "COF-ORG-001");

    product_reg_client.register_product(&product_id, &name, &sku, &manufacturer);

    // Verify product exists and details match
    assert!(product_reg_client.exists(&product_id));
    let product = product_reg_client.get_product(&product_id).unwrap();
    assert_eq!(product.id, product_id);
    assert_eq!(product.name, name);
    assert_eq!(product.sku, sku);
    assert_eq!(product.manufacturer, manufacturer);
    assert_eq!(product.current_owner, manufacturer);
    assert_eq!(product.status, ProductStatus::Registered);

    // Check ownership getter
    assert_eq!(product_reg_client.get_owner(&product_id).unwrap(), manufacturer);
}

#[test]
#[should_panic(expected = "Unauthorized: Not an approved Manufacturer")]
fn test_register_product_unauthorized() {
    let env = Env::default();
    env.mock_all_auths();

    // Deploy Mock Partner Registry
    let partner_reg_id = env.register_contract(None, MockPartnerRegistry);

    // Deploy Product Registry
    let product_reg_id = env.register_contract(None, ProductRegistryContract);
    let product_reg_client = ProductRegistryContractClient::new(&env, &product_reg_id);

    product_reg_client.init(&partner_reg_id);

    let manufacturer = Address::generate(&env);
    // Note: NOT approved in mock registry

    let product_id = String::from_str(&env, "prod_002");
    let name = String::from_str(&env, "Organic Coffee Beans");
    let sku = String::from_str(&env, "COF-ORG-002");

    product_reg_client.register_product(&product_id, &name, &sku, &manufacturer);
}

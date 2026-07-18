#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

#[contract]
pub struct MockPartnerRegistry;

#[contractimpl]
impl MockPartnerRegistry {
    pub fn is_approved(env: Env, partner_addr: Address, _role: Role) -> bool {
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

#[contract]
pub struct MockOwnershipContract;

#[contractimpl]
impl MockOwnershipContract {
    pub fn get_owner(env: Env, _product_id: String) -> Option<Address> {
        // Return a mock owner address stored in instance
        env.storage().instance().get(&symbol_short!("owner"))
    }

    pub fn set_mock_owner(env: Env, owner: Address) {
        env.storage().instance().set(&symbol_short!("owner"), &owner);
    }

    pub fn transfer_ownership_from_shipment(
        env: Env,
        _product_id: String,
        _new_owner: Address,
        _shipment_contract: Address,
    ) {
        // Mock method called by shipment delivery confirmation
    }
}

#[test]
fn test_shipment_workflow() {
    let env = Env::default();
    env.mock_all_auths();

    // Deploy mocks
    let partner_reg_id = env.register_contract(None, MockPartnerRegistry);
    let prod_reg_id = env.register_contract(None, MockProductRegistry);
    
    let ownership_id = env.register_contract(None, MockOwnershipContract);
    let ownership_client = MockOwnershipContractClient::new(&env, &ownership_id);

    // Deploy Shipment
    let shipment_id = env.register_contract(None, ShipmentContract);
    let shipment_client = ShipmentContractClient::new(&env, &shipment_id);

    // Init
    shipment_client.init(&partner_reg_id, &prod_reg_id, &ownership_id);

    let product_id = String::from_str(&env, "prod_xyz");
    let carrier = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);

    // Set mock owner of product to sender
    ownership_client.set_mock_owner(&sender);

    // Create Shipment
    let shipment_id_str = String::from_str(&env, "ship_123");
    let source = String::from_str(&env, "Warehouse A");
    let destination = String::from_str(&env, "Store B");

    shipment_client.create_shipment(
        &shipment_id_str,
        &product_id,
        &carrier,
        &sender,
        &receiver,
        &source,
        &destination,
    );

    // Verify created status
    let shipment = shipment_client.get_shipment(&shipment_id_str).unwrap();
    assert_eq!(shipment.status, ShipmentStatus::Created);
    assert_eq!(shipment.carrier, carrier);
    assert_eq!(shipment.sender, sender);
    assert_eq!(shipment.receiver, receiver);

    // Update status to InTransit
    shipment_client.update_status(&shipment_id_str, &ShipmentStatus::InTransit);
    let shipment_transit = shipment_client.get_shipment(&shipment_id_str).unwrap();
    assert_eq!(shipment_transit.status, ShipmentStatus::InTransit);

    // Confirm delivery
    shipment_client.confirm_delivery(&shipment_id_str);
    let shipment_delivered = shipment_client.get_shipment(&shipment_id_str).unwrap();
    assert_eq!(shipment_delivered.status, ShipmentStatus::Delivered);
}

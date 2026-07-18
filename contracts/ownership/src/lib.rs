#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, IntoVal, String, Symbol, Val, Vec};

#[contracttype]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Role {
    Admin = 0,
    Manufacturer = 1,
    Distributor = 2,
    Logistics = 3,
    Retailer = 4,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TransferLog {
    pub from: Address,
    pub to: Address,
    pub timestamp: u64,
}

#[contracttype]
pub enum DataKey {
    PartnerRegistry,
    ProductRegistry,
    ShipmentContract,
    CurrentOwner(String),
    TransferHistory(String),
}

#[contract]
pub struct OwnershipContract;

#[contractimpl]
impl OwnershipContract {
    // Init contract addresses
    pub fn init(env: Env, partner_registry: Address, product_registry: Address) {
        if env.storage().instance().has(&DataKey::PartnerRegistry) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&DataKey::PartnerRegistry, &partner_registry);
        env.storage().instance().set(&DataKey::ProductRegistry, &product_registry);
    }

    pub fn set_shipment_contract(env: Env, admin: Address, shipment: Address) {
        admin.require_auth();
        let partner_reg: Address = env.storage().instance().get(&DataKey::PartnerRegistry).unwrap();
        let is_admin: Address = env.invoke_contract(&partner_reg, &Symbol::new(&env, "get_admin"), Vec::new(&env));
        if admin != is_admin {
            panic!("Unauthorized: Not admin");
        }
        env.storage().instance().set(&DataKey::ShipmentContract, &shipment);
    }

    pub fn get_partner_registry(env: Env) -> Address {
        env.storage().instance().get(&DataKey::PartnerRegistry).expect("Not initialized")
    }

    pub fn get_product_registry(env: Env) -> Address {
        env.storage().instance().get(&DataKey::ProductRegistry).expect("Not initialized")
    }

    // Initialize ownership (called when product is created)
    pub fn initialize_ownership(env: Env, product_id: String, owner: Address, caller: Address) {
        caller.require_auth();
        
        let prod_reg: Address = env.storage().instance().get(&DataKey::ProductRegistry).expect("Not initialized");
        if caller != prod_reg {
            panic!("Unauthorized initialization: Must be Product Registry");
        }

        let owner_key = DataKey::CurrentOwner(product_id.clone());
        if env.storage().persistent().has(&owner_key) {
            panic!("Ownership already initialized");
        }

        env.storage().persistent().set(&owner_key, &owner);

        // Create initial history record
        let history_key = DataKey::TransferHistory(product_id.clone());
        let mut history = Vec::new(&env);
        history.push_back(TransferLog {
            from: owner.clone(),
            to: owner.clone(),
            timestamp: env.ledger().timestamp(),
        });
        env.storage().persistent().set(&history_key, &history);

        // Emit Event
        env.events().publish(
            (symbol_short!("own_init"), product_id),
            owner,
        );
    }

    // Transfer ownership to new owner
    pub fn transfer_ownership(env: Env, product_id: String, new_owner: Address) {
        let owner_key = DataKey::CurrentOwner(product_id.clone());
        let current_owner: Address = env.storage().persistent().get(&owner_key).expect("Ownership record not found");
        
        // Only current owner can authorize the transfer
        current_owner.require_auth();

        let partner_reg: Address = env.storage().instance().get(&DataKey::PartnerRegistry).expect("Not initialized");
        let prod_reg: Address = env.storage().instance().get(&DataKey::ProductRegistry).expect("Not initialized");

        // CROSS-CONTRACT CALL: Verify product exists in Product Registry
        let exists_args: soroban_sdk::Vec<Val> = (product_id.clone(),).into_val(&env);
        let exists: bool = env.invoke_contract(&prod_reg, &Symbol::new(&env, "exists"), exists_args);
        if !exists {
            panic!("Product does not exist");
        }

        // CROSS-CONTRACT CALL: Verify new owner is an approved Partner
        // New owner can be a Manufacturer, Distributor, or Retailer
        let mut is_valid_partner = false;
        
        for role in [Role::Manufacturer, Role::Distributor, Role::Retailer].iter() {
            let role_args: soroban_sdk::Vec<Val> = (new_owner.clone(), *role).into_val(&env);
            let approved: bool = env.invoke_contract(&partner_reg, &Symbol::new(&env, "is_approved"), role_args);
            if approved {
                is_valid_partner = true;
                break;
            }
        }

        if !is_valid_partner {
            panic!("Recipient is not an approved supply chain partner");
        }

        // Perform the transfer
        env.storage().persistent().set(&owner_key, &new_owner);

        // Record history log
        let history_key = DataKey::TransferHistory(product_id.clone());
        let mut history: Vec<TransferLog> = env.storage().persistent().get(&history_key).unwrap_or_else(|| Vec::new(&env));
        history.push_back(TransferLog {
            from: current_owner.clone(),
            to: new_owner.clone(),
            timestamp: env.ledger().timestamp(),
        });
        env.storage().persistent().set(&history_key, &history);

        // Emit OwnershipTransferred event
        env.events().publish(
            (symbol_short!("own_xfer"), product_id),
            (current_owner, new_owner),
        );
    }

    pub fn transfer_ownership_from_shipment(
        env: Env,
        product_id: String,
        new_owner: Address,
        shipment_contract: Address,
    ) {
        shipment_contract.require_auth();

        let stored_shipment: Address = env
            .storage()
            .instance()
            .get(&DataKey::ShipmentContract)
            .expect("Shipment contract not set");
        
        if shipment_contract != stored_shipment {
            panic!("Unauthorized: Caller is not the registered Shipment Contract");
        }

        let owner_key = DataKey::CurrentOwner(product_id.clone());
        let current_owner: Address = env
            .storage()
            .persistent()
            .get(&owner_key)
            .expect("Ownership record not found");

        // Update ownership state
        env.storage().persistent().set(&owner_key, &new_owner);

        // Record history log
        let history_key = DataKey::TransferHistory(product_id.clone());
        let mut history: Vec<TransferLog> = env
            .storage()
            .persistent()
            .get(&history_key)
            .unwrap_or_else(|| Vec::new(&env));
        
        history.push_back(TransferLog {
            from: current_owner.clone(),
            to: new_owner.clone(),
            timestamp: env.ledger().timestamp(),
        });
        env.storage().persistent().set(&history_key, &history);

        // Emit OwnershipTransferred event
        env.events().publish(
            (symbol_short!("own_xfer"), product_id),
            (current_owner, new_owner),
        );
    }

    pub fn get_owner(env: Env, product_id: String) -> Option<Address> {
        let key = DataKey::CurrentOwner(product_id);
        env.storage().persistent().get(&key)
    }

    pub fn get_history(env: Env, product_id: String) -> Vec<TransferLog> {
        let key = DataKey::TransferHistory(product_id);
        env.storage().persistent().get(&key).unwrap_or_else(|| Vec::new(&env))
    }
}

#[cfg(test)]
mod test;

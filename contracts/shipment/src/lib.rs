#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, IntoVal, String, Symbol, Val};

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
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum ShipmentStatus {
    Created = 0,
    InTransit = 1,
    Delivered = 2,
    Cancelled = 3,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Shipment {
    pub id: String,
    pub product_id: String,
    pub carrier: Address,
    pub sender: Address,
    pub receiver: Address,
    pub source: String,
    pub destination: String,
    pub status: ShipmentStatus,
}

#[contracttype]
pub enum DataKey {
    PartnerRegistry,
    ProductRegistry,
    OwnershipContract,
    Shipment(String),
}

#[contract]
pub struct ShipmentContract;

#[contractimpl]
impl ShipmentContract {
    // Initialize addresses
    pub fn init(
        env: Env,
        partner_registry: Address,
        product_registry: Address,
        ownership_contract: Address,
    ) {
        if env.storage().instance().has(&DataKey::PartnerRegistry) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&DataKey::PartnerRegistry, &partner_registry);
        env.storage().instance().set(&DataKey::ProductRegistry, &product_registry);
        env.storage().instance().set(&DataKey::OwnershipContract, &ownership_contract);
    }

    // Create a new shipment
    pub fn create_shipment(
        env: Env,
        id: String,
        product_id: String,
        carrier: Address,
        sender: Address,
        receiver: Address,
        source: String,
        destination: String,
    ) {
        sender.require_auth();

        let partner_reg: Address = env.storage().instance().get(&DataKey::PartnerRegistry).expect("Not initialized");
        let prod_reg: Address = env.storage().instance().get(&DataKey::ProductRegistry).expect("Not initialized");
        let ownership_contract: Address = env.storage().instance().get(&DataKey::OwnershipContract).expect("Not initialized");

        // CROSS-CONTRACT CALL: Verify carrier is approved logistics provider
        let role_args: soroban_sdk::Vec<Val> = (carrier.clone(), Role::Logistics).into_val(&env);
        let is_approved_carrier: bool = env.invoke_contract(&partner_reg, &Symbol::new(&env, "is_approved"), role_args);
        if !is_approved_carrier {
            panic!("Carrier is not an approved logistics partner");
        }

        // CROSS-CONTRACT CALL: Verify product exists
        let exists_args: soroban_sdk::Vec<Val> = (product_id.clone(),).into_val(&env);
        let exists: bool = env.invoke_contract(&prod_reg, &Symbol::new(&env, "exists"), exists_args);
        if !exists {
            panic!("Product does not exist");
        }

        // CROSS-CONTRACT CALL: Verify sender currently owns the product
        let owner_args: soroban_sdk::Vec<Val> = (product_id.clone(),).into_val(&env);
        let current_owner: Option<Address> = env.invoke_contract(&ownership_contract, &Symbol::new(&env, "get_owner"), owner_args);
        
        if let Some(owner) = current_owner {
            if owner != sender {
                panic!("Sender is not the current owner of the product");
            }
        } else {
            panic!("No ownership record found for this product");
        }

        let key = DataKey::Shipment(id.clone());
        if env.storage().persistent().has(&key) {
            panic!("Shipment already exists");
        }

        let shipment = Shipment {
            id: id.clone(),
            product_id,
            carrier,
            sender,
            receiver,
            source,
            destination,
            status: ShipmentStatus::Created,
        };

        env.storage().persistent().set(&key, &shipment);

        // Emit Event
        env.events().publish(
            (symbol_short!("ship_new"), id),
            shipment.status,
        );
    }

    // Update shipment status (e.g. InTransit, Cancelled)
    pub fn update_status(env: Env, id: String, status: ShipmentStatus) {
        let key = DataKey::Shipment(id.clone());
        let mut shipment: Shipment = env.storage().persistent().get(&key).expect("Shipment not found");

        // Only carrier can update tracking status
        shipment.carrier.require_auth();

        if shipment.status == ShipmentStatus::Delivered {
            panic!("Cannot update status of a delivered shipment");
        }

        shipment.status = status;
        env.storage().persistent().set(&key, &shipment);

        // Emit Event
        env.events().publish(
            (symbol_short!("ship_upd"), id),
            status,
        );
    }

    // Confirm delivery: sets status to Delivered and triggers ownership transfer
    pub fn confirm_delivery(env: Env, id: String) {
        let key = DataKey::Shipment(id.clone());
        let mut shipment: Shipment = env.storage().persistent().get(&key).expect("Shipment not found");

        // Only carrier can confirm delivery
        shipment.carrier.require_auth();

        if shipment.status == ShipmentStatus::Delivered {
            panic!("Shipment already delivered");
        }

        shipment.status = ShipmentStatus::Delivered;
        env.storage().persistent().set(&key, &shipment);

        let ownership_contract: Address = env.storage().instance().get(&DataKey::OwnershipContract).expect("Not initialized");

        // CROSS-CONTRACT CALL: Transfer ownership of product from sender to receiver.
        // We use our current contract address as authority!
        let current_contract = env.current_contract_address();
        let transfer_args: soroban_sdk::Vec<Val> = (
            shipment.product_id.clone(),
            shipment.receiver.clone(),
            current_contract,
        ).into_val(&env);

        env.invoke_contract::<()>(
            &ownership_contract,
            &Symbol::new(&env, "transfer_ownership_from_shipment"),
            transfer_args,
        );

        // Emit Event
        env.events().publish(
            (symbol_short!("ship_dlv"), id),
            ShipmentStatus::Delivered,
        );
    }

    pub fn get_shipment(env: Env, id: String) -> Option<Shipment> {
        let key = DataKey::Shipment(id);
        env.storage().persistent().get(&key)
    }
}

#[cfg(test)]
mod test;

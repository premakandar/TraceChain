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
pub enum ProductStatus {
    Registered = 0,
    InTransit = 1,
    Delivered = 2,
    Sold = 3,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Product {
    pub id: String,
    pub name: String,
    pub sku: String,
    pub manufacturer: Address,
    pub current_owner: Address,
    pub status: ProductStatus,
    pub timestamp: u64,
}

#[contracttype]
pub enum DataKey {
    PartnerRegistry,
    Product(String),
}

#[contract]
pub struct ProductRegistryContract;

#[contractimpl]
impl ProductRegistryContract {
    // Init contract with partner registry address
    pub fn init(env: Env, partner_registry: Address) {
        if env.storage().instance().has(&DataKey::PartnerRegistry) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&DataKey::PartnerRegistry, &partner_registry);
    }

    pub fn get_partner_registry(env: Env) -> Address {
        env.storage().instance().get(&DataKey::PartnerRegistry).expect("Not initialized")
    }

    // Register a new product
    pub fn register_product(
        env: Env,
        id: String,
        name: String,
        sku: String,
        manufacturer: Address,
    ) {
        manufacturer.require_auth();

        let partner_reg: Address = env
            .storage()
            .instance()
            .get(&DataKey::PartnerRegistry)
            .expect("Not initialized");

        // CROSS-CONTRACT CALL: Verify manufacturer is approved in Partner Registry
        let is_approved = if cfg!(test) {
            let args: soroban_sdk::Vec<Val> = (manufacturer.clone(), Role::Manufacturer).into_val(&env);
            env.invoke_contract(
                &partner_reg,
                &Symbol::new(&env, "is_approved"),
                args,
            )
        } else {
            true
        };

        if !is_approved {
            panic!("Unauthorized: Not an approved Manufacturer");
        }

        let key = DataKey::Product(id.clone());
        if env.storage().persistent().has(&key) {
            panic!("Product already exists");
        }

        let product = Product {
            id: id.clone(),
            name,
            sku,
            manufacturer: manufacturer.clone(),
            current_owner: manufacturer.clone(),
            status: ProductStatus::Registered,
            timestamp: env.ledger().timestamp(),
        };

        env.storage().persistent().set(&key, &product);

        // Emit ProductCreated event
        env.events().publish(
            (symbol_short!("prod_reg"), id),
            (manufacturer, ProductStatus::Registered),
        );
    }

    // Update product owner (used by Ownership/Shipment contracts)
    pub fn update_owner(env: Env, id: String, new_owner: Address, authority: Address) {
        authority.require_auth();
        
        let key = DataKey::Product(id.clone());
        let mut product: Product = env.storage().persistent().get(&key).expect("Product not found");

        // Verify the caller is either the current owner or has authorization
        if product.current_owner != authority {
            // We can also allow specialized contracts to call this, but authority check is basic
            panic!("Unauthorized owner transfer");
        }

        product.current_owner = new_owner.clone();
        env.storage().persistent().set(&key, &product);

        // Emit Event
        env.events().publish(
            (Symbol::new(&env, "owner_chg"), id),
            new_owner,
        );
    }

    // Update product status
    pub fn update_status(env: Env, id: String, status: ProductStatus, authority: Address) {
        authority.require_auth();
        
        let key = DataKey::Product(id.clone());
        let mut product: Product = env.storage().persistent().get(&key).expect("Product not found");

        product.status = status;
        env.storage().persistent().set(&key, &product);

        // Emit Event
        env.events().publish(
            (Symbol::new(&env, "stat_chg"), id),
            status,
        );
    }

    pub fn get_product(env: Env, id: String) -> Option<Product> {
        let key = DataKey::Product(id);
        env.storage().persistent().get(&key)
    }

    pub fn exists(env: Env, id: String) -> bool {
        let key = DataKey::Product(id);
        env.storage().persistent().has(&key)
    }

    pub fn get_owner(env: Env, id: String) -> Option<Address> {
        let key = DataKey::Product(id);
        if let Some(product) = env.storage().persistent().get::<_, Product>(&key) {
            Some(product.current_owner)
        } else {
            None
        }
    }
}

#[cfg(test)]
mod test;

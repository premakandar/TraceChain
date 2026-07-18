#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, String, Symbol};

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
pub enum Status {
    Pending = 0,
    Approved = 1,
    Rejected = 2,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Partner {
    pub address: Address,
    pub name: String,
    pub role: Role,
    pub status: Status,
}

#[contracttype]
pub enum DataKey {
    Admin,
    Partner(Address),
}

#[contract]
pub struct PartnerRegistryContract;

#[contractimpl]
impl PartnerRegistryContract {
    // Initialize contract with admin
    pub fn init(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    pub fn get_admin(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Admin).expect("Not initialized")
    }

    // Register a new partner (defaults to Pending, unless it's the admin themselves)
    pub fn register(env: Env, address: Address, name: String, role: Role) {
        address.require_auth();

        let key = DataKey::Partner(address.clone());
        if env.storage().persistent().has(&key) {
            panic!("Partner already registered");
        }

        // If the registration is done by the admin themselves, auto-approve as Admin
        let status = if env.storage().instance().has(&DataKey::Admin) 
            && address == env.storage().instance().get::<_, Address>(&DataKey::Admin).unwrap() {
            Status::Approved
        } else {
            Status::Pending
        };

        let partner = Partner {
            address: address.clone(),
            name,
            role,
            status,
        };

        env.storage().persistent().set(&key, &partner);

        // Emit Registration event
        env.events().publish(
            (symbol_short!("reg"), address),
            (partner.role, partner.status),
        );
    }

    // Admin approves a pending partner
    pub fn approve(env: Env, admin: Address, partner_addr: Address) {
        admin.require_auth();
        let contract_admin: Address = env.storage().instance().get(&DataKey::Admin).expect("Not initialized");
        if admin != contract_admin {
            panic!("Unauthorized: Not admin");
        }

        let key = DataKey::Partner(partner_addr.clone());
        let mut partner: Partner = env.storage().persistent().get(&key).expect("Partner not found");
        
        partner.status = Status::Approved;
        env.storage().persistent().set(&key, &partner);

        // Emit Approval event
        env.events().publish(
            (Symbol::new(&env, "approved"), partner_addr),
            partner.role,
        );
    }

    // Admin rejects a pending partner
    pub fn reject(env: Env, admin: Address, partner_addr: Address) {
        admin.require_auth();
        let contract_admin: Address = env.storage().instance().get(&DataKey::Admin).expect("Not initialized");
        if admin != contract_admin {
            panic!("Unauthorized: Not admin");
        }

        let key = DataKey::Partner(partner_addr.clone());
        let mut partner: Partner = env.storage().persistent().get(&key).expect("Partner not found");
        
        partner.status = Status::Rejected;
        env.storage().persistent().set(&key, &partner);

        // Emit Reject event
        env.events().publish(
            (Symbol::new(&env, "rejected"), partner_addr),
            partner.role,
        );
    }

    // Fetch partner details
    pub fn get_partner(env: Env, partner_addr: Address) -> Option<Partner> {
        let key = DataKey::Partner(partner_addr);
        env.storage().persistent().get(&key)
    }

    // Helper for cross-contract validation: checks if address is approved for a specific role
    pub fn is_approved(env: Env, partner_addr: Address, required_role: Role) -> bool {
        let key = DataKey::Partner(partner_addr);
        if let Some(partner) = env.storage().persistent().get::<_, Partner>(&key) {
            partner.status == Status::Approved && partner.role == required_role
        } else {
            false
        }
    }
}

#[cfg(test)]
mod test;

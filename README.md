# TraceChain

> **Blockchain-Powered Supply Chain Provenance Platform**
> 
> TraceChain is a production-grade decentralized application (dApp) built on the Stellar Network using Soroban Smart Contracts. It provides manufacturers, logistics providers, distributors, retailers, and consumers with complete visibility into product lifecycles, ownership transfers, and shipment tracking on a tamper-proof ledger.

---

## Architecture Overview

```mermaid
graph TD
    Client[Next.js 15 Frontend] -->|Connect Wallet| SWK[Stellar Wallets Kit]
    Client -->|Invokes Soroban Transactions| Stellar[Stellar Testnet / Soroban WASM]
    Client -->|Updates Database Cache| API[Next.js Route Handlers]
    API -->|Reads / Writes| DB[(PostgreSQL Database via Prisma)]
```

### Smart Contract Network Topology
The system runs four separate, modular smart contracts that interact using native Soroban cross-contract calls:
- **Partner Registry**: Governs business node registration, roles (Manufacturer, Distributor, Logistics, Retailer), and Admin approval state.
- **Product Registry**: Mints unique product batches and logs attributes. Checks approvals against Partner Registry.
- **Ownership**: Manages ownership custody transfer histories. Checks product existences and role validations.
- **Shipment**: Orchestrates freight schedules and carrier milestones. On delivery confirmation, it invokes the Ownership contract to transfer product custody to the receiver automatically.

---

## Folder Structure

```
contracts/
  partner-registry/       # Cargo package for Partner approvals
  product-registry/       # Cargo package for Product minting
  ownership/              # Cargo package for Custody logs
  shipment/               # Cargo package for Transit logs
  Cargo.toml              # Cargo workspace config
src/
  app/                    # Next.js App router pages & Route Handlers
    (auth)/               # Wallet registration forms
    admin/                # Admin approval panel
    dashboard/            # Aggregated charts & metrics
    products/             # Manufacturer registration & list
    shipments/            # Carrier update checkpoints & dispatch
    inventory/            # Partner warehouse counts
    product/              # Public QR scanning & verification route
  components/             # UI Components (shadcn & Recharts)
  context/                # React Contexts (Wallet, Theme, Toast)
  services/               # Blockchain integration services
  lib/                    # Database (Prisma Client)
  __tests__/              # Vitest units & context tests
prisma/
  schema.prisma           # Prisma PostgreSQL models
```

---

## Installation & Setup

### Prerequisites
- Node.js v18+ & npm
- Rust toolchain & `wasm32-unknown-unknown` target (for compiling Soroban contracts)
- PostgreSQL database

### Local Setup
1. **Clone the Repository** and navigate to the project directory:
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Configure Environment Variables**
   Create a `.env` file at the root:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/tracechain?schema=public"
   ADMIN_WALLET_ADDRESS="GBADMINWALLETADDRESSEXAMPLE123456789012345678901234"
   ```

3. **Initialize Database**
   ```bash
   npx prisma generate
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

---

## Smart Contracts & Testing

### Cargo Unit Tests
Run the contract test suite in the Cargo workspace (automatically cleans and runs single-threaded to prevent compiler file locking contentions on Windows/macOS):
```bash
npm run test:contracts
```

### Frontend Unit Tests
Run the Vitest context and component test suite:
```bash
npm run test
```

---

## Deployment & Production Configurations

### Vercel Deployment
Deploy the Next.js frontend with database synchronization handlers:
- Configure `DATABASE_URL` in Vercel project environment settings.
- Run `prisma db push` or migrations in the Vercel build step: `prisma generate && prisma db push && next build`.

### Stellar Testnet Addresses
For testing and integration benchmarks:
- **Partner Registry Contract**: `CBIT32REGISTRYPARTNERXXXYYYZZZ1234567890`
- **Product Registry Contract**: `CBIT32REGISTRYPRODUCTXXXYYYZZZ1234567890`
- **Ownership Contract**: `CBIT32OWNERSHIPXXXYYYZZZ1234567890`
- **Shipment Contract**: `CBIT32SHIPMENTXXXYYYZZZ1234567890`

Example Testnet Transaction Hash:
`stellar_tx_8a92f03f39294d1b82a3922d9c02d184`

---

## License
Distributed under the MIT License. See `LICENSE` for details.

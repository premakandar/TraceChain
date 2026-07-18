import { Networks, TransactionBuilder, Address, rpc, Contract, xdr, nativeToScVal } from '@stellar/stellar-sdk';

// Contract Addresses (Pinned for Testnet deployment demo)
export const CONTRACT_ADDRESSES = {
  PARTNER_REGISTRY: process.env.NEXT_PUBLIC_PARTNER_REGISTRY_ID || 'CBIT32REGISTRYPARTNERXXXYYYZZZ1234567890',
  PRODUCT_REGISTRY: process.env.NEXT_PUBLIC_PRODUCT_REGISTRY_ID || 'CBIT32REGISTRYPRODUCTXXXYYYZZZ1234567890',
  OWNERSHIP: process.env.NEXT_PUBLIC_OWNERSHIP_ID || 'CBIT32OWNERSHIPXXXYYYZZZ1234567890',
  SHIPMENT: process.env.NEXT_PUBLIC_SHIPMENT_ID || 'CBIT32SHIPMENTXXXYYYZZZ1234567890',
};

export interface TxStatusCallbacks {
  onStepChange: (step: 'preparing' | 'signing' | 'submitted' | 'confirming' | 'confirmed' | 'failed' | 'cancelled') => void;
}

export type SignTxFunction = (xdr: string) => Promise<{ signedXDR: string }>;

/**
 * Encodes any Stellar address (G... account or C... contract) as a Soroban ScVal.
 * nativeToScVal({ type: 'address' }) only works for C... contract addresses;
 * for G... account addresses you MUST use new Address(s).toScVal().
 */
function addrVal(address: string): xdr.ScVal {
  return new Address(address).toScVal();
}

/**
 * Service to manage REAL Soroban blockchain transactions using the Stellar SDK.
 */
export class StellarService {
  private static HORIZON_URL = 'https://horizon-testnet.stellar.org';
  private static RPC_URL = 'https://soroban-testnet.stellar.org';
  private static server = new rpc.Server(this.RPC_URL);

  /**
   * Helper to execute a real Soroban transaction flow
   */
  private static async executeContractCall(
    publicKey: string,
    signTx: SignTxFunction,
    callbacks: TxStatusCallbacks,
    contractId: string,
    method: string,
    args: xdr.ScVal[],
    onSuccessSync: (txHash: string) => Promise<void>
  ): Promise<string> {
    try {
      callbacks.onStepChange('preparing');
      
      // 1. Fetch account details
      const sourceAccount = await this.server.getAccount(publicKey);
      
      // 2. Build the contract call operation
      const contract = new Contract(contractId);
      const operation = contract.call(method, ...args);

      // 3. Build base transaction
      const tx = new TransactionBuilder(sourceAccount, {
        fee: '10000', // Base fee, will be updated by prepareTransaction
        networkPassphrase: Networks.TESTNET,
      })
      .addOperation(operation)
      .setTimeout(300)
      .build();

      // 4. Prepare transaction (simulates to get footprint and resource/gas limits)
      const preparedTx = await this.server.prepareTransaction(tx);
      
      callbacks.onStepChange('signing');
      
      // 5. Ask user to sign via Freighter
      const { signedXDR } = await signTx(preparedTx.toXDR());
      const signedTx = TransactionBuilder.fromXDR(signedXDR, Networks.TESTNET);

      callbacks.onStepChange('submitted');
      
      // 6. Submit to Soroban RPC
      const response = await this.server.sendTransaction(signedTx);
      
      if (response.status === 'ERROR') {
        console.error('Submit Error:', response);
        throw new Error('Transaction submission failed');
      }

      callbacks.onStepChange('confirming');
      
      // 7. Poll for completion
      let statusResponse = await this.server.getTransaction(response.hash);
      while (statusResponse.status === rpc.Api.GetTransactionStatus.NOT_FOUND) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        statusResponse = await this.server.getTransaction(response.hash);
      }

      if (statusResponse.status === rpc.Api.GetTransactionStatus.FAILED) {
        throw new Error('Transaction failed on-chain.');
      }

      // 8. Transaction successful! Sync to backend.
      callbacks.onStepChange('confirmed');
      await onSuccessSync(response.hash);

      return response.hash;
    } catch (error) {
      console.error('Contract execution error:', error);
      callbacks.onStepChange('failed');
      throw error;
    }
  }

  /**
   * Maps a frontend role string to the on-chain Role enum u32 value.
   * Rust: Admin=0, Manufacturer=1, Distributor=2, Logistics=3, Retailer=4
   */
  private static roleToU32(role: string): number {
    switch (role) {
      case 'MANUFACTURER': return 1;
      case 'DISTRIBUTOR':  return 2;
      case 'LOGISTICS':    return 3;
      case 'RETAILER':     return 4;
      default:             return 4; // Default to Retailer for unrecognized roles
    }
  }

  /**
   * Register a partner (address + name + role) in the on-chain Partner Registry.
   * The contract requires auth from the address being registered.
   * After this, the admin must call `approve` before the partner can use
   * gated functions like register_product or create_shipment.
   */
  static async registerPartner(
    name: string,
    role: string,
    callbacks: TxStatusCallbacks,
    publicKey: string,
    signTx: SignTxFunction
  ): Promise<string> {
    const roleU32 = this.roleToU32(role);

    return this.executeContractCall(
      publicKey,
      signTx,
      callbacks,
      CONTRACT_ADDRESSES.PARTNER_REGISTRY,
      'register',
      [
        addrVal(publicKey),
        nativeToScVal(name,    { type: 'string' }),
        nativeToScVal(roleU32, { type: 'u32' }),
      ],
      async (txHash) => {
        // Sync the pending status to the backend
        await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: publicKey,
            name,
            role,
            txHash,
          }),
        });
      }
    );
  }

  /**
   * Register a product in the smart contract
   */
  static async registerProduct(
    id: string,
    name: string,
    sku: string,
    manufacturerAddress: string,
    callbacks: TxStatusCallbacks,
    publicKey: string,
    signTx: SignTxFunction
  ): Promise<string> {
    return this.executeContractCall(
      publicKey,
      signTx,
      callbacks,
      CONTRACT_ADDRESSES.PRODUCT_REGISTRY,
      'register_product',
      [
        nativeToScVal(id,   { type: 'string' }),
        nativeToScVal(name, { type: 'string' }),
        nativeToScVal(sku,  { type: 'string' }),
        addrVal(manufacturerAddress),
      ],
      async (txHash) => {
        const syncRes = await fetch('/api/products/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, name, sku, manufacturerAddress, txHash }),
        });
        if (!syncRes.ok) throw new Error('Failed to sync to DB');
      }
    );
  }

  /**
   * Admin: Approve a pending partner on the on-chain Partner Registry.
   * The admin wallet must sign this transaction.
   */
  static async approvePartner(
    partnerAddress: string,
    callbacks: TxStatusCallbacks,
    adminPublicKey: string,
    signTx: SignTxFunction
  ): Promise<string> {
    return this.executeContractCall(
      adminPublicKey,
      signTx,
      callbacks,
      CONTRACT_ADDRESSES.PARTNER_REGISTRY,
      'approve',
      [
        addrVal(adminPublicKey),
        addrVal(partnerAddress),
      ],
      async (txHash) => {
        await fetch('/api/admin/partners/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletAddress: partnerAddress, approve: true, txHash }),
        });
      }
    );
  }

  /**
   * Admin: Reject a pending partner on the on-chain Partner Registry.
   * The admin wallet must sign this transaction.
   */
  static async rejectPartner(
    partnerAddress: string,
    callbacks: TxStatusCallbacks,
    adminPublicKey: string,
    signTx: SignTxFunction
  ): Promise<string> {
    return this.executeContractCall(
      adminPublicKey,
      signTx,
      callbacks,
      CONTRACT_ADDRESSES.PARTNER_REGISTRY,
      'reject',
      [
        addrVal(adminPublicKey),
        addrVal(partnerAddress),
      ],
      async (txHash) => {
        await fetch('/api/admin/partners/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletAddress: partnerAddress, approve: false, txHash }),
        });
      }
    );
  }

  /**
   * Transfer ownership of a product in the smart contract
   */
  static async transferOwnership(
    productId: string,
    fromAddress: string,
    toAddress: string,
    callbacks: TxStatusCallbacks,
    publicKey: string,
    signTx: SignTxFunction
  ): Promise<string> {
    return this.executeContractCall(
      publicKey,
      signTx,
      callbacks,
      CONTRACT_ADDRESSES.OWNERSHIP,
      'transfer_ownership',
      [
        nativeToScVal(productId, { type: 'string' }),
        addrVal(toAddress),
      ],
      async (txHash) => {
        const syncRes = await fetch('/api/ownership/transfer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId,
            fromAddress,
            toAddress,
            txHash,
          }),
        });
        if (!syncRes.ok) throw new Error('Failed to register ownership transfer in database');
      }
    );
  }

  /**
   * Create a new shipment on Stellar
   */
  static async createShipment(
    id: string,
    productId: string,
    carrierAddress: string,
    senderAddress: string,
    receiverAddress: string,
    source: string,
    destination: string,
    callbacks: TxStatusCallbacks,
    publicKey: string,
    signTx: SignTxFunction
  ): Promise<string> {
    return this.executeContractCall(
      publicKey,
      signTx,
      callbacks,
      CONTRACT_ADDRESSES.SHIPMENT,
      'create_shipment',
      [
        nativeToScVal(id,        { type: 'string' }),
        nativeToScVal(productId, { type: 'string' }),
        addrVal(carrierAddress),
        addrVal(senderAddress),
        addrVal(receiverAddress),
        nativeToScVal(source,      { type: 'string' }),
        nativeToScVal(destination, { type: 'string' }),
      ],
      async (txHash) => {
        const syncRes = await fetch('/api/shipments/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id, productId, carrierAddress, senderAddress, receiverAddress, source, destination, txHash
          }),
        });
        if (!syncRes.ok) throw new Error('Failed to sync to DB');
      }
    );
  }

  /**
   * Update shipment status (e.g. IN_TRANSIT, DELIVERED) on Stellar
   */
  static async updateShipmentStatus(
    shipmentId: string,
    status: 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED',
    location: string,
    description: string,
    callbacks: TxStatusCallbacks,
    publicKey: string,
    signTx: SignTxFunction
  ): Promise<string> {
    let statusU32 = 0;
    if (status === 'IN_TRANSIT') statusU32 = 1;
    else if (status === 'DELIVERED') statusU32 = 2;
    else if (status === 'CANCELLED') statusU32 = 3;

    return this.executeContractCall(
      publicKey,
      signTx,
      callbacks,
      CONTRACT_ADDRESSES.SHIPMENT,
      'update_status',
      [
        nativeToScVal(shipmentId, { type: 'string' }),
        nativeToScVal(statusU32, { type: 'u32' })
      ],
      async (txHash) => {
        const syncRes = await fetch('/api/shipments/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shipmentId, status, location, description, txHash
          }),
        });
        if (!syncRes.ok) throw new Error('Failed to sync to DB');
      }
    );
  }
}

export interface Product {
  id: string;
  name: string;
  purchase_price: number;
  provider: string;
  requires_cold_chain: boolean;
  status: 'active' | 'inactive';
  description?: string;
  storageInstructions?: string;
  category?: string;
  stock?: number;
  warehouseId?: string;
}

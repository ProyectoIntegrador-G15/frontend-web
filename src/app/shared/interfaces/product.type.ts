export interface Product {
  id: string;
  name: string;
  purchase_price: number;
  supplier: string;
  requires_cold_chain: boolean;
  status: boolean;
  description?: string;
  storageInstructions?: string;
  category?: string;
  stock?: number;
  warehouseId?: string;
  location_identifier?: string;
}

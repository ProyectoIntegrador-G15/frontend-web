export interface Product {
  id: string;
  name: string;
  price: number;
  provider: string;
  needsCold: boolean;
  status: 'active' | 'inactive';
  description?: string;
  storageInstructions?: string;
  category?: string;
  stock?: number;
  warehouseId?: string;
}

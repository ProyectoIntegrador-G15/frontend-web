export interface SupplierInfo {
  id: number;
  name: string;
  nit: string;
  email: string;
  country: string;
  city: string;
}

export interface Product {
  id: string;
  name: string;
  purchase_price: number;
  supplier?: SupplierInfo | null; // Información del proveedor cuando está disponible
  supplier_id?: number; // ID del proveedor (para compatibilidad)
  requires_cold_chain: boolean;
  status: boolean;
  description?: string;
  storageInstructions?: string;
  category?: string;
  stock?: number;
  warehouseId?: string;
  location_identifier?: string;
}

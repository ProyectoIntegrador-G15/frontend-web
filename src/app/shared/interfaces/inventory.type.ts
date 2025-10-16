export interface WarehouseInventory {
  warehouse_id: string;
  name: string;
  city: string;
  country: string;
  address: string;
  status: string;
  available_quantity: number;
  location_identifier: string;
}

export interface ProductInventory {
  product_id: string;
  product_name: string;
  warehouses: WarehouseInventory[];
  total_warehouses: number;
  total_quantity: number;
}

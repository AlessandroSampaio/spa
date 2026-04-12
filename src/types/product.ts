export interface CostDataPoint {
  month: string;
  value: number;
}

export interface LastTransaction {
  date: string;
  price: number;
  quantity: number;
}

export interface ProductDashboard {
  code: string;
  name: string;
  avgSalesLast6Months: number;
  costHistory: CostDataPoint[];
  salesHistory: CostDataPoint[];
  currentStock: number;
  avgDailySales: number;
  purchaseSuggestion: number;
  lastPurchase: LastTransaction;
  lastSale: LastTransaction;
}

export interface Stats {
  totalFurniture: number;
  totalAvailable: number;
  totalSold: number;
  totalArchived: number;
  averagePrice: number;
  maxPrice: number;
  minPrice: number;
  countByCategory: { [key: string]: number };
  avgPriceByCategory: { [key: string]: number };
  countByCondition: { [key: string]: number };
  top5Expensive: any[];
  totalOffers: number;
  pendingOffers: number;
  totalReports: number;
  pendingReports: number;
}

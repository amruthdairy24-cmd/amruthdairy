export interface ReportsRequestQuery {
  startDate: string;
  endDate: string;
  targetMonth: string;
}

export interface DefaulterRow {
  customerId: string;
  name: string;
  phone?: string;
  amountDue: number;
}

export interface ReportsData {
  financials: {
    realizedRevenue: number;
    collectionRate: number;
    outstandingDue: number;
    projectedMonthlyRevenue: number;
    dailyRevenueAverage: number;
    revenueLeakage: number;
    extraMilkRevenue: number;
    referralCredits: number;
    carryForwardUtilized: number;
    productRevenue: number;
    arpu: number;
    ltv: number;
    paymentMethodBreakdown: Record<string, number>;
  };
  operations: {
    netMilkDelivered: number;
    deliverySuccessRate: number;
  };
  customers: {
    activeCustomers: number;
    cancelledCustomers: number;
    waitlistSize: number;
    newCustomers: number;
    subscriptionDistribution: Record<string, number>;
  };
  exceptions: {
    topDefaulters: DefaulterRow[];
  };
  trends: {
    daily: { date: string; revenue: number; volume: number }[];
    monthly: { month: string; revenue: number; volume: number }[];
  };
}

export interface ReportsResponse {
  data: ReportsData;
  meta: {
    cached: boolean;
    timestamp: string;
  };
}

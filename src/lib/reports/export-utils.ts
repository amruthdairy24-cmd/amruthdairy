import * as xlsx from 'xlsx';
import { ReportsData } from './types';

export function flattenReportsDataForExport(data: ReportsData): any[] {
  // Create a flat array of key-value pairs suitable for a spreadsheet
  const flatData = [
    { Category: 'Financials', Metric: 'Realized Revenue', Value: data.financials.realizedRevenue },
    { Category: 'Financials', Metric: 'Collection Rate (%)', Value: data.financials.collectionRate.toFixed(2) },
    { Category: 'Financials', Metric: 'Outstanding Due', Value: data.financials.outstandingDue },
    { Category: 'Financials', Metric: 'Projected Monthly Revenue', Value: data.financials.projectedMonthlyRevenue },
    { Category: 'Financials', Metric: 'Daily Revenue Average', Value: data.financials.dailyRevenueAverage.toFixed(2) },
    { Category: 'Financials', Metric: 'Revenue Leakage', Value: data.financials.revenueLeakage },
    { Category: 'Financials', Metric: 'Extra Milk Revenue', Value: data.financials.extraMilkRevenue },
    { Category: 'Financials', Metric: 'Product Revenue', Value: data.financials.productRevenue },
    { Category: 'Financials', Metric: 'Average Revenue Per User', Value: data.financials.arpu.toFixed(2) },
    
    { Category: 'Operations', Metric: 'Net Milk Delivered (L)', Value: data.operations.netMilkDelivered },
    { Category: 'Operations', Metric: 'Delivery Success Rate (%)', Value: data.operations.deliverySuccessRate.toFixed(2) },

    { Category: 'Customers', Metric: 'Active Customers', Value: data.customers.activeCustomers },
    { Category: 'Customers', Metric: 'Cancelled Customers', Value: data.customers.cancelledCustomers },
    { Category: 'Customers', Metric: 'Waitlist Size', Value: data.customers.waitlistSize },
    { Category: 'Customers', Metric: 'New Customers', Value: data.customers.newCustomers },
  ];

  // Add Payment Methods
  Object.entries(data.financials.paymentMethodBreakdown).forEach(([method, amount]) => {
    flatData.push({ Category: 'Payment Methods', Metric: method.toUpperCase(), Value: amount });
  });

  // Add Subscription Mix
  Object.entries(data.customers.subscriptionDistribution).forEach(([plan, count]) => {
    flatData.push({ Category: 'Subscription Plan', Metric: plan, Value: count });
  });

  return flatData;
}

export function generateExcelBuffer(data: any[]): Buffer {
  const worksheet = xlsx.utils.json_to_sheet(data);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Reports');
  return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

export function generateCsvString(data: any[]): string {
  const worksheet = xlsx.utils.json_to_sheet(data);
  return xlsx.utils.sheet_to_csv(worksheet);
}

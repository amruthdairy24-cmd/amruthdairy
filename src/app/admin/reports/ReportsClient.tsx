'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { format, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay } from 'date-fns';
import { Download, Wallet, Activity, ArrowUpRight, Users } from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { MetricCard } from '@/components/admin/reports/MetricCard';
import { DateRangeFilter } from '@/components/admin/reports/DateRangeFilter';
import AreaTrendChart from '@/components/admin/reports/AreaTrendChart';
import StackedBarChart from '@/components/admin/reports/StackedBarChart';
import { MonthlyComparisonChart } from '@/components/admin/reports/MonthlyComparisonChart';
import { ExceptionTable } from '@/components/admin/reports/ExceptionTable';
import { ReportsResponse } from '@/lib/reports/types';

// No dynamic imports needed since components use 'use client'

const fetchReports = async (startDate: string, endDate: string, targetMonth: string): Promise<ReportsResponse> => {
  const res = await fetch(`/api/admin/reports?startDate=${startDate}&endDate=${endDate}&targetMonth=${targetMonth}`);
  if (!res.ok) throw new Error('Failed to fetch reports');
  return res.json();
};

export function ReportsClient() {
  const searchParams = useSearchParams();
  const range = searchParams.get('range') || 'month';
  const now = new Date();

  // Compute dates based on range
  let startDate = '';
  let endDate = '';
  let targetMonth = format(now, 'yyyy-MM-01');

  if (range === 'today') {
    startDate = format(startOfDay(now), 'yyyy-MM-dd');
    endDate = format(endOfDay(now), 'yyyy-MM-dd');
  } else if (range === 'week') {
    startDate = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    endDate = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  } else {
    startDate = format(startOfMonth(now), 'yyyy-MM-dd');
    endDate = format(endOfMonth(now), 'yyyy-MM-dd');
  }

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-reports', startDate, endDate, targetMonth],
    queryFn: () => fetchReports(startDate, endDate, targetMonth),
    staleTime: 5 * 60 * 1000,
  });

  const handleExport = (formatType: 'csv' | 'excel') => {
    window.location.href = `/api/admin/reports/export?startDate=${startDate}&endDate=${endDate}&targetMonth=${targetMonth}&format=${formatType}`;
  };

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">Reports</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Operational intelligence and financial health.</p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangeFilter />
          <button 
            onClick={() => handleExport('csv')}
            className="flex items-center gap-2 px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black rounded-md text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {error ? (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-200">
          Failed to load dashboard data. Please try refreshing.
        </div>
      ) : null}

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Realized Revenue" 
          value={data ? `₹${data.data.financials.realizedRevenue.toLocaleString('en-IN')}` : '₹0'} 
          icon={Wallet}
          loading={isLoading}
          trendPercentage={data?.data.financials.collectionRate}
          subtitle="collection rate"
        />
        <MetricCard 
          title="Pending Dues" 
          value={data ? `₹${data.data.financials.outstandingDue.toLocaleString('en-IN')}` : '₹0'} 
          icon={Activity}
          loading={isLoading}
          action={<button className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline">Remind all</button>}
        />
        <MetricCard 
          title="Net Milk Delivered" 
          value={data ? `${data.data.operations.netMilkDelivered.toLocaleString()} L` : '0 L'} 
          icon={ArrowUpRight}
          loading={isLoading}
          trendPercentage={data?.data.operations.deliverySuccessRate}
          subtitle="success rate"
        />
        <MetricCard 
          title="Active Customers" 
          value={data?.data.customers.activeCustomers || 0} 
          icon={Users}
          loading={isLoading}
          subtitle={`${data?.data.customers.newCustomers || 0} new this period`}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-medium text-slate-900 dark:text-slate-50 mb-6">Revenue Pacing</h3>
          <AreaTrendChart data={data?.data.trends.daily || []} />
        </div>
        <div className="bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-medium text-slate-900 dark:text-slate-50 mb-6">Volume Logistics</h3>
          <StackedBarChart data={data?.data.trends.daily || []} />
        </div>
        <div className="bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-medium text-slate-900 dark:text-slate-50 mb-6">Monthly Comparison</h3>
          <MonthlyComparisonChart data={data?.data.trends.monthly || []} />
        </div>
      </div>

      {/* Exception Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-[#27272A] flex justify-between items-center">
            <h3 className="text-sm font-medium text-slate-900 dark:text-slate-50">Top Defaulters</h3>
          </div>
          {isLoading ? (
            <div className="h-[200px] flex items-center justify-center"><div className="w-6 h-6 border-2 border-slate-900 dark:border-white border-t-transparent rounded-full animate-spin"></div></div>
          ) : (
            <ExceptionTable data={data?.data.exceptions.topDefaulters || []} />
          )}
        </div>

        <div className="bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#27272A] rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-[#27272A] flex justify-between items-center">
            <h3 className="text-sm font-medium text-slate-900 dark:text-slate-50">Business Health</h3>
          </div>
          {isLoading ? (
            <div className="h-[200px] flex items-center justify-center"><div className="w-6 h-6 border-2 border-slate-900 dark:border-white border-t-transparent rounded-full animate-spin"></div></div>
          ) : (
            <div className="p-5 space-y-4">
               <div className="flex justify-between text-sm">
                 <span className="text-slate-500">Revenue Leakage (Skips/Vacations)</span>
                 <span className="font-medium text-red-600">₹{data?.data.financials.revenueLeakage.toLocaleString('en-IN')}</span>
               </div>
               <div className="flex justify-between text-sm">
                 <span className="text-slate-500">Extra Milk Revenue</span>
                 <span className="font-medium text-emerald-600">₹{data?.data.financials.extraMilkRevenue.toLocaleString('en-IN')}</span>
               </div>
               <div className="flex justify-between text-sm border-t border-slate-100 dark:border-slate-800 pt-4">
                 <span className="text-slate-500">Waitlist Size</span>
                 <span className="font-medium text-amber-600">{data?.data.customers.waitlistSize}</span>
               </div>
               <div className="flex justify-between text-sm">
                 <span className="text-slate-500">Recent Cancellations</span>
                 <span className="font-medium text-red-600">{data?.data.customers.cancelledCustomers}</span>
               </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

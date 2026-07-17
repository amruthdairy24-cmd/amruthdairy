'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

export interface DashboardData {
  success: boolean;
  profile: {
    full_name: string;
    phone: string;
    address: string;
  };
  subscription: {
    id: string;
    status: string;
    quantity_litres: number;
    monthly_amount: number;
    daily_rate: number;
    start_date: string;
    balance: number;
  } | null;
  waitlist?: {
    id: string;
    quantity_litres: number;
    requested_start_date: string;
    position: number;
    status: string;
    created_at: string;
  } | null;
  current_month: {
    billing_month: string;
    days_delivered: number;
    days_skipped: number;
    days_paused: number;
    extra_litres_ordered: number;
    skip_credit: number;
    pause_credit: number;
    extra_charges: number;
    carry_in_balance: number;
    net_due: number;
    amount_paid: number;
  } | null;
  upcoming_skips: Array<{ skip_date: string; credit_amount: number }>;
  upcoming_extras?: Array<{ id: string; order_date: string; extra_litres: number; charge_amount: number; skip_credit_applied: number; net_charge_amount: number; status: string }>;
  active_vacation: { pause_start: string; pause_end: string; total_credit: number; total_days?: number; resume_date?: string; status?: string } | null;
  next_month_change: { quantity: number; amount: number } | null;
  recent_deliveries: Array<{ delivery_date: string; total_litres: number; delivery_status: string }>;
  upcoming_adjustments?: Array<{ id: string; adjustment_type: string; amount: number; description: string; target_month: string; refund_status?: string }>;
  latest_paid_month: string | null;
  excluded_dates?: string[];
}

interface DashboardDataContextType {
  data: DashboardData | null;
  loading: boolean;
  error: string;
  refetch: () => Promise<void>;
}

const DashboardDataContext = createContext<DashboardDataContextType | undefined>(undefined)

export function DashboardDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchDashboardData = useCallback(async (isRefetch = false) => {
    if (!isRefetch) setLoading(true)
    try {
      const res = await fetch('/api/customer/dashboard')
      const json = await res.json()
      if (json.success) {
        setData(json)
      } else {
        setError(json.message || 'Failed to retrieve dashboard data')
      }
    } catch (err) {
      setError('Network error loading dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  return (
    <DashboardDataContext.Provider value={{ data, loading, error, refetch: () => fetchDashboardData(true) }}>
      {children}
    </DashboardDataContext.Provider>
  )
}

export function useDashboardData() {
  const context = useContext(DashboardDataContext)
  if (!context) {
    throw new Error('useDashboardData must be used within a DashboardDataProvider')
  }
  return context
}

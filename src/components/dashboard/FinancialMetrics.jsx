'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates'
import { toast } from 'sonner'

export default function FinancialMetrics({ projectId = null }) {
  const [metrics, setMetrics] = useState({
    revenue: 0,
    costs: 0,
    profit: 0,
    loading: true
  })

  const [previousMetrics, setPreviousMetrics] = useState({
    revenue: 0,
    costs: 0,
    profit: 0
  })

  useEffect(() => {
    let isMounted = true

    const fetchMetrics = async () => {
      try {
        const endpoint = projectId
          ? `/api/projects/${projectId}/financials`
          : '/api/financials/summary'

        const res = await fetch(endpoint)
        if (res.ok && isMounted) {
          const data = await res.json()

          setPreviousMetrics({
            revenue: metrics.revenue,
            costs: metrics.costs,
            profit: metrics.profit
          })

          setMetrics({
            revenue: parseFloat(data.revenue || 0),
            costs: parseFloat(data.costs || 0),
            profit: parseFloat(data.profit || 0),
            loading: false
          })
        }
      } catch (error) {
        console.error('Error fetching financial metrics:', error)
        if (isMounted) {
          setMetrics(prev => ({ ...prev, loading: false }))
        }
      }
    }

    const timer = window.setTimeout(() => {
      void fetchMetrics()
    }, 0)

    return () => {
      isMounted = false
      window.clearTimeout(timer)
    }
  }, [projectId])

  // Real-time event handlers
  const eventHandlers = {
    // Sales Order events (increase revenue)
    sales_order_created: (data) => {
      if (projectId && data.projectId !== projectId) return
      
      const amount = parseFloat(data.totalAmount || 0)
      setMetrics(prev => ({
        ...prev,
        revenue: prev.revenue + amount,
        profit: (prev.revenue + amount) - prev.costs
      }))
      toast.success(`Revenue +$${amount.toFixed(2)}`)
    },

    sales_order_updated: (data) => {
      if (projectId && data.projectId !== projectId) return
      fetchMetrics() // Refetch to get accurate numbers
    },

    sales_order_deleted: (data) => {
      if (projectId && data.projectId !== projectId) return
      fetchMetrics()
    },

    // Customer Invoice events (increase revenue)
    invoice_created: (data) => {
      if (projectId && data.projectId !== projectId) return
      
      const amount = parseFloat(data.totalAmount || 0)
      setMetrics(prev => ({
        ...prev,
        revenue: prev.revenue + amount,
        profit: (prev.revenue + amount) - prev.costs
      }))
      toast.success(`Revenue +$${amount.toFixed(2)} (Invoice)`)
    },

    invoice_updated: (data) => {
      if (projectId && data.projectId !== projectId) return
      fetchMetrics()
    },

    invoice_paid: (data) => {
      if (projectId && data.projectId !== projectId) return
      toast.info(`Invoice ${data.invoiceNumber} marked as paid`)
    },

    // Purchase Order events (increase costs)
    purchase_order_created: (data) => {
      if (projectId && data.projectId !== projectId) return
      
      const amount = parseFloat(data.totalAmount || 0)
      setMetrics(prev => ({
        ...prev,
        costs: prev.costs + amount,
        profit: prev.revenue - (prev.costs + amount)
      }))
      toast.info(`Costs +$${amount.toFixed(2)}`)
    },

    purchase_order_updated: (data) => {
      if (projectId && data.projectId !== projectId) return
      fetchMetrics()
    },

    purchase_order_deleted: (data) => {
      if (projectId && data.projectId !== projectId) return
      fetchMetrics()
    },

    // Vendor Bill events (increase costs)
    vendor_bill_created: (data) => {
      if (projectId && data.projectId !== projectId) return
      
      const amount = parseFloat(data.totalAmount || 0)
      setMetrics(prev => ({
        ...prev,
        costs: prev.costs + amount,
        profit: prev.revenue - (prev.costs + amount)
      }))
      toast.info(`Costs +$${amount.toFixed(2)} (Vendor Bill)`)
    },

    vendor_bill_updated: (data) => {
      if (projectId && data.projectId !== projectId) return
      fetchMetrics()
    },

    vendor_bill_paid: (data) => {
      if (projectId && data.projectId !== projectId) return
      toast.info(`Vendor bill ${data.billNumber} marked as paid`)
    },

    // Expense events (increase costs)
    expense_approved: (data) => {
      if (projectId && data.projectId !== projectId) return
      
      const amount = parseFloat(data.amount || 0)
      setMetrics(prev => ({
        ...prev,
        costs: prev.costs + amount,
        profit: prev.revenue - (prev.costs + amount)
      }))
      toast.info(`Costs +$${amount.toFixed(2)} (Expense)`)
    },

    // Timesheet billed (affects costs)
    timesheet_billed: (data) => {
      if (projectId && data.projectId !== projectId) return
      fetchMetrics()
    }
  }

  const { isConnected } = useRealtimeUpdates(eventHandlers)

  const profitMargin = metrics.revenue > 0 
    ? ((metrics.profit / metrics.revenue) * 100).toFixed(1)
    : 0

  const getChangeIndicator = (current, previous) => {
    if (previous === 0) return null
    const change = current - previous
    if (Math.abs(change) < 0.01) return null
    
    return change > 0 ? (
      <span className="flex items-center text-green-600 text-sm ml-2">
        <ArrowUpRight className="w-4 h-4" />
        +${Math.abs(change).toFixed(2)}
      </span>
    ) : (
      <span className="flex items-center text-red-600 text-sm ml-2">
        <ArrowDownRight className="w-4 h-4" />
        -${Math.abs(change).toFixed(2)}
      </span>
    )
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  if (metrics.loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted animate-pulse rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Revenue Card */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8">
          <div className="w-full h-full bg-green-500/10 rounded-full"></div>
        </div>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Revenue
          </CardTitle>
          <DollarSign className="h-5 w-5 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline">
            <div className="text-3xl font-bold text-green-600">
              {formatCurrency(metrics.revenue)}
            </div>
            {getChangeIndicator(metrics.revenue, previousMetrics.revenue)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            From invoices & sales orders
          </p>
        </CardContent>
      </Card>

      {/* Costs Card */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8">
          <div className="w-full h-full bg-red-500/10 rounded-full"></div>
        </div>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Costs
          </CardTitle>
          <TrendingDown className="h-5 w-5 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline">
            <div className="text-3xl font-bold text-red-600">
              {formatCurrency(metrics.costs)}
            </div>
            {getChangeIndicator(metrics.costs, previousMetrics.costs)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            POs, bills, expenses & timesheets
          </p>
        </CardContent>
      </Card>

      {/* Profit Card */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8">
          <div className={`w-full h-full ${metrics.profit >= 0 ? 'bg-blue-500/10' : 'bg-orange-500/10'} rounded-full`}></div>
        </div>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Net Profit
          </CardTitle>
          {metrics.profit >= 0 ? (
            <TrendingUp className="h-5 w-5 text-blue-600" />
          ) : (
            <Wallet className="h-5 w-5 text-orange-600" />
          )}
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline">
            <div className={`text-3xl font-bold ${metrics.profit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
              {formatCurrency(metrics.profit)}
            </div>
            {getChangeIndicator(metrics.profit, previousMetrics.profit)}
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-muted-foreground">
              Revenue - Costs
            </p>
            <span className={`text-xs font-medium ${metrics.profit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
              {profitMargin}% margin
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Connection Status Indicator (optional) */}
      {!isConnected && (
        <div className="col-span-3">
          <div className="text-center py-2 px-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            ⚠️ Real-time updates disconnected. Metrics may be outdated. Refresh the page.
          </div>
        </div>
      )}
    </div>
  )
}

'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, Filter, Loader2, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function SalesOrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [user, setUser] = useState(null)

  useEffect(() => {
    checkUserRole()
  }, [])

  const checkUserRole = async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' })
      if (!res.ok) {
        window.location.href = '/login'
        return
      }
      const userData = await res.json()
      if (userData.role !== 'sales_finance' && userData.role !== 'admin') {
        toast.error('Access denied: Sales & Finance role required')
        window.location.href = '/admin/dashboard'
        return
      }
      setUser(userData)
      fetchSalesOrders()
    } catch (error) {
      window.location.href = '/login'
    }
  }

  const fetchSalesOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/sales-orders')
      if (!response.ok) throw new Error('Failed to fetch sales orders')
      const data = await response.json()
      setOrders(data)
    } catch (error) {
      console.error('Error fetching sales orders:', error)
      toast.error('Failed to load sales orders')
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = orders.filter(order =>
    order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.project?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      done: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Sales Orders</h1>
          <p className="text-muted-foreground">Track expected revenue from clients</p>
        </div>
        <Button asChild>
          <Link href="/admin/dashboard/sales-orders/create">
            <Plus className="w-4 h-4 mr-2" />
            New Sales Order
          </Link>
        </Button>
      </div>

      <div className="bg-card border rounded-xl">
        <div className="p-4 border-b flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search sales orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg bg-card/50 backdrop-blur-sm"
            />
          </div>
          <Button variant="outline"><Filter className="w-4 h-4 mr-2" />Filter</Button>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No sales orders found</h3>
            <p className="text-muted-foreground mb-4">Create your first sales order to track revenue</p>
            <Button asChild>
              <Link href="/admin/dashboard/sales-orders/create">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Sales Order
              </Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="text-left p-4 font-medium text-sm">Order #</th>
                  <th className="text-left p-4 font-medium text-sm">Project</th>
                  <th className="text-left p-4 font-medium text-sm">Customer</th>
                  <th className="text-left p-4 font-medium text-sm">Order Date</th>
                  <th className="text-left p-4 font-medium text-sm">Total Amount</th>
                  <th className="text-left p-4 font-medium text-sm">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/50">
                    <td className="p-4 font-medium">{order.orderNumber}</td>
                    <td className="p-4">{order.project?.name || 'N/A'}</td>
                    <td className="p-4">{order.customer?.name || 'N/A'}</td>
                    <td className="p-4">{new Date(order.orderDate).toLocaleDateString()}</td>
                    <td className="p-4 font-semibold">${Number(order.totalAmount).toFixed(2)}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs capitalize ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

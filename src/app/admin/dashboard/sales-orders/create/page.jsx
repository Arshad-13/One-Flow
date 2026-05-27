'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function CreateSalesOrderPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState([])
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [user, setUser] = useState(null)

  const [formData, setFormData] = useState({
    projectId: '',
    customerId: '',
    orderDate: new Date().toISOString().split('T')[0],
    status: 'draft',
    notes: '',
    lines: [{ productId: '', description: '', quantity: 1, unitPrice: 0 }]
  })

  useEffect(() => {
    checkUserRole()
    fetchData()
  }, [])

  const checkUserRole = async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' })
      if (!res.ok) {
        router.push('/login')
        return
      }
      const userData = await res.json()
      if (userData.role !== 'sales_finance' && userData.role !== 'admin') {
        toast.error('Access denied: Sales & Finance or Admin role required')
        router.push('/admin/dashboard')
        return
      }
      setUser(userData)
    } catch (error) {
      router.push('/login')
    }
  }

  const fetchData = async () => {
    try {
      const [projectsRes, customersRes, productsRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/partners?type=customer'),
        fetch('/api/products')
      ])

      if (projectsRes.ok) setProjects(await projectsRes.json())
      if (customersRes.ok) setCustomers(await customersRes.json())
      if (productsRes.ok) setProducts(await productsRes.json())
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const handleAddLine = () => {
    setFormData({
      ...formData,
      lines: [...formData.lines, { productId: '', description: '', quantity: 1, unitPrice: 0 }]
    })
  }

  const handleRemoveLine = (index) => {
    const newLines = formData.lines.filter((_, i) => i !== index)
    setFormData({ ...formData, lines: newLines })
  }

  const handleLineChange = (index, field, value) => {
    const newLines = [...formData.lines]
    newLines[index][field] = value

    // Auto-fill price and description when product is selected
    if (field === 'productId' && value) {
      const product = products.find(p => p.id === parseInt(value))
      if (product) {
        newLines[index].unitPrice = Number(product.unitPrice)
        newLines[index].description = product.name
      }
    }

    setFormData({ ...formData, lines: newLines })
  }

  const calculateTotal = () => {
    return formData.lines.reduce((sum, line) => {
      return sum + (Number(line.quantity) * Number(line.unitPrice))
    }, 0)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.customerId) {
      toast.error('Please select a customer')
      return
    }

    if (formData.lines.length === 0 || !formData.lines[0].description) {
      toast.error('Please add at least one order line')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/sales-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          projectId: formData.projectId || null,
          totalAmount: calculateTotal()
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create sales order')
      }

      toast.success('Sales order created successfully!')
      router.push('/admin/dashboard/sales-orders')
    } catch (error) {
      console.error('Error creating sales order:', error)
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <Button variant="outline" size="sm" asChild className="mb-4">
          <Link href="/admin/dashboard/sales-orders">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sales Orders
          </Link>
        </Button>
        <h1 className="text-3xl font-bold mb-2">Create Sales Order</h1>
        <p className="text-muted-foreground">Create a new sales order to track expected revenue</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Order Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Customer *</label>
              <select
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg bg-card/50 backdrop-blur-sm"
                required
              >
                <option value="">Select customer</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>{customer.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Project (Optional)</label>
              <select
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg bg-card/50 backdrop-blur-sm"
              >
                <option value="">Select project</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Order Date *</label>
              <input
                type="date"
                value={formData.orderDate}
                onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg bg-card/50 backdrop-blur-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg bg-card/50 backdrop-blur-sm"
              >
                <option value="draft">Draft</option>
                <option value="confirmed">Confirmed</option>
                <option value="done">Done</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg bg-card/50 backdrop-blur-sm"
              rows={3}
              placeholder="Additional notes..."
            />
          </div>
        </div>

        <div className="bg-card border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Order Lines</h2>
            <Button type="button" variant="outline" size="sm" onClick={handleAddLine}>
              <Plus className="w-4 h-4 mr-2" />
              Add Line
            </Button>
          </div>

          <div className="space-y-4">
            {formData.lines.map((line, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium mb-2">Product</label>
                    <select
                      value={line.productId}
                      onChange={(e) => handleLineChange(index, 'productId', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg bg-card/50 backdrop-blur-sm text-sm"
                    >
                      <option value="">Select product</option>
                      {products.map(product => (
                        <option key={product.id} value={product.id}>{product.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-4">
                    <label className="block text-sm font-medium mb-2">Description *</label>
                    <input
                      type="text"
                      value={line.description}
                      onChange={(e) => handleLineChange(index, 'description', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg bg-card/50 backdrop-blur-sm text-sm"
                      placeholder="Item description"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Quantity *</label>
                    <input
                      type="number"
                      value={line.quantity}
                      onChange={(e) => handleLineChange(index, 'quantity', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg bg-card/50 backdrop-blur-sm text-sm"
                      min="0.01"
                      step="0.01"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Unit Price *</label>
                    <input
                      type="number"
                      value={line.unitPrice}
                      onChange={(e) => handleLineChange(index, 'unitPrice', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg bg-card/50 backdrop-blur-sm text-sm"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div className="md:col-span-1 flex items-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveLine(index)}
                      disabled={formData.lines.length === 1}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-2 text-right text-sm font-medium">
                  Subtotal: ${(Number(line.quantity) * Number(line.unitPrice)).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t">
            <div className="flex justify-end">
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
                <p className="text-2xl font-bold">${calculateTotal().toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4 justify-end">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Create Sales Order
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, Save, Loader2, Building2, Scan } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function VendorBillForm({ 
  projectId, 
  existingBill = null, 
  isOpen, 
  onClose, 
  onSuccess 
}) {
  const [loading, setLoading] = useState(false)
  const [ocrLoading, setOcrLoading] = useState(false)
  const [vendors, setVendors] = useState([])
  const [loadingVendors, setLoadingVendors] = useState(true)
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const fileInputRef = useRef(null)

  // Form state
  const [formData, setFormData] = useState({
    billNumber: '',
    vendorId: '',
    purchaseOrderId: '',
    billDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    status: 'draft',
    notes: '',
    lines: [{ description: '', quantity: 1, unitPrice: 0 }]
  })

  useEffect(() => {
    if (isOpen) {
      fetchVendors()
      fetchPurchaseOrders()
      
      // If editing existing bill, populate form
      if (existingBill) {
        setFormData({
          billNumber: existingBill.billNumber,
          vendorId: existingBill.vendorId.toString(),
          purchaseOrderId: existingBill.purchaseOrderId?.toString() || '',
          billDate: existingBill.billDate ? new Date(existingBill.billDate).toISOString().split('T')[0] : '',
          dueDate: existingBill.dueDate ? new Date(existingBill.dueDate).toISOString().split('T')[0] : '',
          status: existingBill.status,
          notes: existingBill.notes || '',
          lines: existingBill.lines?.length > 0 
            ? existingBill.lines.map(line => ({
                description: line.description,
                quantity: line.quantity,
                unitPrice: line.unitPrice
              }))
            : [{ description: '', quantity: 1, unitPrice: 0 }]
        })
      } else {
        // Generate bill number for new bills
        generateBillNumber()
      }
    }
  }, [isOpen, existingBill])

  const fetchVendors = async () => {
    try {
      setLoadingVendors(true)
      const res = await fetch('/api/partners?type=vendor')
      if (res.ok) {
        const data = await res.json()
        setVendors(data)
      }
    } catch (error) {
      console.error('Error fetching vendors:', error)
      toast.error('Failed to load vendors')
    } finally {
      setLoadingVendors(false)
    }
  }

  const fetchPurchaseOrders = async () => {
    try {
      const res = await fetch(`/api/purchase-orders?projectId=${projectId}`)
      if (res.ok) {
        const data = await res.json()
        setPurchaseOrders(data)
      }
    } catch (error) {
      console.error('Error fetching purchase orders:', error)
    }
  }

  const generateBillNumber = () => {
    const timestamp = Date.now().toString().slice(-6)
    const randomNum = Math.floor(Math.random() * 100).toString().padStart(2, '0')
    setFormData(prev => ({
      ...prev,
      billNumber: `VB-${timestamp}-${randomNum}`
    }))
  }

  const handleOcrScan = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    setOcrLoading(true)
    toast.info('Scanning bill... This may take a few seconds')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/ocr/process-bill', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || error.error || 'Failed to process bill')
      }

      const ocrData = await response.json()

      // Update form with OCR data
      setFormData(prev => ({
        ...prev,
        billDate: ocrData.billDate || prev.billDate,
        lines: ocrData.lines.length > 0 ? ocrData.lines : prev.lines,
      }))

      toast.success('Bill scanned successfully! Review and adjust the extracted data.')
    } catch (error) {
      console.error('Error processing OCR:', error)
      toast.error(error.message || 'Failed to scan bill')
    } finally {
      setOcrLoading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const calculateTotal = () => {
    return formData.lines.reduce((sum, line) => {
      return sum + (parseFloat(line.quantity) || 0) * (parseFloat(line.unitPrice) || 0)
    }, 0)
  }

  const handleAddLine = () => {
    setFormData(prev => ({
      ...prev,
      lines: [...prev.lines, { description: '', quantity: 1, unitPrice: 0 }]
    }))
  }

  const handleRemoveLine = (index) => {
    if (formData.lines.length === 1) {
      toast.error('Must have at least one line item')
      return
    }
    setFormData(prev => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index)
    }))
  }

  const handleLineChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      lines: prev.lines.map((line, i) => 
        i === index ? { ...line, [field]: value } : line
      )
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validation
    if (!formData.billNumber || !formData.vendorId) {
      toast.error('Please fill in all required fields')
      return
    }

    if (formData.lines.some(line => !line.description || line.quantity <= 0 || line.unitPrice < 0)) {
      toast.error('Please complete all line items with valid values')
      return
    }

    try {
      setLoading(true)

      const totalAmount = calculateTotal()
      const payload = {
        projectId,
        billNumber: formData.billNumber,
        vendorId: parseInt(formData.vendorId),
        ...(formData.purchaseOrderId && formData.purchaseOrderId !== 'null' && { purchaseOrderId: parseInt(formData.purchaseOrderId) }),
        billDate: formData.billDate,
        dueDate: formData.dueDate || null,
        status: formData.status,
        totalAmount,
        notes: formData.notes,
        lines: formData.lines.map(line => ({
          description: line.description,
          quantity: parseFloat(line.quantity),
          unitPrice: parseFloat(line.unitPrice)
        }))
      }

      const url = existingBill 
        ? `/api/vendor-bills/${existingBill.id}`
        : '/api/vendor-bills'
      
      const method = existingBill ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        toast.success(existingBill ? 'Vendor Bill updated!' : 'Vendor Bill created!')
        if (onSuccess) onSuccess()
        handleClose()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to save Vendor Bill')
      }
    } catch (error) {
      console.error('Error saving vendor bill:', error)
      toast.error('Failed to save Vendor Bill')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      billNumber: '',
      vendorId: '',
      purchaseOrderId: '',
      billDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      status: 'draft',
      notes: '',
      lines: [{ description: '', quantity: 1, unitPrice: 0 }]
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Building2 className="w-6 h-6" />
            {existingBill ? 'Edit Vendor Bill' : 'Create Vendor Bill'}
          </DialogTitle>
          <DialogDescription>
            {existingBill 
              ? 'Update the vendor bill details below'
              : 'Record an invoice from a vendor for goods or services provided to this project'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-1 pr-2">
          {/* OCR Scan Section */}
          {!existingBill && (
            <div className="bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1 flex items-center gap-2">
                    <Scan className="w-4 h-4" />
                    Scan Bill with OCR
                  </h4>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Upload an image of your bill to automatically extract line items and amounts
                  </p>
                </div>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleOcrScan}
                    className="hidden"
                    id="ocr-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={ocrLoading}
                    className="gap-2"
                  >
                    {ocrLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Scanning...
                      </>
                    ) : (
                      <>
                        <Scan className="w-4 h-4" />
                        Scan Bill
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Header Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Bill Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="billNumber">Bill Number *</Label>
                <Input
                  id="billNumber"
                  value={formData.billNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, billNumber: e.target.value }))}
                  placeholder="VB-123456"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="billDate">Bill Date *</Label>
                <Input
                  id="billDate"
                  type="date"
                  value={formData.billDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, billDate: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vendor">Vendor *</Label>
                <Select 
                  value={formData.vendorId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, vendorId: value }))}
                  disabled={loadingVendors}
                >
                  <SelectTrigger id="vendor">
                    <SelectValue placeholder={loadingVendors ? "Loading vendors..." : "Select vendor"} />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id.toString()}>
                        {vendor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchaseOrder">Link to Purchase Order (Optional)</Label>
                <Select 
                  value={formData.purchaseOrderId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, purchaseOrderId: value }))}
                >
                  <SelectTrigger id="purchaseOrder">
                    <SelectValue placeholder="Select purchase order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="null">No Purchase Order</SelectItem>
                    {purchaseOrders.map((po) => (
                      <SelectItem key={po.id} value={po.id.toString()}>
                        {po.orderNumber} - {po.vendor?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="posted">Posted</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg">Bill Items</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddLine}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Line
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-3">
                {formData.lines.map((line, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-card">
                    <div className="space-y-4">
                      <div className="grid grid-cols-4 gap-4">
                        <div className="col-span-2">
                          <Label htmlFor={`description-${index}`} className="text-xs mb-1 block">Description *</Label>
                          <Input
                            id={`description-${index}`}
                            value={line.description}
                            onChange={(e) => handleLineChange(index, 'description', e.target.value)}
                            placeholder="Item or service description"
                            className="h-9 text-xs"
                            required
                          />
                        </div>
                        <div className="col-span-1">
                          <Label htmlFor={`quantity-${index}`} className="text-xs mb-1 block">Qty *</Label>
                          <Input
                            id={`quantity-${index}`}
                            type="number"
                            min="0"
                            step="0.01"
                            value={line.quantity}
                            onChange={(e) => handleLineChange(index, 'quantity', e.target.value)}
                            className="h-9 text-xs"
                            required
                          />
                        </div>
                        <div className="col-span-1">
                          <Label htmlFor={`unitPrice-${index}`} className="text-xs mb-1 block">Price *</Label>
                          <Input
                            id={`unitPrice-${index}`}
                            type="number"
                            min="0"
                            step="0.01"
                            value={line.unitPrice}
                            onChange={(e) => handleLineChange(index, 'unitPrice', e.target.value)}
                            className="h-9 text-xs"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t pt-3">
                        <div className="text-right text-xs">
                          <p className="text-muted-foreground">Subtotal</p>
                          <p className="font-semibold text-sm">${((parseFloat(line.quantity) || 0) * (parseFloat(line.unitPrice) || 0)).toFixed(2)}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveLine(index)}
                          disabled={formData.lines.length === 1}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">${calculateTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-semibold">Total</span>
                  <span className="text-lg font-bold">${calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes or special terms..."
              rows={2}
              className="resize-none text-sm"
            />
          </div>
        </form>

        {/* Action Buttons - Fixed at bottom */}
        <div className="flex justify-end gap-3 pt-4 border-t mt-4 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={loading}
            onClick={handleSubmit}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {existingBill ? 'Update' : 'Create'} Vendor Bill
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

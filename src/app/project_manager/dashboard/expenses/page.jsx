'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, Filter, Loader2, Receipt, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentUserRole, setCurrentUserRole] = useState(null)

  useEffect(() => {
    fetchCurrentUser()
    fetchExpenses()
  }, [])

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const userData = await response.json()
        setCurrentUserRole(userData.role?.toUpperCase())
      }
    } catch (error) {
      console.error('Error fetching user:', error)
    }
  }

  const fetchExpenses = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/expenses')
      if (!response.ok) throw new Error('Failed to fetch expenses')
      const data = await response.json()
      setExpenses(data)
    } catch (error) {
      console.error('Error fetching expenses:', error)
      toast.error('Failed to load expenses')
    } finally {
      setLoading(false)
    }
  }

  const filteredExpenses = expenses.filter(expense =>
    expense.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    expense.project?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    expense.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    expense.user?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    expense.user?.lastName?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleApprove = async (expenseId) => {
    try {
      const response = await fetch(`/api/expenses/${expenseId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to approve expense')
      }
      
      toast.success('Expense approved successfully')
      fetchExpenses()
    } catch (error) {
      console.error('Error approving expense:', error)
      toast.error(error.message || 'Failed to approve expense')
    }
  }

  const handleReject = async (expenseId) => {
    if (!confirm('Are you sure you want to reject this expense?')) return

    try {
      const response = await fetch(`/api/expenses/${expenseId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to reject expense')
      }
      
      toast.success('Expense rejected')
      fetchExpenses()
    } catch (error) {
      console.error('Error rejecting expense:', error)
      toast.error(error.message || 'Failed to reject expense')
    }
  }

  // Determine if current user can approve this expense
  const canApproveExpense = (expense) => {
    if (!currentUserRole) return false
    
    const submitterRole = expense.user?.role?.name?.toUpperCase()
    
    if (currentUserRole === 'ADMIN') {
      return true // Admin can approve all
    } else if (currentUserRole === 'PROJECT_MANAGER') {
      return submitterRole === 'TEAM_MEMBER' // PM can only approve Team Member expenses
    } else if (currentUserRole === 'SALES_FINANCE') {
      return submitterRole !== 'TEAM_MEMBER' // Sales/Finance can approve PM and Admin expenses
    }
    
    return false
  }

  const getStatusColor = (status) => {
    const colors = {
      submitted: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      reimbursed: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    }
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
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
          <h1 className="text-3xl font-bold mb-2">Expenses</h1>
          <p className="text-muted-foreground">Submit and track project expenses</p>
        </div>
        <Button asChild>
          <Link href="/project_manager/dashboard/expenses/create">
            <Plus className="w-4 h-4 mr-2" />
            New Expense
          </Link>
        </Button>
      </div>

      <div className="bg-card border rounded-xl">
        <div className="p-4 border-b flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg bg-card/50 backdrop-blur-sm"
            />
          </div>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No expenses found</h3>
            <p className="text-muted-foreground mb-4">Start submitting expenses to see them here</p>
            <Button asChild>
              <Link href="/project_manager/dashboard/expenses/create">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Expense
              </Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="text-left p-4 font-medium text-sm">Project</th>
                  <th className="text-left p-4 font-medium text-sm">Category</th>
                  <th className="text-left p-4 font-medium text-sm">Description</th>
                  <th className="text-left p-4 font-medium text-sm">Submitted By</th>
                  <th className="text-left p-4 font-medium text-sm">Date</th>
                  <th className="text-left p-4 font-medium text-sm">Amount</th>
                  <th className="text-left p-4 font-medium text-sm">Status</th>
                  <th className="text-left p-4 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-muted/50">
                    <td className="p-4">{expense.project?.name || 'N/A'}</td>
                    <td className="p-4 capitalize">{expense.category}</td>
                    <td className="p-4">{expense.description}</td>
                    <td className="p-4">
                      {expense.user?.firstName} {expense.user?.lastName}
                    </td>
                    <td className="p-4">{new Date(expense.expenseDate).toLocaleDateString()}</td>
                    <td className="p-4 font-medium">${Number(expense.amount).toFixed(2)}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs capitalize ${getStatusColor(expense.status)}`}>
                        {expense.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {expense.status === 'submitted' && canApproveExpense(expense) ? (
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleApprove(expense.id)}
                            className="h-8"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleReject(expense.id)}
                            className="h-8"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      ) : expense.status === 'submitted' && !canApproveExpense(expense) ? (
                        <span className="text-xs text-muted-foreground">
                          {expense.user?.role?.name === 'project_manager' || expense.user?.role?.name === 'admin' 
                            ? 'Requires Sales/Finance approval' 
                            : 'No permission to approve'}
                        </span>
                      ) : null}
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

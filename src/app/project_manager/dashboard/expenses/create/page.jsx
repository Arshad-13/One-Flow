'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Upload, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'

const expenseSchema = z.object({
  projectId: z.string().min(1, 'Project is required'),
  description: z.string().min(3, 'Description must be at least 3 characters'),
  amount: z.string().min(1, 'Amount is required'),
  expenseDate: z.string().min(1, 'Date is required'),
  category: z.string().min(1, 'Category is required'),
  isBillable: z.boolean().default(false),
  notes: z.string().optional()
})

export default function CreateExpensePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [projects, setProjects] = useState([])

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      projectId: '',
      description: '',
      amount: '',
      expenseDate: new Date().toISOString().split('T')[0],
      category: 'travel',
      isBillable: false,
      notes: ''
    }
  })

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      if (!response.ok) throw new Error('Failed to fetch projects')
      const data = await response.json()
      setProjects(data)
    } catch (error) {
      console.error('Error fetching projects:', error)
      toast.error('Failed to load projects')
    }
  }

  const onSubmit = async (data) => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: parseInt(data.projectId),
          description: data.description,
          amount: parseFloat(data.amount),
          expenseDate: data.expenseDate,
          category: data.category,
          isBillable: data.isBillable,
          notes: data.notes || null
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create expense')
      }

      const expense = await response.json()
      toast.success('Expense submitted successfully!')
      router.push('/project_manager/dashboard/expenses')
    } catch (error) {
      console.error('Error creating expense:', error)
      toast.error(error.message || 'Failed to submit expense')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-8 flex items-center justify-center min-h-screen">
      <div className="w-full max-w-2xl">
      <div className="mb-8">
        <Button variant="ghost" size="sm" className="mb-4" asChild>
          <Link href="/project_manager/dashboard/expenses">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Expenses
          </Link>
        </Button>
        <h1 className="text-3xl font-bold mb-2">Submit Expense</h1>
        <p className="text-muted-foreground">Create a new expense record</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="">
        <div className="bg-card border rounded-xl p-6 space-y-6">
          <div>
            <label htmlFor="projectId" className="block text-sm font-medium mb-2">
              Project *
            </label>
            <select
              id="projectId"
              {...register('projectId')}
              className="w-full px-4 py-2 border rounded-lg bg-card/50 backdrop-blur-sm"
            >
              <option value="">Select a project</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
            {errors.projectId && (
              <p className="mt-1 text-sm text-red-600">{errors.projectId.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2">
              Description *
            </label>
            <textarea
              id="description"
              {...register('description')}
              rows={3}
              className="w-full px-4 py-2 border rounded-lg bg-card/50 backdrop-blur-sm"
              placeholder="What was this expense for?"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium mb-2">
                Amount *
              </label>
              <input
                type="number"
                id="amount"
                {...register('amount')}
                className="w-full px-4 py-2 border rounded-lg bg-card/50 backdrop-blur-sm"
                placeholder="0.00"
                step="0.01"
              />
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="expenseDate" className="block text-sm font-medium mb-2">
                Date *
              </label>
              <input
                type="date"
                id="expenseDate"
                {...register('expenseDate')}
                className="w-full px-4 py-2 border rounded-lg bg-card/50 backdrop-blur-sm"
              />
              {errors.expenseDate && (
                <p className="mt-1 text-sm text-red-600">{errors.expenseDate.message}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium mb-2">
              Category *
            </label>
            <select
              id="category"
              {...register('category')}
              className="w-full px-4 py-2 border rounded-lg bg-card/50 backdrop-blur-sm"
            >
              <option value="travel">Travel</option>
              <option value="software">Software</option>
              <option value="materials">Materials</option>
              <option value="meals">Meals</option>
              <option value="equipment">Equipment</option>
              <option value="other">Other</option>
            </select>
            {errors.category && (
              <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="isBillable" className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                id="isBillable"
                {...register('isBillable')}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">This expense is billable to client</span>
            </label>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium mb-2">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              {...register('notes')}
              rows={2}
              className="w-full px-4 py-2 border rounded-lg bg-card/50 backdrop-blur-sm"
              placeholder="Additional notes or context..."
            />
          </div>

          <div>
            <label htmlFor="receipt" className="block text-sm font-medium mb-2">
              Receipt (Coming Soon)
            </label>
            <div className="border-2 border-dashed rounded-lg p-8 text-center opacity-50 cursor-not-allowed">
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">File upload feature coming soon</p>
              <p className="text-xs text-muted-foreground">PNG, JPG, PDF up to 10MB</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Submit Expense
              </>
            )}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
            Cancel
          </Button>
        </div>
      </form>
      </div>
    </div>
  )
}

'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'

const projectSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters'),
  description: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  budget: z.string().optional(),
  status: z.enum(['planned', 'in_progress', 'on_hold', 'completed'])
})

export default function CreateProjectPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      description: '',
      startDate: '',
      dueDate: '',
      budget: '',
      status: 'planned'
    }
  })

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true)
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create project')
      }

      const project = await res.json()
      toast.success('Project created successfully!')
      router.push(`/project_manager/dashboard/projects/${project.id}`)
    } catch (error) {
      console.error('Error creating project:', error)
      toast.error(error.message || 'Failed to create project')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-8 flex items-center justify-center min-h-screen">
      <div className="w-full max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" size="sm" className="mb-4" asChild>
          <Link href="/project_manager/dashboard/projects">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Link>
        </Button>
        <h1 className="text-3xl font-bold mb-2">Create New Project</h1>
        <p className="text-muted-foreground">Set up a new project and start tracking its profitability</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="">
        <div className="bg-card border rounded-xl p-6 space-y-6">
          {/* Project Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Project Name *
            </label>
            <input
              type="text"
              id="name"
              {...register('name')}
              className="w-full px-4 py-2 border rounded-lg bg-card/50 backdrop-blur-sm"
              placeholder="Enter project name"
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              id="description"
              {...register('description')}
              rows={4}
              className="w-full px-4 py-2 border rounded-lg bg-card/50 backdrop-blur-sm"
              placeholder="Enter project description"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium mb-2">
                Start Date *
              </label>
              <input
                type="date"
                id="startDate"
                {...register('startDate')}
                className="w-full px-4 py-2 border rounded-lg bg-card/50 backdrop-blur-sm"
              />
              {errors.startDate && (
                <p className="text-sm text-red-600 mt-1">{errors.startDate.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium mb-2">
                Due Date *
              </label>
              <input
                type="date"
                id="dueDate"
                {...register('dueDate')}
                className="w-full px-4 py-2 border rounded-lg bg-card/50 backdrop-blur-sm"
              />
              {errors.dueDate && (
                <p className="text-sm text-red-600 mt-1">{errors.dueDate.message}</p>
              )}
            </div>
          </div>

          {/* Budget and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="budget" className="block text-sm font-medium mb-2">
                Budget ($)
              </label>
              <input
                type="number"
                id="budget"
                {...register('budget')}
                className="w-full px-4 py-2 border rounded-lg bg-card/50 backdrop-blur-sm"
                placeholder="0.00"
                step="0.01"
              />
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium mb-2">
                Status
              </label>
              <select
                id="status"
                {...register('status')}
                className="w-full px-4 py-2 border rounded-lg bg-card/50 backdrop-blur-sm"
              >
                <option value="planned">Planned</option>
                <option value="in_progress">In Progress</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Create Project
              </>
            )}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
            Cancel
          </Button>
        </div>
      </form>
      </div>
    </div>
  )
}

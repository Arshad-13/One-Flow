'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'

const timesheetSchema = z.object({
  projectId: z.string().min(1, 'Project is required'),
  taskId: z.string().min(1, 'Task is required'),
  hours: z.string().min(1, 'Hours is required'),
  workDate: z.string().min(1, 'Work date is required'),
  isBillable: z.boolean().default(true),
  description: z.string().optional()
})

export default function LogTimePage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    resolver: zodResolver(timesheetSchema),
    defaultValues: {
      projectId: '',
      taskId: '',
      hours: '',
      workDate: new Date().toISOString().split('T')[0],
      isBillable: true,
      description: ''
    }
  })

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', { credentials: 'include' })
      if (!response.ok) {
        toast.error('Please log in to continue')
        router.push('/login')
        return
      }
      setIsCheckingAuth(false)
      fetchProjects()
    } catch (error) {
      console.error('Auth check failed:', error)
      toast.error('Authentication failed')
      router.push('/login')
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects', { credentials: 'include' })
      if (!response.ok) throw new Error('Failed to fetch projects')
      const data = await response.json()
      setProjects(data)
    } catch (error) {
      console.error('Error fetching projects:', error)
      toast.error('Failed to load projects')
    }
  }

  const handleProjectChange = async (e) => {
    const projectId = e.target.value
    setSelectedProjectId(projectId)
    setValue('projectId', projectId)
    setValue('taskId', '') // Reset task selection
    setTasks([])

    if (!projectId) return

    try {
      setLoadingTasks(true)
      const response = await fetch(`/api/projects/${projectId}/tasks`, { credentials: 'include' })
      if (!response.ok) throw new Error('Failed to fetch tasks')
      const data = await response.json()
      setTasks(data)
    } catch (error) {
      console.error('Error fetching tasks:', error)
      toast.error('Failed to load tasks')
    } finally {
      setLoadingTasks(false)
    }
  }

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true)
      const response = await fetch('/api/timesheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          projectId: parseInt(data.projectId),
          taskId: parseInt(data.taskId),
          hours: parseFloat(data.hours),
          workDate: data.workDate,
          isBillable: data.isBillable,
          description: data.description || null
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to log time')
      }

      toast.success('Time logged successfully!')
      router.push('/project_manager/dashboard/timesheets')
    } catch (error) {
      console.error('Error logging time:', error)
      toast.error(error.message || 'Failed to log time')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isCheckingAuth) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 flex items-center justify-center min-h-screen">
      <div className="w-full max-w-2xl">
        <div className="mb-8">
          <Button variant="ghost" size="sm" className="mb-4" asChild>
            <Link href="/project_manager/dashboard/timesheets">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Timesheets
            </Link>
          </Button>
          <h1 className="text-3xl font-bold mb-2">Log Time</h1>
          <p className="text-muted-foreground">Record your work hours for a task</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="">
          <div className="bg-card border rounded-xl p-6 space-y-6">
            {/* Project Selection */}
            <div>
              <label htmlFor="projectId" className="block text-sm font-medium mb-2">
                Project *
              </label>
              <select
                id="projectId"
                {...register('projectId')}
                onChange={handleProjectChange}
                className="w-full px-4 py-2 border rounded-lg bg-background"
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

            {/* Task Selection */}
            <div>
              <label htmlFor="taskId" className="block text-sm font-medium mb-2">
                Task *
              </label>
              <select
                id="taskId"
                {...register('taskId')}
                disabled={!selectedProjectId || loadingTasks}
                className="w-full px-4 py-2 border rounded-lg bg-background disabled:opacity-50"
              >
                <option value="">
                  {loadingTasks ? 'Loading tasks...' : 'Select a task'}
                </option>
                {tasks.map(task => (
                  <option key={task.id} value={task.id}>{task.title}</option>
                ))}
              </select>
              {errors.taskId && (
                <p className="mt-1 text-sm text-red-600">{errors.taskId.message}</p>
              )}
            </div>

            {/* Date and Hours */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="workDate" className="block text-sm font-medium mb-2">
                  Work Date *
                </label>
                <input
                  type="date"
                  id="workDate"
                  {...register('workDate')}
                  className="w-full px-4 py-2 border rounded-lg bg-background"
                />
                {errors.workDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.workDate.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="hours" className="block text-sm font-medium mb-2">
                  Hours *
                </label>
                <input
                  type="number"
                  id="hours"
                  {...register('hours')}
                  className="w-full px-4 py-2 border rounded-lg bg-background"
                  placeholder="0.00"
                  step="0.25"
                  min="0"
                  max="24"
                />
                {errors.hours && (
                  <p className="mt-1 text-sm text-red-600">{errors.hours.message}</p>
                )}
              </div>
            </div>

            {/* Billable */}
            <div>
              <label htmlFor="isBillable" className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  id="isBillable"
                  {...register('isBillable')}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">This time is billable to client</span>
              </label>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-2">
                Description (Optional)
              </label>
              <textarea
                id="description"
                {...register('description')}
                rows={3}
                className="w-full px-4 py-2 border rounded-lg bg-background"
                placeholder="What did you work on? (optional)"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Logging...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Log Time
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

'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Plus, DollarSign, TrendingUp, Clock, Loader2, MoreVertical, Edit, Trash2, UserPlus, UserMinus } from 'lucide-react'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import LinksPanel from '@/components/project/ProjectLinksPanel'
import AddTaskModal from '@/components/AddTaskModal'
import { TaskModal } from '@/components/task-modal'
import { useProjectTour } from '@/hooks/useProjectTour'

export default function ProjectTaskBoard({ projectId, backLink }) {
  const [userRole, setUserRole] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [showAddTaskModal, setShowAddTaskModal] = useState(false)
  const [showEditTaskModal, setShowEditTaskModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [draggedTask, setDraggedTask] = useState(null)
  const [showMyTasksOnly, setShowMyTasksOnly] = useState(false)

  const [project, setProject] = useState({
    name: '',
    description: '',
    revenue: 0,
    costs: 0,
    profit: 0,
    progress: 0,
  })

  const [allTasks, setAllTasks] = useState({
    todo: [],
    inProgress: [],
    review: [],
    done: [],
  })

  const [tasks, setTasks] = useState({
    todo: [],
    inProgress: [],
    review: [],
    done: [],
  })

  const [isLoadingTasks, setIsLoadingTasks] = useState(true)

  // Initialize tour (only for admin users)
  useProjectTour(
    project.name || 'Your Project',
    !isLoadingUser && !isLoadingTasks && userRole === 'admin' && project.name
  )

  // Auto-detect backLink based on user role if not provided
  const getBackLink = () => {
    if (backLink) return backLink
    if (!userRole) return '/dashboard/projects'

    const roleLinks = {
      admin: '/admin/dashboard/projects',
      project_manager: '/project_manager/dashboard/projects',
      team_member: '/team_member/dashboard/projects',
      sales_finance: '/sales_finance/dashboard/projects',
    }

    return roleLinks[userRole] || '/dashboard/projects'
  }

  useEffect(() => {
    fetchUserRole()
    fetchProjectDetails()
    fetchTasks()
    fetchProjectMembers()
    fetchProjectFinancials()
  }, [projectId])

  const fetchProjectDetails = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`)
      if (response.ok) {
        const projectData = await response.json()
        setProject(prev => ({
          ...prev,
          name: projectData.name || '',
          description: projectData.description || '',
        }))
      }
    } catch (error) {
      console.error('Error fetching project details:', error)
    }
  }

  const fetchProjectFinancials = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/financials`)
      if (response.ok) {
        const financials = await response.json()
        console.log('Project Financials Response:', financials)
        setProject(prev => ({
          ...prev,
          revenue: financials.revenue?.total || 0,
          costs: financials.costs?.total || 0,
          profit: financials.profitability?.profit || 0,
          progress: financials.progress || 0,
        }))
      } else {
        console.error('Failed to fetch financials, status:', response.status)
      }
    } catch (error) {
      console.error('Error fetching project financials:', error)
    }
  }

  const fetchUserRole = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const userData = await response.json()
        setUserRole(userData.role)
        setCurrentUser(userData)
      }
    } catch (error) {
      console.error('Error fetching user role:', error)
    } finally {
      setIsLoadingUser(false)
    }
  }

  const fetchTasks = async () => {
    try {
      setIsLoadingTasks(true)
      const response = await fetch(`/api/projects/${projectId}/tasks`)
      if (response.ok) {
        const tasksData = await response.json()

        // Group tasks by status
        const groupedTasks = {
          todo: tasksData.filter(t => t.status === 'new'),
          inProgress: tasksData.filter(t => t.status === 'in_progress'),
          review: tasksData.filter(t => t.status === 'blocked'),
          done: tasksData.filter(t => t.status === 'done'),
        }

        setAllTasks(groupedTasks)
        filterTasks(groupedTasks, showMyTasksOnly)
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setIsLoadingTasks(false)
    }
  }

  const filterTasks = useCallback((tasksToFilter, myTasksOnly) => {
    if (!myTasksOnly || !currentUser) {
      setTasks(tasksToFilter)
      return
    }

    // Filter to show only tasks assigned to current user
    const filtered = {
      todo: tasksToFilter.todo?.filter(task =>
        task.assignees?.some(a => a.user.id === currentUser.id)
      ) || [],
      inProgress: tasksToFilter.inProgress?.filter(task =>
        task.assignees?.some(a => a.user.id === currentUser.id)
      ) || [],
      review: tasksToFilter.review?.filter(task =>
        task.assignees?.some(a => a.user.id === currentUser.id)
      ) || [],
      done: tasksToFilter.done?.filter(task =>
        task.assignees?.some(a => a.user.id === currentUser.id)
      ) || [],
    }
    setTasks(filtered)
  }, [currentUser])

  useEffect(() => {
    filterTasks(allTasks, showMyTasksOnly)
  }, [showMyTasksOnly, allTasks, filterTasks])

  const fetchProjectMembers = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/members`)
      if (response.ok) {
        const membersData = await response.json()
      }
    } catch (error) {
      console.error('Error fetching project members:', error)
    }
  }

  const handleTaskCreated = (newTask) => {
    fetchTasks()
  }

  const handleEditTask = (task) => {
    setSelectedTask(task)
    setShowEditTaskModal(true)
  }

  const handleUpdateTask = async (formData) => {
    if (!selectedTask) return

    try {
      const response = await fetch(`/api/tasks/${selectedTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        fetchTasks()
        setShowEditTaskModal(false)
        setSelectedTask(null)
      }
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task?')) return

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchTasks()
      }
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  const handleDragStart = (e, task) => {
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e, newStatus) => {
    e.preventDefault()

    if (!draggedTask || draggedTask.status === newStatus) {
      setDraggedTask(null)
      return
    }

    try {
      const response = await fetch(`/api/tasks/${draggedTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        fetchTasks()
      }
    } catch (error) {
      console.error('Error updating task status:', error)
    } finally {
      setDraggedTask(null)
    }
  }

  const handleDragEnd = () => {
    setDraggedTask(null)
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
      case 'urgent':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20'
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
      case 'low':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const handleSelfAssign = async (taskId) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/assign`, {
        method: 'POST',
      })

      if (response.ok) {
        toast.success('You have been assigned to this task')
        fetchTasks()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to assign task')
      }
    } catch (error) {
      console.error('Error assigning task:', error)
      toast.error('Failed to assign task')
    }
  }

  const handleSelfUnassign = async (taskId) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/assign`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('You have been unassigned from this task')
        fetchTasks()
      } else {
        toast.error('Failed to unassign task')
      }
    } catch (error) {
      console.error('Error unassigning task:', error)
      toast.error('Failed to unassign task')
    }
  }

  const isUserAssigned = (task) => {
    if (!currentUser || !task.assignees) return false
    return task.assignees.some(assignment => assignment.user.id === currentUser.id)
  }

  const TaskCard = ({ task }) => (
    <div
      key={task.id}
      draggable
      onDragStart={(e) => handleDragStart(e, task)}
      onDragEnd={handleDragEnd}
      className="bg-background border rounded-lg p-4 hover:shadow-md transition-shadow cursor-move"
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-sm">{task.title}</h4>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 hover:bg-muted rounded">
              <MoreVertical className="w-3 h-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEditTask(task)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDeleteTask(task.id)}
              variant="destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Assignees */}
      {task.assignees && task.assignees.length > 0 ? (
        <div className="mb-2">
          <p className="text-xs text-muted-foreground mb-1">Assigned to:</p>
          <div className="flex flex-wrap gap-1">
            {task.assignees.map((assignment) => (
              <span
                key={assignment.user.id}
                className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded"
              >
                {assignment.user.firstName} {assignment.user.lastName}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground mb-2">Unassigned</p>
      )}

      <div className="flex items-center justify-between">
        <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </span>

        {/* Self-assign button for team members */}
        {currentUser && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (isUserAssigned(task)) {
                handleSelfUnassign(task.id)
              } else {
                handleSelfAssign(task.id)
              }
            }}
            className="text-xs p-1 hover:bg-muted rounded transition-colors"
            title={isUserAssigned(task) ? 'Unassign yourself' : 'Assign to yourself'}
          >
            {isUserAssigned(task) ? (
              <UserMinus className="w-3.5 h-3.5 text-red-500" />
            ) : (
              <UserPlus className="w-3.5 h-3.5 text-green-500" />
            )}
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" size="sm" className="mb-4" asChild data-tour="back-button">
          <Link href={getBackLink()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Link>
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
            <p className="text-sm text-muted-foreground max-w-2xl">{project.description}</p>
          </div>
          {/* Only show Add Task button for admin and project_manager roles */}
          {userRole && userRole !== 'sales_finance' && userRole !== 'team_member' && (
            <Button onClick={() => setShowAddTaskModal(true)} data-tour="add-task-button">
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          )}
        </div>
      </div>

      {/* Financial Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-card border rounded-lg p-4" data-tour="revenue-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Revenue</span>
            <DollarSign className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-blue-600">${(project.revenue || 0).toLocaleString()}</p>
        </div>
        <div className="bg-card border rounded-lg p-4" data-tour="costs-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Costs</span>
            <TrendingUp className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-600">${(project.costs || 0).toLocaleString()}</p>
        </div>
        <div className="bg-card border rounded-lg p-4" data-tour="profit-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Profit</span>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <p className={`text-2xl font-bold ${project.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${(project.profit || 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-card border rounded-lg p-4" data-tour="progress-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Progress</span>
            <Clock className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold">{project.progress || 0}%</p>
        </div>
      </div>

      {/* Links Panel with Billing Engine */}
      {isLoadingUser ? (
        <div className="mb-8 bg-card border rounded-xl p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </div>
      ) : (
        <div className="mb-8" data-tour="links-panel">
          <LinksPanel projectId={projectId} userRole={userRole} />
        </div>
      )}

      {/* Kanban Board */}
      <div className="bg-card border rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Task Board</h2>

          {/* Toggle My Tasks / All Tasks */}
          <div className="flex items-center gap-2" data-tour="task-filter">
            <button
              onClick={() => setShowMyTasksOnly(false)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${!showMyTasksOnly
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
            >
              All Tasks
            </button>
            <button
              onClick={() => setShowMyTasksOnly(true)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${showMyTasksOnly
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
            >
              My Tasks
            </button>
          </div>
        </div>
        {isLoadingTasks ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* To Do Column */}
            <div
              className="space-y-3"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'new')}
              data-tour="todo-column"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-sm">To Do</h3>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">{tasks.todo.length}</span>
              </div>
              <div className="space-y-3 min-h-[200px]">
                {tasks.todo.map(task => <TaskCard key={task.id} task={task} />)}
              </div>
            </div>

            {/* In Progress Column */}
            <div
              className="space-y-3"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'in_progress')}
              data-tour="inprogress-column"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-sm">In Progress</h3>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">{tasks.inProgress.length}</span>
              </div>
              <div className="space-y-3 min-h-[200px]">
                {tasks.inProgress.map(task => <TaskCard key={task.id} task={task} />)}
              </div>
            </div>

            {/* Review Column */}
            <div
              className="space-y-3"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'blocked')}
              data-tour="review-column"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-sm">Review</h3>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">{tasks.review.length}</span>
              </div>
              <div className="space-y-3 min-h-[200px]">
                {tasks.review.map(task => <TaskCard key={task.id} task={task} />)}
              </div>
            </div>

            {/* Done Column */}
            <div
              className="space-y-3"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'done')}
              data-tour="done-column"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-sm">Done</h3>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">{tasks.done.length}</span>
              </div>
              <div className="space-y-3 min-h-[200px]">
                {tasks.done.map(task => <TaskCard key={task.id} task={task} />)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={showAddTaskModal}
        onClose={() => setShowAddTaskModal(false)}
        projectId={projectId}
        onTaskCreated={handleTaskCreated}
      />

      {/* Edit Task Modal */}
      <TaskModal
        isOpen={showEditTaskModal}
        onClose={() => {
          setShowEditTaskModal(false)
          setSelectedTask(null)
        }}
        onSubmit={handleUpdateTask}
        task={selectedTask}
        projectId={projectId}
      />
    </div>
  )
}

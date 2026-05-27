'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Search, Filter, MoreVertical, Loader2, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import EditProjectModal from '@/components/EditProjectModal'
import { toast } from 'sonner'

export default function ProjectsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/projects', { credentials: 'include' })
      if (!res.ok) {
        throw new Error('Failed to fetch projects')
      }
      const data = await res.json()
      
      // Fetch financial data for each project
      const projectsWithFinancials = await Promise.all(
        data.map(async (project) => {
          try {
            const financialsRes = await fetch(`/api/projects/${project.id}/financials`, { credentials: 'include' })
            if (financialsRes.ok) {
              const financials = await financialsRes.json()
              return {
                ...project,
                revenue: financials.revenue.total || 0,
                costs: financials.costs.total || 0,
                profit: financials.profitability.profit || 0,
                profitMargin: financials.profitability.profitMargin || 0,
                progress: financials.progress || 0
              }
            }
            return project
          } catch (err) {
            console.error(`Error fetching financials for project ${project.id}:`, err)
            return project
          }
        })
      )
      
      setProjects(projectsWithFinancials)
    } catch (error) {
      console.error('Error fetching projects:', error)
      toast.error('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  const filteredProjects = projects.filter(project =>
    project.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleEditProject = (e, project) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedProject(project)
    setShowEditModal(true)
  }

  const handleDeleteProject = async (e, projectId) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return
    }

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (res.ok) {
        toast.success('Project deleted successfully')
        fetchProjects()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to delete project')
      }
    } catch (error) {
      console.error('Error deleting project:', error)
      toast.error('Failed to delete project')
    }
  }

  const handleProjectUpdated = (updatedProject) => {
    fetchProjects()
    toast.success('Project updated successfully')
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'planned': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'on_hold': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Projects</h1>
          <p className="text-muted-foreground">Manage all your projects and track their profitability</p>
        </div>
        <Button asChild>
          <Link href="/project_manager/dashboard/projects/create">
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Link>
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search projects..."
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

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            {searchQuery ? 'No projects found matching your search' : 'No projects yet'}
          </p>
          {!searchQuery && (
            <Button asChild>
              <Link href="/project_manager/dashboard/projects/create">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Project
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
          <Link
            key={project.id}
            href={`/project_manager/dashboard/projects/${project.id}`}
            className="bg-card border rounded-xl p-6 hover:shadow-lg transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg mb-1">{project.name}</h3>
                <p className="text-sm text-muted-foreground">{project.client}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                  <button className="p-1 hover:bg-muted rounded">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => handleEditProject(e, project)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={(e) => handleDeleteProject(e, project.id)}
                    variant="destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{project.progress || 0}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${project.progress || 0}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Revenue</p>
                <p className="text-sm font-semibold text-green-600">${project.revenue?.toLocaleString() || 0}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Costs</p>
                <p className="text-sm font-semibold text-red-600">${project.costs?.toLocaleString() || 0}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Profit</p>
                <p className={`text-sm font-semibold ${project.profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  ${project.profit?.toLocaleString() || 0}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Tasks</p>
                <p className="text-sm font-semibold">{project._count?.tasks || 0}</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                {project.status?.replace('_', ' ')}
              </span>
              <span className="text-xs text-muted-foreground">
                {project.endDate ? `Due: ${new Date(project.endDate).toLocaleDateString()}` : 'No deadline'}
              </span>
            </div>
          </Link>
          ))}
        </div>
      )}

      {/* Edit Project Modal */}
      <EditProjectModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedProject(null)
        }}
        project={selectedProject}
        onProjectUpdated={handleProjectUpdated}
      />
    </div>
  )
}

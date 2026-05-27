'use client'
import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Search, Filter, MoreVertical, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [allProjects, setAllProjects] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const [showMyProjectsOnly, setShowMyProjectsOnly] = useState(false)

  const filterProjects = useCallback((projectsToFilter, myProjectsOnly) => {
    if (!myProjectsOnly || !currentUser) {
      setProjects(projectsToFilter)
      return
    }

    // Filter to show only projects where user is a member or assigned to tasks
    const filtered = projectsToFilter.filter(project => {
      // Check if user is a project member
      const isMember = project.members?.some(member => member.userId === currentUser.id)
      // Check if user is the project manager
      const isManager = project.projectManagerId === currentUser.id
      return isMember || isManager
    })
    setProjects(filtered)
  }, [currentUser])

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const userData = await response.json()
        setCurrentUser(userData)
      }
    } catch (error) {
      console.error('Error fetching user:', error)
    }
  }

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
      
      setAllProjects(projectsWithFinancials)
      filterProjects(projectsWithFinancials, showMyProjectsOnly)
    } catch (error) {
      console.error('Error fetching projects:', error)
      toast.error('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCurrentUser()
    fetchProjects()
  }, [])

  useEffect(() => {
    filterProjects(allProjects, showMyProjectsOnly)
  }, [showMyProjectsOnly, allProjects, filterProjects])

  const filteredProjects = projects.filter(project =>
    project.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
        
        {/* Toggle My Projects / All Projects */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMyProjectsOnly(false)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              !showMyProjectsOnly 
                ? 'bg-primary text-primary-foreground font-medium' 
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            All Projects
          </button>
          <button
            onClick={() => setShowMyProjectsOnly(true)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              showMyProjectsOnly 
                ? 'bg-primary text-primary-foreground font-medium' 
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            My Projects
          </button>
        </div>
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
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
          <Link
            key={project.id}
            href={`/team_member/dashboard/projects/${project.id}`}
            className="bg-card border rounded-xl p-6 hover:shadow-lg transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg mb-1">{project.name}</h3>
                <p className="text-sm text-muted-foreground">{project.client}</p>
              </div>
              <button className="p-1 hover:bg-muted rounded">
                <MoreVertical className="w-4 h-4" />
              </button>
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
    </div>
  )
}

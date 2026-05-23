'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, TrendingUp, DollarSign, Clock, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function SalesFinanceDashboard() {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const userRes = await fetch("/api/auth/me", { credentials: "include" });
        if (!userRes.ok) {
          window.location.href = "/login";
          return;
        }
        const userData = await userRes.json();
        setUser(userData);

        const projectsRes = await fetch("/api/projects", { credentials: "include" });
        if (projectsRes.ok) {
          const projectsData = await projectsRes.json();
          setProjects(projectsData.slice(0, 4));
          const activeProjects = projectsData.filter(p => p.status === 'in_progress').length;
          setStats({
            activeProjects,
            totalProjects: projectsData.length,
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Sales & Finance Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Welcome back, {user?.name}! Manage orders and finances.</p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/sales_finance/dashboard/projects">
            <Plus className="w-4 h-4 mr-2" />
            View Projects
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
        <div className="bg-card border rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <span className="text-xs sm:text-sm text-muted-foreground truncate pr-2">Active Projects</span>
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1">{stats?.activeProjects || 0}</div>
          <p className="text-xs sm:text-sm text-muted-foreground">In progress</p>
        </div>

        <div className="bg-card border rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <span className="text-xs sm:text-sm text-muted-foreground truncate pr-2">Total Projects</span>
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1">{stats?.totalProjects || 0}</div>
          <p className="text-xs sm:text-sm text-muted-foreground">All time</p>
        </div>

        <div className="bg-card border rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <span className="text-xs sm:text-sm text-muted-foreground truncate pr-2">Team Members</span>
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1">-</div>
          <p className="text-xs sm:text-sm text-muted-foreground">Coming soon</p>
        </div>

        <div className="bg-card border rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <span className="text-xs sm:text-sm text-muted-foreground truncate pr-2">Pending Tasks</span>
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1">-</div>
          <p className="text-xs sm:text-sm text-muted-foreground">Coming soon</p>
        </div>
      </div>

      <div className="bg-card border rounded-xl">
        <div className="p-4 sm:p-6 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h2 className="text-lg sm:text-xl font-semibold">Recent Projects</h2>
          <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
            <Link href="/sales_finance/dashboard/projects">View All Projects</Link>
          </Button>
        </div>
        {projects.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <p className="text-muted-foreground mb-4">No projects yet</p>
            <p className="text-sm text-muted-foreground">Financial documents (SO, PO, Invoices, Bills) are managed within each project&apos;s Links tab</p>
          </div>
        ) : (
          <div className="divide-y">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/sales_finance/dashboard/projects/${project.id}`}
                className="p-4 sm:p-6 hover:bg-muted/50 transition-colors flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold mb-1 truncate">{project.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{project.description || 'No description'}</p>
                </div>
                <div className="flex items-center gap-4 sm:gap-6 lg:gap-8 overflow-x-auto">
                  <div className="shrink-0">
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1">Status</p>
                    <span className="text-xs sm:text-sm font-medium capitalize whitespace-nowrap">{project.status?.replace('_', ' ')}</span>
                  </div>
                  <div className="shrink-0">
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1">Budget</p>
                    <span className="text-xs sm:text-sm font-semibold whitespace-nowrap">${project.budget?.toLocaleString() || 0}</span>
                  </div>
                  <div className="w-24 sm:w-32 shrink-0">
                    <p className="text-xs sm:text-sm text-muted-foreground mb-2">Progress</p>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${project.progress || 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

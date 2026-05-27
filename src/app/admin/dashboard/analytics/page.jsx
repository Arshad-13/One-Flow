'use client'
import React, { useState, useEffect } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  FolderKanban,
  Clock,
  Receipt,
  Loader2,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Repeat2,
  FileText as FileTextIcon
} from 'lucide-react'
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  AreaChart, 
  Area,
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

// MetricCard Component with improved design
const MetricCard = ({ title, value, unit = '', icon, description, valueClassName, trend, isLive }) => (
  <Card className="relative overflow-hidden">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <div className="flex items-center gap-2">
        {trend && (
          <div className={`flex items-center gap-1 text-xs ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            <span>{Math.abs(trend).toFixed(1)}%</span>
          </div>
        )}
        {icon}
      </div>
    </CardHeader>
    <CardContent>
      <div className={`text-2xl font-bold ${valueClassName || ''}`}>
        {unit}{typeof value === 'number' ? value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
      </div>
      {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      {isLive && (
        <div className="flex items-center gap-2 mt-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-xs text-muted-foreground">Live</span>
        </div>
      )}
    </CardContent>
  </Card>
)

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30days') // 7days, 30days, 90days, 1year
  const [realtimeData, setRealtimeData] = useState({
    latestInvoices: [],
    latestExpenses: [],
    recentActivity: []
  })
  const [analytics, setAnalytics] = useState({
    summary: {
      totalRevenue: 0,
      totalCosts: 0,
      totalProfit: 0,
      profitMargin: 0,
      activeProjects: 0,
      totalProjects: 0,
      tasksCompleted: 0,
      totalTasks: 0,
      totalHours: 0,
      billableHours: 0,
      nonBillableHours: 0,
      totalInvoices: 0,
      revenueChange: 0,
      profitChange: 0
    },
    revenueByMonth: [],
    projectStatus: [],
    expenseCategories: [],
    topProjects: [],
    revenueVsCosts: [],
    hoursByProject: [],
    projectProgress: [],
    resourceUtilization: [],
    projectCostVsRevenue: []
  })

  useEffect(() => {
    fetchAnalytics()
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(() => {
      fetchRealtimeData()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [timeRange])

  const fetchRealtimeData = async () => {
    try {
      const [invoicesRes, expensesRes] = await Promise.all([
        fetch('/api/customer-invoices'),
        fetch('/api/expenses')
      ])

      if (invoicesRes.ok && expensesRes.ok) {
        const invoices = await invoicesRes.json()
        const expenses = await expensesRes.json()

        // Get latest 10 invoices
        const latestInvoices = invoices
          .sort((a, b) => new Date(b.createdAt || b.invoiceDate) - new Date(a.createdAt || a.invoiceDate))
          .slice(0, 10)

        // Get latest 10 expenses
        const latestExpenses = expenses
          .sort((a, b) => new Date(b.createdAt || b.expenseDate) - new Date(a.createdAt || a.expenseDate))
          .slice(0, 10)

        setRealtimeData({
          latestInvoices,
          latestExpenses,
          recentActivity: [...latestInvoices, ...latestExpenses]
            .sort((a, b) => {
              const dateA = new Date(a.createdAt || a.invoiceDate || a.expenseDate)
              const dateB = new Date(b.createdAt || b.invoiceDate || b.expenseDate)
              return dateB - dateA
            })
            .slice(0, 15)
        })
      }
    } catch (error) {
      console.error('Error fetching realtime data:', error)
    }
  }

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      
      // Fetch all necessary data including tasks
      const [projectsRes, invoicesRes, expensesRes, timesheetsRes, salesOrdersRes, purchaseOrdersRes] = await Promise.all([
        fetch('/api/projects', { credentials: 'include' }),
        fetch('/api/customer-invoices', { credentials: 'include' }),
        fetch('/api/expenses', { credentials: 'include' }),
        fetch('/api/timesheets', { credentials: 'include' }),
        fetch('/api/sales-orders', { credentials: 'include' }),
        fetch('/api/purchase-orders', { credentials: 'include' })
      ])

      if (!projectsRes.ok || !invoicesRes.ok || !expensesRes.ok || !timesheetsRes.ok) {
        throw new Error('Failed to fetch analytics data')
      }

      const projects = await projectsRes.json()
      const invoices = await invoicesRes.json()
      const expenses = await expensesRes.json()
      const timesheets = await timesheetsRes.json()
      const salesOrders = salesOrdersRes.ok ? await salesOrdersRes.json() : []
      const purchaseOrders = purchaseOrdersRes.ok ? await purchaseOrdersRes.json() : []
      
      // Fetch tasks from all projects and store with project reference
      let allTasks = []
      const projectTasksMap = {}
      for (const project of projects) {
        try {
          const tasksRes = await fetch(`/api/projects/${project.id}/tasks`, { credentials: 'include' })
          if (tasksRes.ok) {
            const projectTasks = await tasksRes.json()
            allTasks = [...allTasks, ...projectTasks]
            projectTasksMap[project.id] = projectTasks
          }
        } catch (error) {
          console.error(`Error fetching tasks for project ${project.id}:`, error)
        }
      }

      // Fetch users for resource utilization
      const usersRes = await fetch('/api/users', { credentials: 'include' })
      const users = usersRes.ok ? await usersRes.json() : []

      // Calculate summary statistics
      // Revenue from Sales Orders (confirmed and done)
      const totalRevenue = salesOrders
        .filter(so => so.status === 'confirmed' || so.status === 'done')
        .reduce((sum, so) => sum + Number(so.totalAmount || 0), 0)
      
      // Costs from Expenses and Purchase Orders (sent and received)
      const expenseCosts = expenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0)
      const purchaseOrderCosts = purchaseOrders
        .filter(po => po.status === 'sent' || po.status === 'received')
        .reduce((sum, po) => sum + Number(po.totalAmount || 0), 0)
      const totalCosts = expenseCosts + purchaseOrderCosts
      
      const totalProfit = totalRevenue - totalCosts
      const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100) : 0
      const activeProjects = projects.filter(p => p.status === 'in_progress').length
      const totalProjects = projects.length
      const totalHours = timesheets.reduce((sum, ts) => sum + Number(ts.hours || 0), 0)
      const billableHours = timesheets.filter(ts => ts.billable).reduce((sum, ts) => sum + Number(ts.hours || 0), 0)
      const nonBillableHours = timesheets.filter(ts => !ts.billable).reduce((sum, ts) => sum + Number(ts.hours || 0), 0)
      const totalInvoices = invoices.length
      const tasksCompleted = allTasks.filter(task => task.status === 'done').length
      const totalTasks = allTasks.length

      // Get latest data for realtime section
      await fetchRealtimeData()

      // Calculate month-over-month changes
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()
      
      // Current month revenue from Sales Orders
      const currentMonthRevenue = salesOrders
        .filter(so => {
          const soDate = new Date(so.orderDate)
          return (so.status === 'confirmed' || so.status === 'done') &&
                 soDate.getMonth() === currentMonth && 
                 soDate.getFullYear() === currentYear
        })
        .reduce((sum, so) => sum + Number(so.totalAmount || 0), 0)
      
      // Current month costs from Expenses and Purchase Orders
      const currentMonthExpenses = expenses
        .filter(exp => {
          const expDate = new Date(exp.expenseDate)
          return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear
        })
        .reduce((sum, exp) => sum + Number(exp.amount || 0), 0)
      
      const currentMonthPOs = purchaseOrders
        .filter(po => {
          const poDate = new Date(po.orderDate)
          return (po.status === 'sent' || po.status === 'received') &&
                 poDate.getMonth() === currentMonth && 
                 poDate.getFullYear() === currentYear
        })
        .reduce((sum, po) => sum + Number(po.totalAmount || 0), 0)
      
      const currentMonthCosts = currentMonthExpenses + currentMonthPOs
      const currentMonthProfit = currentMonthRevenue - currentMonthCosts
      
      // Previous month revenue and profit
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
      const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
      
      const prevMonthRevenue = salesOrders
        .filter(so => {
          const soDate = new Date(so.orderDate)
          return (so.status === 'confirmed' || so.status === 'done') &&
                 soDate.getMonth() === prevMonth && 
                 soDate.getFullYear() === prevMonthYear
        })
        .reduce((sum, so) => sum + Number(so.totalAmount || 0), 0)
      
      const prevMonthExpenses = expenses
        .filter(exp => {
          const expDate = new Date(exp.expenseDate)
          return expDate.getMonth() === prevMonth && expDate.getFullYear() === prevMonthYear
        })
        .reduce((sum, exp) => sum + Number(exp.amount || 0), 0)
      
      const prevMonthPOs = purchaseOrders
        .filter(po => {
          const poDate = new Date(po.orderDate)
          return (po.status === 'sent' || po.status === 'received') &&
                 poDate.getMonth() === prevMonth && 
                 poDate.getFullYear() === prevMonthYear
        })
        .reduce((sum, po) => sum + Number(po.totalAmount || 0), 0)
      
      const prevMonthCosts = prevMonthExpenses + prevMonthPOs
      const prevMonthProfit = prevMonthRevenue - prevMonthCosts
      
      // Calculate percentage changes
      const revenueChange = prevMonthRevenue > 0 
        ? ((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 
        : 0
      
      const profitChange = prevMonthProfit !== 0 
        ? ((currentMonthProfit - prevMonthProfit) / Math.abs(prevMonthProfit)) * 100 
        : 0

      // Revenue by month (last 6 months)
      const revenueByMonth = generateMonthlyRevenue(salesOrders)

      // Project status distribution
      const projectStatus = [
        { name: 'In Progress', value: projects.filter(p => p.status === 'in_progress').length },
        { name: 'Planned', value: projects.filter(p => p.status === 'planned').length },
        { name: 'Completed', value: projects.filter(p => p.status === 'completed').length },
        { name: 'On Hold', value: projects.filter(p => p.status === 'on_hold').length }
      ].filter(item => item.value > 0)

      // Expense categories
      const expenseCategoryMap = {}
      expenses.forEach(exp => {
        const category = exp.category || 'Other'
        expenseCategoryMap[category] = (expenseCategoryMap[category] || 0) + Number(exp.amount || 0)
      })
      const expenseCategories = Object.entries(expenseCategoryMap).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value
      }))

      // Top 5 projects by revenue (from Sales Orders)
      const projectRevenueMap = {}
      salesOrders.forEach(so => {
        if ((so.status === 'confirmed' || so.status === 'done') && so.project?.name) {
          projectRevenueMap[so.project.name] = (projectRevenueMap[so.project.name] || 0) + Number(so.totalAmount || 0)
        }
      })
      const topProjects = Object.entries(projectRevenueMap)
        .map(([name, revenue]) => ({ name, revenue }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)

      // Revenue vs Costs comparison
      const revenueVsCosts = generateRevenueVsCosts(salesOrders, expenses, purchaseOrders)

      // Hours by project
      const projectHoursMap = {}
      timesheets.forEach(ts => {
        if (ts.project?.name) {
          projectHoursMap[ts.project.name] = (projectHoursMap[ts.project.name] || 0) + Number(ts.hours || 0)
        }
      })
      const hoursByProject = Object.entries(projectHoursMap)
        .map(([name, hours]) => ({ name, hours }))
        .sort((a, b) => b.hours - a.hours)
        .slice(0, 5)

      // Project Progress % (calculate completion based on tasks)
      const projectProgress = projects
        .map(project => {
          const tasks = projectTasksMap[project.id] || []
          const totalTasks = tasks.length
          const completedTasks = tasks.filter(t => t.status === 'done').length
          const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
          return {
            name: project.name,
            progress: Math.round(progress),
            completed: completedTasks,
            total: totalTasks
          }
        })
        .filter(p => p.total > 0)
        .sort((a, b) => b.progress - a.progress)
        .slice(0, 8)

      // Resource Utilization (team members' hours worked)
      const userHoursMap = {}
      timesheets.forEach(ts => {
        if (ts.user) {
          const userName = `${ts.user.firstName} ${ts.user.lastName}`
          userHoursMap[userName] = (userHoursMap[userName] || 0) + Number(ts.hours || 0)
        }
      })
      const resourceUtilization = Object.entries(userHoursMap)
        .map(([name, hours]) => ({
          name,
          hours: Math.round(hours * 10) / 10,
          utilization: Math.min(100, Math.round((hours / 160) * 100)) // Assuming 160 hours/month capacity
        }))
        .sort((a, b) => b.hours - a.hours)
        .slice(0, 10)

      // Project Cost vs Revenue (per project breakdown)
      const projectFinancials = {}
      
      // Aggregate revenue per project from Sales Orders
      salesOrders.forEach(so => {
        if ((so.status === 'confirmed' || so.status === 'done') && so.project) {
          const projectName = so.project.name
          if (!projectFinancials[projectName]) {
            projectFinancials[projectName] = { revenue: 0, costs: 0 }
          }
          projectFinancials[projectName].revenue += Number(so.totalAmount || 0)
        }
      })
      
      // Aggregate costs per project from expenses
      expenses.forEach(exp => {
        if (exp.project) {
          const projectName = exp.project.name
          if (!projectFinancials[projectName]) {
            projectFinancials[projectName] = { revenue: 0, costs: 0 }
          }
          projectFinancials[projectName].costs += Number(exp.amount || 0)
        }
      })
      
      // Add Purchase Order costs per project
      purchaseOrders.forEach(po => {
        if ((po.status === 'sent' || po.status === 'received') && po.project) {
          const projectName = po.project.name
          if (!projectFinancials[projectName]) {
            projectFinancials[projectName] = { revenue: 0, costs: 0 }
          }
          projectFinancials[projectName].costs += Number(po.totalAmount || 0)
        }
      })
      
      // Add timesheet costs per project
      timesheets.forEach(ts => {
        if (ts.project) {
          const projectName = ts.project.name
          if (!projectFinancials[projectName]) {
            projectFinancials[projectName] = { revenue: 0, costs: 0 }
          }
          projectFinancials[projectName].costs += Number(ts.hours || 0) * Number(ts.hourlyRate || 0)
        }
      })
      
      const projectCostVsRevenue = Object.entries(projectFinancials)
        .map(([name, data]) => ({
          name,
          revenue: Math.round(data.revenue),
          costs: Math.round(data.costs),
          profit: Math.round(data.revenue - data.costs)
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 8)

      console.log('Analytics Data:', {
        totalRevenue,
        totalCosts,
        totalProfit,
        profitMargin,
        salesOrdersCount: salesOrders.length,
        purchaseOrdersCount: purchaseOrders.length,
        expensesCount: expenses.length,
        revenueVsCostsLength: revenueVsCosts.length,
        revenueVsCosts: revenueVsCosts,
        revenueByMonthLength: revenueByMonth.length,
        revenueByMonth: revenueByMonth,
        topProjectsCount: topProjects.length,
        topProjects: topProjects
      })

      setAnalytics({
        summary: {
          totalRevenue,
          totalCosts,
          totalProfit,
          profitMargin,
          activeProjects,
          totalProjects,
          tasksCompleted,
          totalTasks,
          totalHours,
          billableHours,
          nonBillableHours,
          totalInvoices,
          revenueChange: parseFloat(revenueChange.toFixed(1)),
          profitChange: parseFloat(profitChange.toFixed(1))
        },
        revenueByMonth,
        projectStatus,
        expenseCategories,
        topProjects,
        revenueVsCosts,
        hoursByProject,
        projectProgress,
        resourceUtilization,
        projectCostVsRevenue
      })
    } catch (error) {
      console.error('Error fetching analytics:', error)
      toast.error('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  const generateMonthlyRevenue = (salesOrders) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const now = new Date()
    const monthlyData = []

    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthIndex = targetDate.getMonth()
      const yearIndex = targetDate.getFullYear()
      const monthName = months[monthIndex]
      
      const revenue = salesOrders
        .filter(so => {
          if (!so.orderDate) return false
          const soDate = new Date(so.orderDate)
          return (so.status === 'confirmed' || so.status === 'done') && 
                 soDate.getMonth() === monthIndex && 
                 soDate.getFullYear() === yearIndex
        })
        .reduce((sum, so) => sum + Number(so.totalAmount || 0), 0)
      
      monthlyData.push({ month: monthName, revenue: Math.round(revenue) })
    }

    console.log('Revenue By Month Data:', monthlyData)
    return monthlyData
  }

  const generateRevenueVsCosts = (salesOrders, expenses, purchaseOrders) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const now = new Date()
    const data = []

    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthIndex = targetDate.getMonth()
      const yearIndex = targetDate.getFullYear()
      const monthName = months[monthIndex]
      
      const revenue = salesOrders
        .filter(so => {
          if (!so.orderDate) return false
          const soDate = new Date(so.orderDate)
          return (so.status === 'confirmed' || so.status === 'done') && 
                 soDate.getMonth() === monthIndex && 
                 soDate.getFullYear() === yearIndex
        })
        .reduce((sum, so) => sum + Number(so.totalAmount || 0), 0)
      
      const expenseCosts = expenses
        .filter(exp => {
          if (!exp.expenseDate) return false
          const expDate = new Date(exp.expenseDate)
          return expDate.getMonth() === monthIndex && expDate.getFullYear() === yearIndex
        })
        .reduce((sum, exp) => sum + Number(exp.amount || 0), 0)
      
      const poCosts = purchaseOrders
        .filter(po => {
          if (!po.orderDate) return false
          const poDate = new Date(po.orderDate)
          return (po.status === 'sent' || po.status === 'received') && 
                 poDate.getMonth() === monthIndex && 
                 poDate.getFullYear() === yearIndex
        })
        .reduce((sum, po) => sum + Number(po.totalAmount || 0), 0)
      
      const costs = expenseCosts + poCosts
      
      data.push({ 
        month: monthName, 
        revenue: Math.round(revenue), 
        costs: Math.round(costs), 
        profit: Math.round(revenue - costs) 
      })
    }

    console.log('Revenue vs Costs Data:', data)
    return data
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-card/50 backdrop-blur-sm text-foreground p-4 md:p-8 flex flex-col gap-4 md:gap-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight lg:text-5xl text-primary drop-shadow-lg">
          Active Business Analytics
        </h1>
        <p className="text-md md:text-lg text-muted-foreground">
          Real-time insights into your business performance and financial health.
        </p>
      </div>

      {/* Time Range Selector */}
      <div className="flex gap-2 flex-wrap">
        <Button 
          variant={timeRange === '7days' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setTimeRange('7days')}
        >
          7 Days
        </Button>
        <Button 
          variant={timeRange === '30days' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setTimeRange('30days')}
        >
          30 Days
        </Button>
        <Button 
          variant={timeRange === '90days' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setTimeRange('90days')}
        >
          90 Days
        </Button>
        <Button 
          variant={timeRange === '1year' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setTimeRange('1year')}
        >
          1 Year
        </Button>
      </div>

      {/* Key Metrics - Live Dashboard Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Projects"
          value={analytics.summary.totalProjects || 0}
          icon={<FolderKanban className="h-4 w-4 text-muted-foreground" />}
          description={`${analytics.summary.activeProjects} currently active`}
          valueClassName="text-blue-600"
        />
        <MetricCard
          title="Tasks Completed"
          value={analytics.summary.tasksCompleted || 0}
          icon={<Activity className="h-4 w-4 text-muted-foreground" />}
          description={`${analytics.summary.totalTasks} total tasks`}
          valueClassName="text-green-600"
        />
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hours Logged</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.summary.totalHours.toFixed(1)}h</div>
            <div className="flex gap-4 mt-2 text-xs">
              <div>
                <span className="text-green-600 font-semibold">{analytics.summary.billableHours.toFixed(1)}h</span>
                <span className="text-muted-foreground ml-1">Billable</span>
              </div>
              <div>
                <span className="text-orange-600 font-semibold">{analytics.summary.nonBillableHours.toFixed(1)}h</span>
                <span className="text-muted-foreground ml-1">Non-billable</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <MetricCard
          title="Total Revenue"
          value={analytics.summary.totalRevenue || 0}
          unit="$"
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          description="Cumulative revenue generated"
          valueClassName="text-emerald-500"
          trend={analytics.summary.revenueChange}
        />
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Net Profit"
          value={analytics.summary.totalProfit || 0}
          unit="$"
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
          description={`${analytics.summary.profitMargin.toFixed(1)}% profit margin`}
          valueClassName="text-blue-400"
          trend={analytics.summary.profitChange}
        />
        <MetricCard
          title="Total Transactions"
          value={analytics.summary.totalInvoices || 0}
          icon={<Repeat2 className="h-4 w-4 text-muted-foreground" />}
          description="Number of invoices recorded"
        />
        <MetricCard
          title="Total Costs"
          value={analytics.summary.totalCosts || 0}
          unit="$"
          icon={<Receipt className="h-4 w-4 text-muted-foreground" />}
          description="All expenses and vendor bills"
          valueClassName="text-orange-600"
        />
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activity Status</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              Live
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Real-time data updates
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Section: Financial Trends */}
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">Financial Trends</h2>
        <p className="text-sm text-muted-foreground">Monitor revenue, costs, and profitability over time</p>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="bg-card border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            Revenue Trend (Last 6 Months)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analytics.revenueByMonth}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <RechartsTooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value) => formatCurrency(value)}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#3b82f6" 
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue vs Costs */}
        <div className="bg-card border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-500" />
            Revenue vs Costs (Last 6 Months)
          </h3>
          {analytics.revenueVsCosts && analytics.revenueVsCosts.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.revenueVsCosts}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <RechartsTooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value) => formatCurrency(value)}
                />
                <Legend />
                <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" radius={[4, 4, 0, 0]} />
                <Bar dataKey="costs" fill="#ef4444" name="Costs" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" fill="#10b981" name="Profit" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground space-y-3">
              <BarChart3 className="w-16 h-16 opacity-20" />
              <div className="text-center">
                <p className="font-medium">No Financial Data Available</p>
                <p className="text-xs mt-1">Add Sales Orders and Expenses to see the chart</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section: Project & Expense Breakdown */}
      <div className="space-y-2 mt-8">
        <h2 className="text-xl font-bold text-foreground">Operational Insights</h2>
        <p className="text-sm text-muted-foreground">Project status, expenses, and time tracking</p>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Status Distribution */}
        <div className="bg-card border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-indigo-500" />
            Project Status Distribution
          </h3>
          {analytics.projectStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={analytics.projectStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.projectStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-muted-foreground">
              No project data available
            </div>
          )}
        </div>

        {/* Expense Categories */}
        <div className="bg-card border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-red-500" />
            Expense Categories
          </h3>
          {analytics.expenseCategories.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={analytics.expenseCategories}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.expenseCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-muted-foreground">
              No expense data available
            </div>
          )}
        </div>

        {/* Hours by Project */}
        <div className="bg-card border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-green-500" />
            Hours Logged by Project
          </h3>
          {analytics.hoursByProject.length > 0 ? (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-3xl font-bold">{analytics.summary.totalHours.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">Total Hours</p>
              </div>
              <div className="space-y-3">
                {analytics.hoursByProject.map((project, index) => (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="truncate">{project.name}</span>
                      <span className="font-medium">{project.hours.toFixed(1)}h</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all"
                        style={{ 
                          width: `${(project.hours / analytics.summary.totalHours) * 100}%`,
                          backgroundColor: COLORS[index % COLORS.length]
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-muted-foreground">
              No timesheet data available
            </div>
          )}
        </div>
      </div>

      {/* Section: Top Performers */}
      <div className="space-y-2 mt-8">
        <h2 className="text-xl font-bold text-foreground">Top Performers</h2>
        <p className="text-sm text-muted-foreground">Highest revenue generating projects</p>
      </div>

      {/* Top Projects */}
      <div className="bg-card border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-500" />
          Top 5 Projects by Revenue
        </h3>
        {analytics.topProjects.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.topProjects} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis type="number" stroke="#6b7280" />
              <YAxis dataKey="name" type="category" stroke="#6b7280" width={150} />
              <RechartsTooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value) => formatCurrency(value)}
              />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No project revenue data available
          </div>
        )}
      </div>

      {/* Section: Team Performance */}
      <div className="space-y-2 mt-8">
        <h2 className="text-xl font-bold text-foreground">Team Performance</h2>
        <p className="text-sm text-muted-foreground">Track project progress and resource allocation</p>
      </div>

      {/* New Charts Row 3 - Project Progress % */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Progress % */}
        <div className="bg-card border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-orange-500" />
            Project Completion Status
          </h3>
          {analytics.projectProgress.length > 0 ? (
            <ScrollArea className="h-[350px]">
              <div className="space-y-4 pr-4">
                {analytics.projectProgress.map((project, index) => (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium truncate flex-1">{project.name}</span>
                      <span className="font-bold ml-2">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                      <div 
                        className="h-3 rounded-full transition-all flex items-center justify-end pr-2"
                        style={{ 
                          width: `${project.progress}%`,
                          backgroundColor: project.progress === 100 ? '#10b981' : 
                                         project.progress >= 75 ? '#3b82f6' : 
                                         project.progress >= 50 ? '#f59e0b' : '#ef4444'
                        }}
                      >
                        {project.progress > 15 && (
                          <span className="text-[10px] text-ink font-semibold">
                            {project.completed}/{project.total}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {project.completed} of {project.total} tasks completed
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex items-center justify-center h-[350px] text-muted-foreground">
              No project progress data available
            </div>
          )}
        </div>

        {/* Resource Utilization */}
        <div className="bg-card border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-500" />
            Team Resource Utilization
          </h3>
          {analytics.resourceUtilization.length > 0 ? (
            <ScrollArea className="h-[350px]">
              <div className="space-y-4 pr-4">
                {analytics.resourceUtilization.map((resource, index) => (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium truncate flex-1">{resource.name}</span>
                      <div className="flex items-center gap-2 ml-2">
                        <span className="text-muted-foreground">{resource.hours}h</span>
                        <span className="font-bold">{resource.utilization}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                      <div 
                        className="h-3 rounded-full transition-all"
                        style={{ 
                          width: `${resource.utilization}%`,
                          backgroundColor: resource.utilization >= 90 ? '#ef4444' : 
                                         resource.utilization >= 70 ? '#10b981' : 
                                         resource.utilization >= 50 ? '#3b82f6' : '#f59e0b'
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {resource.utilization >= 90 ? 'Over-utilized' : 
                       resource.utilization >= 70 ? 'Well-utilized' : 
                       resource.utilization >= 50 ? 'Moderately utilized' : 'Under-utilized'}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex items-center justify-center h-[350px] text-muted-foreground">
              No resource utilization data available
            </div>
          )}
        </div>
      </div>

      {/* Section: Project Financials */}
      <div className="space-y-2 mt-8">
        <h2 className="text-xl font-bold text-foreground">Project Financials</h2>
        <p className="text-sm text-muted-foreground">Detailed revenue and cost analysis per project</p>
      </div>

      {/* Project Cost vs Revenue Chart */}
      <div className="bg-card border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-violet-500" />
          Project Financial Breakdown (Revenue vs Costs)
        </h3>
        {analytics.projectCostVsRevenue.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={analytics.projectCostVsRevenue} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis type="number" stroke="#6b7280" />
              <YAxis dataKey="name" type="category" stroke="#6b7280" width={150} />
              <RechartsTooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value) => formatCurrency(value)}
              />
              <Legend />
              <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" radius={[0, 4, 4, 0]} />
              <Bar dataKey="costs" fill="#ef4444" name="Costs" radius={[0, 4, 4, 0]} />
              <Bar dataKey="profit" fill="#10b981" name="Profit" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            No project financial data available
          </div>
        )}
      </div>

      {/* Real-time Activity Section - Live Dashboard Style */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Latest Invoices */}
        <Card className="col-span-1 max-h-[500px] overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-500" /> 
              Latest Invoices
            </CardTitle>
            <CardDescription>Recently created invoices, updated live.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[300px]">
              <div className="divide-y divide-border">
                {realtimeData.latestInvoices.length === 0 ? (
                  <p className="p-4 text-center text-muted-foreground">No invoices yet...</p>
                ) : (
                  realtimeData.latestInvoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex flex-col flex-1">
                        <span className="font-medium text-lg text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(Number(invoice.totalAmount || 0))}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {invoice.invoiceNumber} • {invoice.customer?.name || 'N/A'}
                        </span>
                        <span className="text-xs text-muted-foreground mt-1">
                          {invoice.project?.name || 'No project'}
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <Badge variant={
                          invoice.status === 'paid' ? 'default' :
                          invoice.status === 'sent' ? 'secondary' : 'outline'
                        }>
                          {invoice.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground mt-1">
                          {new Date(invoice.invoiceDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="pt-4 text-sm text-muted-foreground">
            <p>Displaying the 10 most recent invoices.</p>
          </CardFooter>
        </Card>

        {/* Latest Expenses */}
        <Card className="col-span-1 max-h-[500px] overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-orange-500" /> 
              Latest Expenses
            </CardTitle>
            <CardDescription>Recent expense submissions, updated live.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[300px]">
              <div className="divide-y divide-border">
                {realtimeData.latestExpenses.length === 0 ? (
                  <p className="p-4 text-center text-muted-foreground">No expenses yet...</p>
                ) : (
                  realtimeData.latestExpenses.map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex flex-col flex-1">
                        <span className="font-medium text-lg text-orange-600 dark:text-orange-400">
                          {formatCurrency(Number(expense.amount || 0))}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {expense.category} • {expense.user?.firstName} {expense.user?.lastName}
                        </span>
                        <span className="text-xs text-muted-foreground mt-1 truncate">
                          {expense.description}
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <Badge variant={
                          expense.status === 'approved' ? 'default' :
                          expense.status === 'reimbursed' ? 'secondary' : 'outline'
                        }>
                          {expense.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground mt-1">
                          {new Date(expense.expenseDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="pt-4 text-sm text-muted-foreground">
            <p>Displaying the 10 most recent expenses.</p>
          </CardFooter>
        </Card>
      </div>

      <Separator className="my-4" />

    </div>
  )
}

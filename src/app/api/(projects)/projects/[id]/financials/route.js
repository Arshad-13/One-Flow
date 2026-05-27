import { getUserFromRequest } from "@/lib/roleGuard";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET project financials (revenue, costs, profit)
export async function GET(req, { params }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const projectId = Number.parseInt(id, 10);

    if (Number.isNaN(projectId)) {
      if (id.startsWith("demo-")) {
        return NextResponse.json({
          projectName: id === "demo-1" ? "Phoenix Infrastructure Revamp" : "Project Prometheus Design",
          progress: id === "demo-1" ? 65 : 15,
          revenue: { total: 0, salesOrders: { amount: 0, count: 0 }, invoices: { amount: 0, count: 0 } },
          costs: {
            expenses: { amount: 0, count: 0 },
            purchaseOrders: { amount: 0, count: 0 },
            vendorBills: { amount: 0, count: 0 },
            total: 0,
          },
          profitability: { profit: 0, profitMargin: 0, status: "Break-even" },
          budget: { allocated: 0, used: 0, remaining: 0, utilization: 0 },
          unbilled: { timesheets: 0, expenses: 0 },
        });
      }
      return NextResponse.json({ error: "Invalid project id" }, { status: 400 });
    }

    // Validate project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { name: true, budget: true }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Calculate Revenue (from Sales Orders and Customer Invoices)
    const revenueData = await prisma.salesOrder.aggregate({
      where: { 
        projectId,
        status: { in: ['confirmed', 'done'] } // Only count confirmed and completed sales orders
      },
      _sum: { totalAmount: true },
      _count: true
    });

    const invoiceData = await prisma.customerInvoice.aggregate({
      where: { projectId },
      _sum: { totalAmount: true },
      _count: true
    });

    const salesOrderRevenue = Number(revenueData._sum.totalAmount || 0);
    const invoiceRevenue = Number(invoiceData._sum.totalAmount || 0);
    const totalRevenue = salesOrderRevenue + invoiceRevenue;
    const salesOrderCount = revenueData._count;
    const invoiceCount = invoiceData._count;

    // Calculate Costs (from Expenses, Purchase Orders, and Vendor Bills)
    const expenseData = await prisma.expense.aggregate({
      where: { projectId },
      _sum: { amount: true },
      _count: true
    });

    const purchaseOrderData = await prisma.purchaseOrder.aggregate({
      where: { 
        projectId,
        status: { in: ['sent', 'received'] } // Only count sent and received purchase orders
      },
      _sum: { totalAmount: true },
      _count: true
    });

    const vendorBillData = await prisma.vendorBill.aggregate({
      where: { projectId },
      _sum: { totalAmount: true },
      _count: true
    });

    const expenseCosts = Number(expenseData._sum.amount || 0);
    const poCosts = Number(purchaseOrderData._sum.totalAmount || 0);
    const vendorBillCosts = Number(vendorBillData._sum.totalAmount || 0);
    const totalCosts = expenseCosts + poCosts + vendorBillCosts;
    const expenseCount = expenseData._count;
    const poCount = purchaseOrderData._count;
    const vendorBillCount = vendorBillData._count;

    console.log(`[Financials API] Project ${projectId}:`, {
      totalRevenue,
      salesOrderRevenue,
      invoiceRevenue,
      expenseCosts,
      poCosts,
      vendorBillCosts,
      totalCosts,
      expenseCount,
      poCount,
      vendorBillCount
    });

    // Profit Calculation
    const profit = Number(totalRevenue) - Number(totalCosts);
    const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

    // Budget Analysis
    const budgetUsed = totalCosts;
    const budgetRemaining = project.budget ? Number(project.budget) - budgetUsed : null;
    const budgetUtilization = project.budget && Number(project.budget) > 0 
      ? (budgetUsed / Number(project.budget)) * 100 
      : null;

    // Unbilled Items
    const unbilledTimesheets = await prisma.timesheet.count({
      where: {
        projectId,
        isBilled: false
      }
    });

    const unbilledExpenses = await prisma.expense.count({
      where: {
        projectId,
        isBilled: false
      }
    });

    // Calculate Progress based on task status stages
    // Task stages: new (0) → in_progress (1) → done (2)
    // Progress = sum of all stage values / (total tasks * max stages)
    const taskStats = await prisma.task.groupBy({
      by: ['status'],
      where: { projectId },
      _count: true
    });

    const stageWeights = {
      'new': 0,
      'in_progress': 1,
      'blocked': 1, // Same as in_progress
      'done': 2
    };

    const totalTasks = taskStats.reduce((sum, stat) => sum + stat._count, 0);
    const totalStagePoints = taskStats.reduce((sum, stat) => {
      const weight = stageWeights[stat.status] || 0;
      return sum + (weight * stat._count);
    }, 0);

    const maxPossiblePoints = totalTasks * 2; // 2 is the max stage (done)
    const progress = maxPossiblePoints > 0 ? Math.round((totalStagePoints / maxPossiblePoints) * 100) : 0;

    return NextResponse.json({
      projectName: project.name,
      progress,
      revenue: {
        total: totalRevenue,
        salesOrders: {
          amount: salesOrderRevenue,
          count: salesOrderCount
        },
        invoices: {
          amount: invoiceRevenue,
          count: invoiceCount
        }
      },
      costs: {
        expenses: {
          amount: expenseCosts,
          count: expenseCount
        },
        purchaseOrders: {
          amount: poCosts,
          count: poCount
        },
        vendorBills: {
          amount: vendorBillCosts,
          count: vendorBillCount
        },
        total: totalCosts
      },
      profitability: {
        profit,
        profitMargin: parseFloat(profitMargin.toFixed(2)),
        status: profit > 0 ? 'Profitable' : profit < 0 ? 'Loss' : 'Break-even'
      },
      budget: {
        allocated: project.budget,
        used: budgetUsed,
        remaining: budgetRemaining,
        utilization: budgetUtilization ? parseFloat(budgetUtilization.toFixed(2)) : null
      },
      unbilled: {
        timesheets: unbilledTimesheets,
        expenses: unbilledExpenses
      }
    });

  } catch (error) {
    console.error('Error fetching project financials:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

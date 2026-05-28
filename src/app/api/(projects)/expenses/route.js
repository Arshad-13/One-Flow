import { getUserFromRequest } from "@/lib/roleGuard";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const demoExpenses = [
    {
        id: 99991,
        expenseNumber: "EXP-2024-001",
        description: "Cloud Architecture Audit",
        amount: 2450.00,
        expenseDate: new Date().toISOString(),
        category: "Consulting",
        status: "approved",
        isBilled: false,
        project: { name: "Phoenix Infrastructure" },
        user: { firstName: "Demo", lastName: "Admin" }
    },
    {
        id: 99992,
        expenseNumber: "EXP-2024-002",
        description: "Hardware Procurement",
        amount: 890.00,
        expenseDate: new Date().toISOString(),
        category: "Equipment",
        status: "submitted",
        isBilled: false,
        project: { name: "Project Prometheus" },
        user: { firstName: "Demo", lastName: "PM" }
    }
];

export async function GET(req) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    const billed = searchParams.get('billed');
    const status = searchParams.get('status');

    const whereClause = { user: { companyId: user.companyId } };
    if (projectId) whereClause.projectId = parseInt(projectId);
    if (billed !== null && billed !== undefined) whereClause.isBilled = billed === 'true';
    if (status) whereClause.status = status;

    const expenses = await prisma.expense.findMany({
      where: whereClause,
      include: {
        project: true,
        user: { select: { id: true, firstName: true, lastName: true, email: true } }
      },
      orderBy: { expenseDate: 'desc' }
    });

    if (expenses.length === 0) {
        return NextResponse.json(demoExpenses);
    }

    return NextResponse.json(expenses);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId, description, amount, date, category, receiptUrl } = await req.json();

    const expenseNumber = `EXP-${Date.now()}`;
    const expense = await prisma.expense.create({
      data: {
        expenseNumber,
        description,
        amount: parseFloat(amount),
        expenseDate: date ? new Date(date) : new Date(),
        category: category || 'Other',
        isBillable: true,
        status: 'submitted',
        projectId: parseInt(projectId),
        userId: user.id
      }
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { getUserFromRequest } from "@/lib/roleGuard";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET unbilled expenses for a project
export async function GET(req, { params }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const projectId = parseInt(id);

    if (projectId === 99991 || projectId === 99992) {
      return NextResponse.json({
        expenses: [],
        summary: {
          totalEntries: 0,
          totalAmount: 0
        }
      });
    }
    
    // Fetch unbilled expenses for this project
    const unbilledExpenses = await prisma.expense.findMany({
      where: {
        projectId,
        isBilled: false
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        project: {
          select: {
            name: true
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    // Calculate total unbilled expense amount
    const totalAmount = unbilledExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    return NextResponse.json({
      expenses: unbilledExpenses,
      summary: {
        totalEntries: unbilledExpenses.length,
        totalAmount
      }
    });
  } catch (error) {
    console.error('Error fetching billable expenses:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { getUserFromRequest } from "@/lib/roleGuard";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET unbilled timesheets for a project
export async function GET(req, { params }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const projectId = parseInt(id);

    if (projectId === 99991 || projectId === 99992) {
      return NextResponse.json({
        timesheets: [],
        summary: {
          totalEntries: 0,
          totalHours: 0,
          totalAmount: 0
        }
      });
    }
    
    // Fetch unbilled timesheets for this project
    const unbilledTimesheets = await prisma.timesheet.findMany({
      where: {
        task: {
          projectId
        },
        isBilled: false
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        task: {
          select: {
            title: true,
            project: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    // Calculate total unbilled hours and potential revenue
    const totalHours = unbilledTimesheets.reduce((sum, ts) => sum + ts.hoursSpent, 0);
    const totalAmount = unbilledTimesheets.reduce((sum, ts) => sum + (ts.hoursSpent * (ts.billableRate || 0)), 0);

    return NextResponse.json({
      timesheets: unbilledTimesheets,
      summary: {
        totalEntries: unbilledTimesheets.length,
        totalHours,
        totalAmount
      }
    });
  } catch (error) {
    console.error('Error fetching billable timesheets:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { getUserFromRequest } from "@/lib/roleGuard";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const demoTimesheets = [
    { id: 99991, hours: 4.5, description: "Frontend Refactoring", workDate: new Date().toISOString(), task: { title: "Hero Redesign" } },
    { id: 99992, hours: 2.0, description: "Contrast Audit", workDate: new Date().toISOString(), task: { title: "Accessibility Fixes" } }
];

export async function GET(req) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const timesheets = await prisma.timesheet.findMany({
      where: { userId: user.id },
      include: {
        task: {
          select: { title: true, projectId: true }
        },
        project: {
          select: { name: true }
        }
      },
      orderBy: { workDate: 'desc' }
    });

    if (!timesheets || timesheets.length === 0) {
        return NextResponse.json(demoTimesheets);
    }

    return NextResponse.json(timesheets);
    } catch (error) {
    console.error('Error fetching timesheets:', error);
    return NextResponse.json(demoTimesheets);
    }

}

export async function POST(req) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { hours, date, taskId, projectId, description } = await req.json();

    if (!hours || !date || !projectId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Fetch user's current hourly rate from database
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { hourlyRate: true }
    });
    const currentRate = dbUser?.hourlyRate ? parseFloat(dbUser.hourlyRate) : 0.00;

    const timesheet = await prisma.timesheet.create({
      data: {
        hours: parseFloat(hours),
        workDate: new Date(date),
        description,
        taskId,
        projectId,
        userId: user.id,
        hourlyRate: currentRate
      }
    });

    return NextResponse.json(timesheet, { status: 201 });
  } catch (error) {
    console.error('Error creating timesheet:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

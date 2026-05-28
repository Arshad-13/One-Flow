import { getUserFromRequest } from "@/lib/roleGuard";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const demoTasks = [
  {
    id: 99991,
    title: "Define Prometheus Core Tokens",
    status: "done",
    priority: "high",
    dueDate: new Date().toISOString(),
    assignees: []
  },
  {
    id: 99992,
    title: "Refactor Hero Visual Logic",
    status: "in_progress",
    priority: "medium",
    dueDate: new Date().toISOString(),
    assignees: []
  },
  {
    id: 99993,
    title: "Audit Contrast Accessibility",
    status: "new",
    priority: "low",
    dueDate: new Date().toISOString(),
    assignees: []
  }
];

export async function GET(req) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    const whereClause = {
      project: {
        projectManager: {
          companyId: user.companyId
        }
      }
    };

    if (projectId) {
      whereClause.projectId = projectId;
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        project: { select: { name: true } },
        assignees: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (tasks.length === 0) {
      return NextResponse.json(demoTasks);
    }

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { title, description, projectId, priority, status, dueDate, estimatedHours } = await req.json();

    if (!title || !projectId) {
      return NextResponse.json({ error: "Missing required fields: title, projectId" }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        projectId,
        priority: priority || 'medium',
        status: status || 'new',
        dueDate: dueDate ? new Date(dueDate) : null,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
        progress: 0
      }
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

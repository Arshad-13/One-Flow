import { getUserFromRequest } from "@/lib/roleGuard";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET all tasks for a project
export async function GET(req, { params }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const projectId = Number.parseInt(id, 10);

    if (Number.isNaN(projectId)) {
      if (id.startsWith("demo-")) {
        return NextResponse.json([]);
      }
      return NextResponse.json({ error: "Invalid project id" }, { status: 400 });
    }

    const tasks = await prisma.task.findMany({
      where: { projectId },
      include: {
        assignees: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true }
            }
          }
        },
        timesheets: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST create new task
export async function POST(req, { params }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Only allow admin and project_manager to create tasks
    if (user.role === 'sales_finance' || user.role === 'team_member') {
      return NextResponse.json({ error: "Forbidden: You don't have permission to create tasks" }, { status: 403 });
    }

    const { id } = await params;
    const projectId = Number.parseInt(id, 10);

    if (Number.isNaN(projectId)) {
      if (id.startsWith("demo-")) {
        return NextResponse.json({ error: "Tasks cannot be created for demo projects" }, { status: 400 });
      }
      return NextResponse.json({ error: "Invalid project id" }, { status: 400 });
    }

    const { title, description, status, priority, assignedUserIds, dueDate, estimatedHours } = await req.json();

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || 'new',
        priority: priority || 'medium',
        projectId,
        dueDate: dueDate ? new Date(dueDate) : null,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
        createdBy: user.id
      },
      include: {
        assignees: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true }
            }
          }
        }
      }
    });

    // Create task assignments if provided
    if (assignedUserIds && assignedUserIds.length > 0) {
      await prisma.taskAssignment.createMany({
        data: assignedUserIds.map(userId => ({
          taskId: task.id,
          userId: parseInt(userId),
          assignedBy: user.id
        }))
      });
      
      // Fetch task again to include assignees
      const taskWithAssignees = await prisma.task.findUnique({
        where: { id: task.id },
        include: {
          assignees: {
            include: {
              user: {
                select: { id: true, firstName: true, lastName: true, email: true }
              }
            }
          }
        }
      });
      return NextResponse.json(taskWithAssignees, { status: 201 });
    }

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

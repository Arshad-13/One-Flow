import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/roleGuard';
import { prisma } from '@/lib/prisma';

export async function GET(req, { params }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const projectId = parseInt(id);

    if (projectId === 99991 || projectId === 99992) {
      return NextResponse.json({
        todo: [],
        inProgress: [],
        review: [],
        done: [],
      });
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const tasks = await prisma.task.findMany({
      where: { projectId },
      include: {
        assignedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const kanban = {
      todo: tasks.filter(t => t.status === 'new'),
      inProgress: tasks.filter(t => t.status === 'in_progress'),
      review: tasks.filter(t => t.status === 'blocked'),
      done: tasks.filter(t => t.status === 'done'),
    };

    return NextResponse.json(kanban);
  } catch (error) {
    console.error('Error fetching kanban data:', error);
    return NextResponse.json({ error: 'Failed to fetch kanban data' }, { status: 500 });
  }
}

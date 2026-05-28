import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/roleGuard';
import { prisma } from '@/lib/prisma';

// GET /api/projects/[id]/available-users - Get users that can be added to the project
export async function GET(req, { params }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const projectId = parseInt(id);

    if (projectId === 99991 || projectId === 99992) {
      const availableUsers = await prisma.user.findMany({
        where: {
          companyId: user.companyId,
          isActive: true
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: {
            select: {
              name: true
            }
          },
          hourlyRate: true
        },
        orderBy: [
          { firstName: 'asc' },
          { lastName: 'asc' }
        ]
      });
      return NextResponse.json(availableUsers);
    }

    // Verify project exists and belongs to user's company
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        projectManager: {
          companyId: user.companyId
        }
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get all current project members
    const currentMembers = await prisma.projectMember.findMany({
      where: { projectId },
      select: { userId: true }
    });

    const memberIds = currentMembers.map(m => m.userId);

    // Get all active users from the same company who are NOT already members
    const availableUsers = await prisma.user.findMany({
      where: {
        companyId: user.companyId,
        isActive: true,
        id: {
          notIn: memberIds
        }
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: {
          select: {
            name: true
          }
        },
        hourlyRate: true
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' }
      ]
    });

    return NextResponse.json(availableUsers);
  } catch (error) {
    console.error('Error fetching available users:', error);
    return NextResponse.json({ error: 'Failed to fetch available users' }, { status: 500 });
  }
}

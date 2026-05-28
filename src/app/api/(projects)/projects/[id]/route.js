import { getUserFromRequest } from "@/lib/roleGuard";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const demoProjectDetails = {
  99991: {
    id: 99991,
    name: "Phoenix Infrastructure Revamp",
    description: "Modernizing core cloud clusters and edge nodes.",
    status: "in_progress",
    budget: 45000,
    progress: 65,
    projectManager: { id: 1, firstName: "Demo", lastName: "Admin", email: "admin@oneflow.com" },
    customer: null,
    members: [],
    _count: { tasks: 0 },
  },
  99992: {
    id: 99992,
    name: "Project Prometheus Design",
    description: "New editorial design system for internal terminals.",
    status: "planned",
    budget: 12000,
    progress: 15,
    projectManager: { id: 1, firstName: "Demo", lastName: "Admin", email: "admin@oneflow.com" },
    customer: null,
    members: [],
    _count: { tasks: 0 },
  },
};

// GET single project
export async function GET(req, { params }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const projectId = Number.parseInt(id, 10);

    if (projectId === 99991 || projectId === 99992) {
      return NextResponse.json(demoProjectDetails[projectId]);
    }

    if (Number.isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid project id" }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        projectManager: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        customer: {
          select: { id: true, name: true }
        },
        members: {
          select: {
            userId: true,
            user: {
              select: { id: true, firstName: true, lastName: true }
            }
          }
        },
        _count: {
          select: { tasks: true }
        }
      }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

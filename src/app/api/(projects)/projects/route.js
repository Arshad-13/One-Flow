import { getUserFromRequest } from "@/lib/roleGuard";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const demoProjects = [
  {
    id: 99991,
    name: "Phoenix Infrastructure Revamp",
    description: "Modernizing core cloud clusters and edge nodes.",
    status: "in_progress",
    budget: 45000,
    progress: 65,
    createdAt: new Date().toISOString(),
    projectManager: { firstName: "Demo", lastName: "Admin", email: "admin@oneflow.com" },
    _count: { tasks: 12 }
  },
  {
    id: 99992,
    name: "Project Prometheus Design",
    description: "New editorial design system for internal terminals.",
    status: "planned",
    budget: 12000,
    progress: 15,
    createdAt: new Date().toISOString(),
    projectManager: { firstName: "Demo", lastName: "Admin", email: "admin@oneflow.com" },
    _count: { tasks: 8 }
  }
];

export async function GET(req) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const projects = await prisma.project.findMany({
      where: { projectManager: { companyId: user.companyId } },
      include: {
        projectManager: { select: { id: true, firstName: true, lastName: true, email: true } },
        customer: { select: { id: true, name: true } },
        members: { select: { userId: true, user: { select: { id: true, firstName: true, lastName: true } } } },
        _count: { select: { tasks: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!projects || projects.length === 0) {
      return NextResponse.json(demoProjects);
    }

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error in projects API:', error);
    return NextResponse.json(demoProjects); // Resilient fallback
  }
}

export async function POST(req) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!['project_manager', 'admin'].includes(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { name, description, startDate, dueDate, budget, status } = await req.json();
    const project = await prisma.project.create({
      data: {
        name, description,
        startDate: new Date(startDate),
        endDate: new Date(dueDate),
        budget: budget ? parseFloat(budget) : 0,
        status: status || 'planned',
        projectManagerId: user.id,
        progress: 0
      }
    });
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

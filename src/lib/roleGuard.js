import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { normalizeRole } from "@/lib/roles";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function getUserFromRequest(req) {
  try {
    const token = req.cookies.get("token")?.value; // ✅ works with App Router
    if (!token) return null;

    const { payload } = await jwtVerify(token, secret);
    
    // CRITICAL: Get user's companyId from database to ensure data isolation
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { 
        id: true, 
        email: true, 
        companyId: true,
        isActive: true,
        role: {
          select: { name: true }
        }
      }
    });

    if (!user || user.isActive === false) return null;

    const role = normalizeRole(user.role?.name);
    if (!role) return null;

    return {
      id: user.id,
      email: user.email,
      companyId: user.companyId,
      role
    };
  } catch (err) {
    console.error("JWT verification failed:", err);
    return null;
  }
}

export function requireRole(user, allowed = []) {
  if (!user) return false;
  if (allowed.length === 0) return true;
  return allowed.includes(user.role);
}

/**
 * CRITICAL SECURITY FUNCTION
 * Validates that a resource belongs to the user's company
 * Prevents cross-company data access
 */
export async function validateCompanyAccess(user, model, resourceId) {
  if (!user || !user.companyId) return false;

  try {
    const resolvers = {
      user: async () => {
        const resource = await prisma.user.findUnique({
          where: { id: resourceId },
          select: { companyId: true },
        });
        return resource?.companyId ?? null;
      },
      project: async () => {
        const resource = await prisma.project.findUnique({
          where: { id: resourceId },
          select: {
            projectManagerId: true,
            projectManager: { select: { companyId: true } },
          },
        });
        return resource?.projectManager?.companyId ?? null;
      },
      task: async () => {
        const resource = await prisma.task.findUnique({
          where: { id: resourceId },
          select: {
            project: {
              select: {
                projectManager: { select: { companyId: true } },
              },
            },
          },
        });
        return resource?.project?.projectManager?.companyId ?? null;
      },
      timesheet: async () => {
        const resource = await prisma.timesheet.findUnique({
          where: { id: resourceId },
          select: {
            project: {
              select: {
                projectManager: { select: { companyId: true } },
              },
            },
          },
        });
        return resource?.project?.projectManager?.companyId ?? null;
      },
      salesOrder: async () => {
        const resource = await prisma.salesOrder.findUnique({
          where: { id: resourceId },
          select: {
            project: {
              select: {
                projectManager: { select: { companyId: true } },
              },
            },
          },
        });
        return resource?.project?.projectManager?.companyId ?? null;
      },
      purchaseOrder: async () => {
        const resource = await prisma.purchaseOrder.findUnique({
          where: { id: resourceId },
          select: {
            project: {
              select: {
                projectManager: { select: { companyId: true } },
              },
            },
          },
        });
        return resource?.project?.projectManager?.companyId ?? null;
      },
      customerInvoice: async () => {
        const resource = await prisma.customerInvoice.findUnique({
          where: { id: resourceId },
          select: {
            project: {
              select: {
                projectManager: { select: { companyId: true } },
              },
            },
          },
        });
        return resource?.project?.projectManager?.companyId ?? null;
      },
      vendorBill: async () => {
        const resource = await prisma.vendorBill.findUnique({
          where: { id: resourceId },
          select: {
            project: {
              select: {
                projectManager: { select: { companyId: true } },
              },
            },
          },
        });
        return resource?.project?.projectManager?.companyId ?? null;
      },
      expense: async () => {
        const resource = await prisma.expense.findUnique({
          where: { id: resourceId },
          select: {
            project: {
              select: {
                projectManager: { select: { companyId: true } },
              },
            },
          },
        });
        return resource?.project?.projectManager?.companyId ?? null;
      },
      projectMember: async () => {
        const resource = await prisma.projectMember.findUnique({
          where: { id: resourceId },
          select: {
            project: {
              select: {
                projectManager: { select: { companyId: true } },
              },
            },
          },
        });
        return resource?.project?.projectManager?.companyId ?? null;
      },
      taskAssignment: async () => {
        const resource = await prisma.taskAssignment.findUnique({
          where: { id: resourceId },
          select: {
            task: {
              select: {
                project: {
                  select: {
                    projectManager: { select: { companyId: true } },
                  },
                },
              },
            },
          },
        });
        return resource?.task?.project?.projectManager?.companyId ?? null;
      },
      taskComment: async () => {
        const resource = await prisma.taskComment.findUnique({
          where: { id: resourceId },
          select: {
            task: {
              select: {
                project: {
                  select: {
                    projectManager: { select: { companyId: true } },
                  },
                },
              },
            },
          },
        });
        return resource?.task?.project?.projectManager?.companyId ?? null;
      },
      taskAttachment: async () => {
        const resource = await prisma.taskAttachment.findUnique({
          where: { id: resourceId },
          select: {
            task: {
              select: {
                project: {
                  select: {
                    projectManager: { select: { companyId: true } },
                  },
                },
              },
            },
          },
        });
        return resource?.task?.project?.projectManager?.companyId ?? null;
      },
    };

    const resolveCompanyId = resolvers[model];
    if (!resolveCompanyId) return false;

    const resourceCompanyId = await resolveCompanyId();
    return resourceCompanyId === user.companyId;
  } catch (error) {
    console.error('Company access validation error:', error);
    return false;
  }
}

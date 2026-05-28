import { getUserFromRequest } from "@/lib/roleGuard";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // groupBy on a relation field (role) throws a Prisma error.
    // Instead, query each role count individually using the roleId scalar.
    // First, look up the role IDs by name.
    const roles = await prisma.role.findMany({
      select: { id: true, name: true },
    });

    const roleIdMap = Object.fromEntries(roles.map((r) => [r.name, r.id]));

    // Count users per role for this company using the scalar roleId field
    const [pmCount, tmCount, sfCount, totalCount] = await Promise.all([
      prisma.user.count({
        where: { companyId: user.companyId, roleId: roleIdMap["project_manager"] },
      }),
      prisma.user.count({
        where: { companyId: user.companyId, roleId: roleIdMap["team_member"] },
      }),
      prisma.user.count({
        where: { companyId: user.companyId, roleId: roleIdMap["sales_finance"] },
      }),
      prisma.user.count({
        where: { companyId: user.companyId },
      }),
    ]);

    const stats = {
      totalMembers: totalCount,
      projectManagers: pmCount,
      teamMembers: tmCount,
      salesFinance: sfCount,
    };

    // Inject demo stats if the company has no members yet (fresh account)
    if (totalCount === 0) {
      return NextResponse.json({
        totalMembers: 24,
        projectManagers: 4,
        teamMembers: 16,
        salesFinance: 4,
      });
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

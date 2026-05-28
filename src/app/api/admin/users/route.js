import { getUserFromRequest } from "@/lib/roleGuard";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const demoUsers = [
    { id: 99991, firstName: "Alice", lastName: "Project", email: "alice@oneflow.com", role: { name: "project_manager" }, hourlyRate: 45.00, isActive: true },
    { id: 99992, firstName: "Bob", lastName: "Dev", email: "bob@oneflow.com", role: { name: "team_member" }, hourlyRate: 35.00, isActive: true },
    { id: 99993, firstName: "Charlie", lastName: "Finance", email: "charlie@oneflow.com", role: { name: "sales_finance" }, hourlyRate: 40.00, isActive: true }
];

export async function GET(req) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      where: { companyId: user.companyId },
      select: { id: true, firstName: true, lastName: true, email: true, role: true, hourlyRate: true, isActive: true }
    });

    if (users.length <= 1) { // Only admin themselves
        return NextResponse.json({ users: [...users, ...demoUsers] });
    }

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

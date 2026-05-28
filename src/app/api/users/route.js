import { getUserFromRequest } from "@/lib/roleGuard";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET all users in company
export async function GET(req) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Only admins can list all users — compare against normalized lowercase role
    if (user.role !== 'admin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      where: {
        companyId: user.companyId
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        hourlyRate: true,
        isActive: true,
        createdAt: true,
        role: {
          select: { id: true, name: true, description: true }
        }
      },
      orderBy: [
        { isActive: 'desc' },
        { firstName: 'asc' }
      ]
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { getUserFromRequest } from "@/lib/roleGuard";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// PUT - Bulk update hourly rates for multiple users
export async function PUT(req) {
  try {
    const userToken = await getUserFromRequest(req);
    if (!userToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Fetch user with role information
    const user = await prisma.user.findUnique({
      where: { id: userToken.id },
      include: { role: true },
    });

    // Check if user is admin
    if (!user || user.role.name !== 'admin') {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    const { userIds, hourlyRate } = await req.json();

    // Validate input
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: "userIds must be a non-empty array" }, { status: 400 });
    }

    if (hourlyRate === undefined || hourlyRate === null || isNaN(parseFloat(hourlyRate)) || parseFloat(hourlyRate) < 0) {
      return NextResponse.json({ error: "Invalid hourly rate" }, { status: 400 });
    }

    // Ensure all users belong to the same company
    const usersToUpdate = await prisma.user.findMany({
      where: {
        id: { in: userIds.map(id => parseInt(id)) },
        companyId: user.companyId
      },
      select: { id: true }
    });

    if (usersToUpdate.length !== userIds.length) {
      return NextResponse.json({ 
        error: "Some users not found or do not belong to your company" 
      }, { status: 400 });
    }

    // Update hourly rates
    const result = await prisma.user.updateMany({
      where: {
        id: { in: userIds.map(id => parseInt(id)) },
        companyId: user.companyId
      },
      data: {
        hourlyRate: parseFloat(hourlyRate)
      }
    });

    return NextResponse.json({
      success: true,
      updatedCount: result.count,
      message: `Successfully updated hourly rate for ${result.count} user(s)`
    });

  } catch (error) {
    console.error('Error updating hourly rates:', error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

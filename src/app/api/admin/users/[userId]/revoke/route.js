import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/roleGuard';
import { NextResponse } from 'next/server';

export async function POST(req, { params: paramsPromise }) {
  try {
    const params = await paramsPromise;
    const userToken = await getUserFromRequest(req);
    if (!userToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({
      where: { id: userToken.id },
      include: { role: true },
    });

    if (!admin || admin.role.name !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const userId = parseInt(params.userId);

    // Validate userId
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Verify the user being revoked is from the same company
    const userToRevoke = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userToRevoke || userToRevoke.companyId !== admin.companyId) {
      return NextResponse.json({ error: 'User not found or does not belong to your company' }, { status: 404 });
    }

    // Remove the user from active project membership and disable login access.
    await prisma.projectMember.deleteMany({
      where: { userId: userId },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    return NextResponse.json({ 
      success: true,
      message: 'User deactivated and removed from all projects'
    });
  } catch (error) {
    console.error('Error revoking user:', error);
    return NextResponse.json({ 
      error: 'Failed to revoke user' 
    }, { status: 500 });
  }
}

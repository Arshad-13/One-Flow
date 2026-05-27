import { getUserFromRequest } from "@/lib/roleGuard";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { normalizeRole } from "@/lib/roles";

export async function GET(req) {
  const userToken = await getUserFromRequest(req);
  if (!userToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userToken.id },
    include: { role: true, company: true }
  });

  if (!user || user.isActive === false) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const role = normalizeRole(user.role?.name);
  if (!role) return NextResponse.json({ error: "Invalid role" }, { status: 500 });

  const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || null;
  return NextResponse.json({ 
    id: user.id, 
    email: user.email, 
    role,
    name,
    firstName: user.firstName,
    lastName: user.lastName,
    hourlyRate: user.hourlyRate,
    company: user.company ? {
      name: user.company.name,
      companyId: user.company.companyId
    } : null
  });
}

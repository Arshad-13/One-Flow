import { getUserFromRequest } from "@/lib/roleGuard";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const demoPartners = [
    { id: 99991, name: "Acme Corp", type: "customer", email: "contact@acme.com" },
    { id: 99992, name: "Global Cloud Services", type: "vendor", email: "support@gcloud.com" }
];

export async function GET(req) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    const where = {};
    if (type) {
      if (type === "vendor" || type === "customer") {
        where.type = { in: [type, "both"] };
      } else {
        where.type = type;
      }
    }

    const partners = await prisma.partner.findMany({ where });

    if (partners.length === 0) {
        const filteredDemo = type 
          ? demoPartners.filter(p => p.type === type || p.type === "both") 
          : demoPartners;
        return NextResponse.json(filteredDemo);
    }

    return NextResponse.json(partners);
  } catch (error) {
    console.error('Error fetching partners:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

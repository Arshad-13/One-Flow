import { getUserFromRequest } from "@/lib/roleGuard";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const demoSalesOrders = [
    { id: 99991, orderNumber: "SO-2024-001", totalAmount: 45000, status: "confirmed", project: { name: "Phoenix Infrastructure" } },
    { id: 99992, orderNumber: "SO-2024-002", totalAmount: 12000, status: "draft", project: { name: "Project Prometheus" } }
];

export async function GET(req) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const orders = await prisma.salesOrder.findMany({
      where: { project: { projectManager: { companyId: user.companyId } } },
      include: { project: { select: { name: true } } }
    });

    if (orders.length === 0) {
        return NextResponse.json(demoSalesOrders);
    }

    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId, customerId, orderDate, status, notes, lines, totalAmount } = await req.json();

    if (!customerId || !lines || lines.length === 0) {
      return NextResponse.json({ error: "Customer ID and order lines are required" }, { status: 400 });
    }

    const timestamp = Date.now().toString().slice(-6);
    const randomNum = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    const orderNumber = `SO-${timestamp}-${randomNum}`;

    const newOrder = await prisma.salesOrder.create({
      data: {
        orderNumber,
        projectId: projectId ? parseInt(projectId) : null,
        customerId: parseInt(customerId),
        orderDate: orderDate ? new Date(orderDate) : new Date(),
        status: status || "draft",
        totalAmount: parseFloat(totalAmount || 0),
        notes: notes || null,
        createdBy: user.id,
        lines: {
          create: lines.map(line => ({
            productId: line.productId ? parseInt(line.productId) : null,
            description: line.description,
            quantity: parseFloat(line.quantity),
            unitPrice: parseFloat(line.unitPrice)
          }))
        }
      },
      include: {
        lines: true
      }
    });

    return NextResponse.json(newOrder);
  } catch (error) {
    console.error("Error creating sales order:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

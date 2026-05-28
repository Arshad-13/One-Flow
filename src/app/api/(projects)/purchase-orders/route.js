import { getUserFromRequest } from "@/lib/roleGuard";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const demoPurchaseOrders = [
    { id: 99991, orderNumber: "PO-2024-001", totalAmount: 8500, status: "confirmed", project: { name: "Phoenix Infrastructure" } },
    { id: 99992, orderNumber: "PO-2024-002", totalAmount: 3200, status: "draft", project: { name: "Project Prometheus" } }
];

export async function GET(req) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const orders = await prisma.purchaseOrder.findMany({
      where: { project: { projectManager: { companyId: user.companyId } } },
      include: { project: { select: { name: true } } }
    });

    if (orders.length === 0) {
        return NextResponse.json(demoPurchaseOrders);
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

    const { projectId, vendorId, orderDate, status, notes, lines, totalAmount } = await req.json();

    if (!vendorId || !lines || lines.length === 0) {
      return NextResponse.json({ error: "Vendor ID and order lines are required" }, { status: 400 });
    }

    const timestamp = Date.now().toString().slice(-6);
    const randomNum = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    const orderNumber = `PO-${timestamp}-${randomNum}`;

    const newOrder = await prisma.purchaseOrder.create({
      data: {
        orderNumber,
        projectId: projectId ? parseInt(projectId) : null,
        vendorId: parseInt(vendorId),
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
    console.error("Error creating purchase order:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

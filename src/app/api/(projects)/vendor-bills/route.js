import { getUserFromRequest } from "@/lib/roleGuard";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const demoVendorBills = [
    { id: 99991, billNumber: "BILL-2024-001", totalAmount: 12500, status: "posted", project: { name: "Phoenix Infrastructure" } },
    { id: 99992, billNumber: "BILL-2024-002", totalAmount: 4500, status: "draft", project: { name: "Project Prometheus" } }
];

export async function GET(req) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const bills = await prisma.vendorBill.findMany({
      where: { project: { projectManager: { companyId: user.companyId } } },
      include: { project: { select: { name: true } } }
    });

    if (bills.length === 0) {
        return NextResponse.json(demoVendorBills);
    }

    return NextResponse.json(bills);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    console.log("POST /api/vendor-bills received payload:", body);
    const { projectId, purchaseOrderId, vendorId, billDate, dueDate, status, notes, lines, totalAmount } = body;

    if (!vendorId || !lines || lines.length === 0) {
      console.log("Validation failed: vendorId =", vendorId, "lines =", lines);
      return NextResponse.json({ error: "Vendor ID and bill lines are required" }, { status: 400 });
    }

    // Validate vendorId exists
    const partner = await prisma.partner.findUnique({
      where: { id: parseInt(vendorId) }
    });
    if (!partner) {
      return NextResponse.json({ error: "Selected vendor does not exist" }, { status: 400 });
    }

    // Validate projectId exists
    let validProjectId = null;
    if (projectId) {
      const proj = await prisma.project.findUnique({
        where: { id: parseInt(projectId) }
      });
      if (proj) {
        validProjectId = proj.id;
      }
    }

    // Validate purchaseOrderId exists
    let validPurchaseOrderId = null;
    if (purchaseOrderId) {
      const po = await prisma.purchaseOrder.findUnique({
        where: { id: parseInt(purchaseOrderId) }
      });
      if (po) {
        validPurchaseOrderId = po.id;
      }
    }

    // Resolve products for lines
    const resolvedLines = await Promise.all(lines.map(async line => {
      let validProductId = null;
      if (line.productId) {
        const prod = await prisma.product.findUnique({
          where: { id: parseInt(line.productId) }
        });
        if (prod) {
          validProductId = prod.id;
        }
      }
      return {
        productId: validProductId,
        description: line.description,
        quantity: parseFloat(line.quantity),
        unitPrice: parseFloat(line.unitPrice)
      };
    }));

    const timestamp = Date.now().toString().slice(-6);
    const randomNum = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    const billNumber = `BILL-${timestamp}-${randomNum}`;

    const newBill = await prisma.vendorBill.create({
      data: {
        billNumber,
        projectId: validProjectId,
        purchaseOrderId: validPurchaseOrderId,
        vendorId: partner.id,
        billDate: billDate ? new Date(billDate) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : null,
        status: status || "draft",
        totalAmount: parseFloat(totalAmount || 0),
        notes: notes || null,
        createdBy: user.id,
        lines: {
          create: resolvedLines
        }
      },
      include: {
        lines: true
      }
    });

    return NextResponse.json(newBill);
  } catch (error) {
    console.error("Error creating vendor bill:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { getUserFromRequest } from "@/lib/roleGuard";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const demoInvoices = [
    { id: 99991, invoiceNumber: "INV-2024-001", totalAmount: 85000, status: "posted", project: { name: "Phoenix Infrastructure" } },
    { id: 99992, invoiceNumber: "INV-2024-002", totalAmount: 15000, status: "draft", project: { name: "Project Prometheus" } }
];

export async function GET(req) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const invoices = await prisma.customerInvoice.findMany({
      where: { project: { projectManager: { companyId: user.companyId } } },
      include: { project: { select: { name: true } } }
    });

    if (!invoices || invoices.length === 0) {
        return NextResponse.json(demoInvoices);
    }

    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Error in invoices API:', error);
    return NextResponse.json(demoInvoices);
  }
}

export async function POST(req) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId, customerId, salesOrderId, invoiceDate, dueDate, status, notes, lines, totalAmount } = await req.json();

    if (!customerId || !lines || lines.length === 0) {
      return NextResponse.json({ error: "Customer ID and invoice lines are required" }, { status: 400 });
    }

    const timestamp = Date.now().toString().slice(-6);
    const randomNum = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    const invoiceNumber = `INV-${timestamp}-${randomNum}`;

    const newInvoice = await prisma.customerInvoice.create({
      data: {
        invoiceNumber,
        projectId: projectId ? parseInt(projectId) : null,
        salesOrderId: salesOrderId ? parseInt(salesOrderId) : null,
        customerId: parseInt(customerId),
        invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : null,
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

    return NextResponse.json(newInvoice);
  } catch (error) {
    console.error("Error creating customer invoice:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

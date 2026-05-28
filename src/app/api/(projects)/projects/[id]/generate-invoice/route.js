import { getUserFromRequest } from "@/lib/roleGuard";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// POST generate invoice from unbilled timesheets/expenses
export async function POST(req, { params }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Check role - only PM, SALES_FINANCE, and ADMIN can generate invoices
    if (!['PROJECT_MANAGER', 'SALES_FINANCE', 'ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const projectId = parseInt(id);

    if (projectId === 99991 || projectId === 99992) {
      return NextResponse.json({ error: "Cannot generate invoices for demo projects" }, { status: 400 });
    }

    const { 
      customerName, 
      invoiceNumber, 
      timesheetIds = [], 
      expenseIds = [],
      additionalLines = [] // For manual line items
    } = await req.json();

    if (!customerName || !invoiceNumber) {
      return NextResponse.json({ error: "Missing required fields: customerName, invoiceNumber" }, { status: 400 });
    }

    // Validate project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // CRITICAL: Use Prisma transaction to prevent double-billing
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch unbilled timesheets
      const timesheets = await tx.timesheet.findMany({
        where: {
          id: { in: timesheetIds.map(id => parseInt(id)) },
          isBilled: false, // Double-check they're not already billed
          task: {
            projectId: parseInt(id)
          }
        },
        include: {
          user: true,
          task: true
        }
      });

      // 2. Fetch unbilled expenses
      const expenses = await tx.expense.findMany({
        where: {
          id: { in: expenseIds.map(id => parseInt(id)) },
          isBilled: false, // Double-check they're not already billed
          projectId: parseInt(id)
        },
        include: {
          user: true
        }
      });

      // 3. Calculate invoice lines from timesheets
      const timesheetLines = timesheets.map(ts => ({
        description: `Timesheet: ${ts.task.title} - ${ts.user.firstName} ${ts.user.lastName} (${ts.hours}h @ $${ts.hourlyRate || 0}/h)`,
        quantity: parseFloat(ts.hours),
        unitPrice: parseFloat(ts.hourlyRate || 0)
      }));

      // 4. Calculate invoice lines from expenses (only approved expenses should be here)
      const expenseLines = expenses.map(exp => ({
        description: `Expense: ${exp.description} - ${exp.user.firstName} ${exp.user.lastName}`,
        quantity: 1,
        unitPrice: parseFloat(exp.amount)
      }));

      // 5. Combine all invoice lines
      const allLines = [
        ...timesheetLines, 
        ...expenseLines,
        ...additionalLines.map(line => ({
          description: line.description,
          quantity: parseFloat(line.quantity),
          unitPrice: parseFloat(line.unitPrice)
        }))
      ];

      // 6. Calculate total
      const totalAmount = allLines.reduce((sum, line) => sum + (line.quantity * line.unitPrice), 0);

      // Find or create customer
      let customer = null
      if (customerName) {
        // Try to find existing customer by name
        customer = await tx.partner.findFirst({
          where: { 
            name: customerName,
            type: { in: ['customer', 'both'] }
          }
        })
        
        // Create customer if not found
        if (!customer) {
          customer = await tx.partner.create({
            data: {
              name: customerName,
              type: 'customer'
            }
          })
        }
      }

      // 7. Create the invoice with lines
      const invoice = await tx.customerInvoice.create({
        data: {
          invoiceNumber,
          customerId: customer.id,
          invoiceDate: new Date(),
          totalAmount,
          status: 'draft',
          projectId: parseInt(id),
          createdBy: user.id,
          lines: {
            create: allLines
          }
        },
        include: {
          lines: true,
          customer: true
        }
      });

      // 9. CRITICAL: Mark timesheets and expenses as billed (prevents double-billing)
      if (timesheetIds.length > 0) {
        await tx.timesheet.updateMany({
          where: { id: { in: timesheetIds.map(id => parseInt(id)) } },
          data: { isBilled: true }
        });
      }

      if (expenseIds.length > 0) {
        await tx.expense.updateMany({
          where: { id: { in: expenseIds.map(id => parseInt(id)) } },
          data: { isBilled: true }
        });
      }

      return invoice;
    });

    return NextResponse.json({
      message: "Invoice generated successfully",
      invoice: result,
      billedTimesheets: timesheetIds.length,
      billedExpenses: expenseIds.length
    }, { status: 201 });

  } catch (error) {
    console.error('Error generating invoice:', error);
    return NextResponse.json({ 
      error: "Failed to generate invoice", 
      details: error.message 
    }, { status: 500 });
  }
}

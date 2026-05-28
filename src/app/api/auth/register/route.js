import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { generateUniqueCompanyId } from "@/lib/companyId";
import { verifyOTP } from "@/lib/otp";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function POST(req) {

  try {
    const { name, email, password, companyName, otp } = await req.json();

    // Verify OTP first
    if (!otp) {
      return NextResponse.json(
        { error: "OTP is required for registration" },
        { status: 400 }
      );
    }

    const otpResult = verifyOTP(email, otp);
    if (!otpResult.valid) {
      return NextResponse.json(
        { error: otpResult.message },
        { status: 400 }
      );
    }

    // check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser)
      return NextResponse.json({ error: "User already exists" }, { status: 400 });

    // Assign "admin" role by default for new registrations
    const defaultRoleName = "admin";
    const role = await prisma.role.findUnique({
      where: { name: defaultRoleName },
    });

    if (!role)
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });

    // hash password -> store into passwordHash (schema field)
    const passwordHash = await bcrypt.hash(password, 10);

    // split name into first/last (best-effort)
    const [firstName, ...rest] = (name || "").trim().split(" ");
    const lastName = rest.join(" ") || null;

    // Generate unique company ID
    const uniqueCompanyId = await generateUniqueCompanyId(prisma);

    // Create company first with the provided name or default to user's name + "Company"
    const company = await prisma.company.create({
      data: {
        companyId: uniqueCompanyId,
        name: companyName || `${firstName || "User"}'s Company`,
      },
    });

    // create user with company and role relation
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: firstName || null,
        lastName,
        company: { connect: { id: company.id } },
        role: { connect: { id: role.id } },
      },
      include: { role: true, company: true },
    });

    // Generate JWT token
    const token = await new SignJWT({
      id: user.id,
      email: user.email,
      role: user.role.name,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1d")
      .sign(secret);

    const res = NextResponse.json(
      { 
        message: "User registered successfully", 
        token,
        user: { 
          id: user.id, 
          email: user.email, 
          role: user.role.name, 
          firstName: user.firstName, 
          lastName: user.lastName,
          companyId: user.company.companyId,
          companyName: user.company.name
        } 
      },
      { status: 201 }
    );

    // Set token as httpOnly cookie
    res.cookies.set("token", token, { httpOnly: true, sameSite: "lax", path: "/" });
    return res;
  } catch (error) {
    console.error(error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

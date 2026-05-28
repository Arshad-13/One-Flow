import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { normalizeRole } from "@/lib/roles";
const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function POST(req) {
  try {
    const { companyId, email, password } = await req.json();

    if (!companyId || !email || !password) {
      return NextResponse.json({ error: "Company ID, email, and password are required" }, { status: 400 });
    }

    console.log('Login attempt:', { companyId, email });

    // Find user with company relation
    const user = await prisma.user.findUnique({ 
      where: { email }, 
      include: { role: true, company: true }
    });

    if (!user) {
      console.log('User not found:', email);
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (user.isActive === false) {
      return NextResponse.json({ error: "Account is disabled" }, { status: 403 });
    }

    // Validate password
    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      console.log('Invalid password for user:', email);
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Verify company ID matches (compare string companyId from company table)
    if (user.company.companyId !== companyId) {
      console.log('Company ID mismatch:', { provided: companyId, actual: user.company.companyId });
      return NextResponse.json({ error: "Invalid company ID" }, { status: 401 });
    }

    console.log('Login successful for:', email);

    const normalizedRole = normalizeRole(user.role?.name);

    if (!normalizedRole) {
      return NextResponse.json({ error: "User role is not configured correctly" }, { status: 500 });
    }

    const token = await new SignJWT({
      id: user.id,
      email: user.email,
      role: normalizedRole,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(secret);

    const res = NextResponse.json({ message: "Login successful", token });
    
    // Set cookie with production-safe settings
    const isProduction = process.env.NODE_ENV === 'production';
    
    const cookieOptions = { 
      httpOnly: true, 
      secure: isProduction,
      sameSite: 'lax',
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    };
    
    res.cookies.set("token", token, cookieOptions);
    if (isProduction) {
      res.cookies.set("__Secure-token", token, cookieOptions);
    }
    
    console.log('[Login] Cookie set:', {
      isProduction,
      cookieOptions,
      userEmail: user.email,
      role: normalizedRole
    });
    
    return res;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not configured");
}

export const hashPassword = async (plain) => {
  const saltRounds = 10;
  return bcrypt.hash(plain, saltRounds);
};

export const comparePassword = async (plain, hash) => {
  return bcrypt.compare(plain, hash);
};

export const generateToken = (payload, opts = { expiresIn: "7d" }) => {
  return jwt.sign(payload, JWT_SECRET, opts);
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return null;
  }
};

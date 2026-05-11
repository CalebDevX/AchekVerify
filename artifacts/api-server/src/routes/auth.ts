import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken, requireAuth, type AuthRequest } from "../middlewares/auth";

const router = Router();

router.post("/auth/register", async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: "Email, password, and name are required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
  if (existing) {
    return res.status(400).json({ error: "Email already registered" });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await db.insert(usersTable).values({
    email: email.toLowerCase(),
    passwordHash,
    name,
    role: "user",
    suspended: false,
  }).returning();

  const token = signToken(user.id);
  return res.status(201).json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role, suspended: user.suspended, createdAt: user.createdAt },
    token,
  });
});

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  if (user.suspended) {
    return res.status(403).json({ error: "Account suspended" });
  }

  const token = signToken(user.id);
  return res.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role, suspended: user.suspended, createdAt: user.createdAt },
    token,
  });
});

router.post("/auth/logout", (_req, res) => {
  return res.json({ success: true, message: "Logged out" });
});

router.get("/auth/me", requireAuth, (req: AuthRequest, res) => {
  return res.json(req.user);
});

export default router;

import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.SESSION_SECRET || "whatatp-secret-key-change-in-production";

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    name: string;
    role: string;
    suspended: boolean;
    phoneNumber?: string | null;
    phoneVerified?: boolean;
  };
}

export function signToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "30d" });
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number };
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.userId)).limit(1);
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    if (user.suspended) {
      res.status(403).json({ error: "Account suspended" });
      return;
    }
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      suspended: user.suspended,
      phoneNumber: user.phoneNumber,
      phoneVerified: user.phoneVerified,
    };
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export async function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  await requireAuth(req, res, () => {
    if (req.user?.role !== "admin") {
      res.status(403).json({ error: "Admin access required" });
      return;
    }
    next();
  });
}

export async function requireApiKey(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const apiKey = req.headers["x-api-key"] as string || req.query.api_key as string;
  if (!apiKey) {
    await requireAuth(req, res, next);
    return;
  }

  const { apiKeysTable, db: _db, ...rest } = await import("@workspace/db").then(async m => {
    const { db, apiKeysTable } = m;
    return { db, apiKeysTable };
  });

  const bcrypt = (await import("bcryptjs")).default;
  // Find matching key by prefix
  const prefix = apiKey.substring(0, 8);
  const keys = await _db.select().from(apiKeysTable).where(
    (await import("drizzle-orm")).eq(apiKeysTable.keyPrefix, prefix)
  );

  for (const key of keys) {
    if (key.status === "revoked") continue;
    const valid = await bcrypt.compare(apiKey, key.keyHash);
    if (valid) {
      const [user] = await db.select().from(usersTable).where(
        (await import("drizzle-orm")).eq(usersTable.id, key.userId)
      ).limit(1);
      if (!user || user.suspended) continue;
      req.user = { id: user.id, email: user.email, name: user.name, role: user.role, suspended: user.suspended, phoneNumber: user.phoneNumber, phoneVerified: user.phoneVerified };

      // Update last used + count
      await _db.update(apiKeysTable).set({
        lastUsedAt: new Date(),
        requestCount: key.requestCount + 1,
      }).where((await import("drizzle-orm")).eq(apiKeysTable.id, key.id));

      next();
      return;
    }
  }

  res.status(401).json({ error: "Invalid API key" });
}

import { Router } from "express";
import { randomBytes, createHash } from "crypto";
import bcrypt from "bcryptjs";
import { db, apiKeysTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router = Router();

router.get("/api-keys", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const keys = await db.select().from(apiKeysTable).where(eq(apiKeysTable.userId, userId));
  return res.json(keys.map(k => ({
    id: k.id,
    name: k.name,
    keyPrefix: k.keyPrefix,
    status: k.status,
    lastUsedAt: k.lastUsedAt,
    createdAt: k.createdAt,
    requestCount: k.requestCount,
  })));
});

router.post("/api-keys", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Name is required" });
  }

  // Generate API key: watp_<random32chars>
  const rawKey = `watp_${randomBytes(24).toString("hex")}`;
  const prefix = rawKey.substring(0, 8); // "watp_XXX"
  const keyHash = await bcrypt.hash(rawKey, 10);

  const [key] = await db.insert(apiKeysTable).values({
    userId,
    name,
    keyHash,
    keyPrefix: prefix,
    status: "active",
  }).returning();

  return res.status(201).json({
    id: key.id,
    name: key.name,
    keyPrefix: key.keyPrefix,
    status: key.status,
    lastUsedAt: key.lastUsedAt,
    createdAt: key.createdAt,
    requestCount: key.requestCount,
    secret: rawKey,
  });
});

router.post("/api-keys/:id/revoke", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const id = parseInt(req.params.id as string);

  const [key] = await db.select().from(apiKeysTable)
    .where(and(eq(apiKeysTable.id, id), eq(apiKeysTable.userId, userId)))
    .limit(1);

  if (!key) {
    return res.status(404).json({ error: "API key not found" });
  }

  const [updated] = await db.update(apiKeysTable)
    .set({ status: "revoked" })
    .where(eq(apiKeysTable.id, id))
    .returning();

  return res.json({
    id: updated.id,
    name: updated.name,
    keyPrefix: updated.keyPrefix,
    status: updated.status,
    lastUsedAt: updated.lastUsedAt,
    createdAt: updated.createdAt,
    requestCount: updated.requestCount,
  });
});

export default router;

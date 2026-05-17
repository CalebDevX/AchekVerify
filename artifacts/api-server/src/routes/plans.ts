import { Router } from "express";
import { db, plansTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";

const router = Router();

router.get("/plans", async (_req, res) => {
  const plans = await db.select().from(plansTable).where(eq(plansTable.active, true));
  return res.json(plans.map(p => ({
    id: p.id,
    name: p.name,
    period: p.period,
    price: p.price,
    currency: p.currency,
    otpLimit: p.otpLimit,
    features: p.features,
    popular: p.popular,
    allowCustomNumber: p.allowCustomNumber,
    allowUsaNumbers: p.allowUsaNumbers,
  })));
});

router.get("/admin/plans", requireAdmin, async (_req, res) => {
  const plans = await db.select().from(plansTable).orderBy(plansTable.price);
  return res.json(plans);
});

router.patch("/admin/plans/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid plan id" });

  const [existing] = await db.select().from(plansTable).where(eq(plansTable.id, id)).limit(1);
  if (!existing) return res.status(404).json({ error: "Plan not found" });

  const { price, otpLimit, features, active, name, popular } = req.body;
  const updates: Partial<typeof plansTable.$inferInsert> = {};

  if (price !== undefined) updates.price = parseFloat(String(price));
  if (otpLimit !== undefined) updates.otpLimit = parseInt(String(otpLimit));
  if (features !== undefined) updates.features = Array.isArray(features) ? features : existing.features;
  if (active !== undefined) updates.active = Boolean(active);
  if (name !== undefined && String(name).trim()) updates.name = String(name).trim();
  if (popular !== undefined) updates.popular = Boolean(popular);

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: "No valid fields provided" });
  }

  const [updated] = await db.update(plansTable).set(updates).where(eq(plansTable.id, id)).returning();
  return res.json(updated);
});

export default router;

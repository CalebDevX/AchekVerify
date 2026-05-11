import { Router } from "express";
import { db, plansTable } from "@workspace/db";
import { eq } from "drizzle-orm";

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

export default router;

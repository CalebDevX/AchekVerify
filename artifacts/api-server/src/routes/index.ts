import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import plansRouter from "./plans";
import subscriptionsRouter from "./subscriptions";
import apiKeysRouter from "./apiKeys";
import whatsappNumbersRouter from "./whatsappNumbers";
import otpRouter from "./otp";
import adminUsersRouter from "./adminUsers";
import dashboardRouter from "./dashboard";
import paymentsRouter from "./payments";
import docsRouter from "./docs";
import botRouter from "./bot";

const router: IRouter = Router();

router.use(docsRouter);
router.use(healthRouter);
router.use(authRouter);
router.use(plansRouter);
router.use(subscriptionsRouter);
router.use(apiKeysRouter);
router.use(whatsappNumbersRouter);
router.use(otpRouter);
router.use(adminUsersRouter);
router.use(dashboardRouter);
router.use(paymentsRouter);
router.use(botRouter);

export default router;

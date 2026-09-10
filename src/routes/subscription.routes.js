import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { getSubscriptionFeed, getSubscriptions, subscribe, unsubscribe } from "../controllers/subscription.controllers.js";

const router = Router();
router.use(verifyJWT);
router.route("/").get(getSubscriptions);
router.route("/feed").get(getSubscriptionFeed);
router.route("/:channelId").post(subscribe).delete(unsubscribe);
export default router;
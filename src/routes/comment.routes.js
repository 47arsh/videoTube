import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { createComment, deleteComment, getComments, updateComment } from "../controllers/comment.controllers.js";

const router = Router();
router.route("/:videoId").get(getComments).post(verifyJWT, createComment);
router.route("/:commentId").patch(verifyJWT, updateComment).delete(verifyJWT, deleteComment);
export default router;
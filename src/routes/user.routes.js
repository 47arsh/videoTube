import { Router } from "express";
import { registerUser,logoutUser,loginUser,refreshAccessToken,changeCurrentPassword,getCurrentUser,getAdminProfile,updateAccountDetails,updateUserAvatar,updateUserCoverImage,getUserChannelProfile,getWatchHistory } from "../controllers/user.controllers.js";
import {upload} from "../middlewares/multer.middlewares.js"
import { requireRole, verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name : "avatar",
            maxCount : 1
        },
        {
            name : "coverImage",
            maxCount : 1
        }
    ]),
    registerUser);

//secured routes

router.route("/login").post(loginUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/logout").post(verifyJWT,logoutUser);
router.route("/current-user").get(verifyJWT,getCurrentUser);
router.route("/change-password").patch(verifyJWT,changeCurrentPassword);
router.route("/account").patch(verifyJWT,updateAccountDetails);
router.route("/avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar);
router.route("/cover-image").patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage);
router.route("/:username/channel").get(getUserChannelProfile);
router.route("/watch-history").get(verifyJWT,getWatchHistory);
router.route("/admin").get(verifyJWT,requireRole("admin"),getAdminProfile);

export default router;
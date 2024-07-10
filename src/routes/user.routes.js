import { Router } from "express";
import { logInUser, logOutUser, refreshAcessToken, registerUser, updateDetails, updatePassword } from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router=Router()
router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1,
        },
        {
            name:"coverImage",
            maxCount:1,
        },
    ]),
    registerUser)

router.route("/login").post(logInUser)
//secure routes
router.route("/logout").post(verifyJWT,logOutUser)
router.route("/refresh-token").post(refreshAcessToken)
router.route("/update-password").post(verifyJWT,updatePassword)
router.route("/update-details").post(verifyJWT,updateDetails)

export default router;
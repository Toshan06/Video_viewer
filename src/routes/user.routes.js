import e from "express";
import {upload} from "../middlewares/multer.middleware.js"
import { registerUser,loginUser, logoutUser, refreshAccessToken } from "../controllers/user.controller.js";
import verifyJWT from "../middlewares/auth.middleware.js";


const router = e.Router()
router.post('/register',upload.fields([
    {
        name: "avatar",
        maxCount: 1,
    },
    {
        name: "coverImg",
        maxCount: 1,
    }
]),registerUser);

router.route('/login').post(loginUser)


//Secured Routes
router.route('/logout').post(verifyJWT,logoutUser) //next() function in verifyJWT worked
router.route('/refreshToken').post(refreshAccessToken)

export default router

//http://localhost:8000/api/v1/users/register

import e from "express";
import {upload} from "../middlewares/multer.middleware.js"
import { registerUser } from "../controllers/user.controller.js";

const router = e.Router()
router.post('/register',upload.fields([
    {
        name: "avatar",
        maxCount: 1,
    },
    {
        name: "coverImg",
        maxCount: 1
    }
]),registerUser);
export default router

//http://localhost:8000/api/v1/users/register

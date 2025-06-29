import jwt from "jsonwebtoken"
import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.models.js"

//verifies whether user is present or not
const verifyJWT = asyncHandler(async(req,_,next) => {
    try {
        //cookies might not be present in re.cookies --> a mobile app, so headers are provided in that case
        //Authorization: Bearer <AccessToken>
        //get accessToken
        const accessToken = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
        if(!accessToken){
            throw new ApiError(401,"Unauthorized Request")
        }
    
        //accessToken is in a encrypted string, give secret key to decrypt it
        const decodedToken = jwt.verify(accessToken,process.env.ACCESS_TOKEN_SECRET)
        
        //user id collected
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken") //remember seleect query prints too!
        
        //user doesn't exist
        if(!user){
            throw new ApiError(401,"Invalid AccessToken")
        }
    
        req.user = user
        next()

    } catch (error) {
        throw new ApiError(401,error.message || "Invalid AccessToken")
    }
})

export default verifyJWT


import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"

const isValidPassword = (password) => {
    const hasLetter = /[a-zA-Z]/.test(password)
    const hasDigit = /\d/.test(password)
    const minLength = password.length >= 5
    return hasLetter && hasDigit && minLength
}

const registerUser = asyncHandler(async (req,res) => {
    //REGISTERING:
    //get user details from frontend
    //validation - not empty
    //chack if user already exists - email
    //check for images, check for avatar
    //uplaod img/avatar to cloudinary
    //create user object - create entry in db
    //remove password and refresh token field from response
    //check for user creation
    //return res

    const {fullname,email,username,password} = req.body

    if(
        [fullname,email,username,password].some((field)=>field?.trim() === "")
    ){
        throw new ApiError(400,"All fields are required.")
    }

    if(!email.includes("@")){
        throw new ApiError(400,"@ in email is required.")
    }

    if(!(username === username.toLowerCase())){
        throw new ApiError(400,"lowercase characters only")
    }

    if([username,email,password].some((field)=>field?.trim().includes(" "))){
        throw new ApiError(400,"Empty Spaces not allowed")
    }

    if(!isValidPassword(password)){
        throw new ApiError(400,"Password is wrong, it should have min 5 characters, atleast a digit, and atleast a letter.")
    }

    const existingUser = await User.findOne({
        $or: [{ username },{ email }]
    })
    if(existingUser){
        throw new ApiError(409,"User already exists, change username or email.")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path
    //const coverImgLocalPath = req.files?.coverImg[0]?.path

    let coverImgLocalPath;
    if(req.files && Array.isArray(req.files.coverImg) && req.files.coverImg.length > 0){
        coverImgLocalPath = req.files.coverImg[0].path
    }
    
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar is required.")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImg = await uploadOnCloudinary(coverImgLocalPath);
    

    if(!avatar){
        throw new ApiError(400,"Avatar is required")
    }


    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImg: coverImg.url,
        email,
        password,
        username,
    })

    const createdUser = await User.findById(user._id).select(           //remove password and refresh token field from response
        "-password -refreshToken" //write whatever are not required to be removed 
    )

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registration.")
    }

    return res.status(201).json(new ApiResponse(200,createdUser,"User Registration Complete."))

})

export {registerUser}

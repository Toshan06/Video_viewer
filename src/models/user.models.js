import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const userSchema = new mongoose.Schema({
    username:{
        type: String,
        index: true,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    email:{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    fullname:{
        type: String,
        required: true,
        trim: true,
        index: true,
    },
    avatar:{
        type: String, //Cloudinary service url
        required: true,
    },
    coverImage:{
        type: String, //Cloudinary service url
        required: false,
    },
    watchHistory: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Videos'
        }
    ],
    password:{
        type:String,
        required: [true,'Password is required.']
    },
    refreshToken:{
        type: String,
    },
},{timestamps: true})

userSchema.pre("save", async function(next){  //Pre middleware functions are executed before the specified operation (e.g., save, update, remove). You can use pre middleware to perform actions like validation, encryption, or logging before saving, updating, or removing documents from the database.
    
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)
    next() 
})
userSchema.methods.isPassCorrect = async function(password) {
    return await bcrypt.compare(password,this.password)    
}
userSchema.methods.generateAccessToken = function() {  //the spy green shield operation
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function() {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User",userSchema)
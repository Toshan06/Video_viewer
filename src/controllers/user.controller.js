import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { response } from "express";

/*
In REGISTER USER:
1.) We got the details from frontend via req.body.
2.) then we checked certain fields i.e. validation.
3.) then we checked whether there is an existing user or not (another form of validation)
4.) then we collect localFilePath of avatar and coverImg from req.files of the form-data
5.) then we upload the files on cloudinary via uploadOnCloudinary function.
6.) We, then create a new User with the given details.
7.) then we pass the response without having password and refreshTokens.
8.) Finally pass an ApiResponse().

In LOGIN USER:
1.) We got the details from frontend via req.body (here few details like username, email is only required)
2.) If username and email is not provided we throw error.
3.) We find the user either by username or email.
4.) If user is present, we check User's password by isPassCorrect from user.models.js
5.) Now password is correct, we generate access token and refresh token by that user._id
6.) We generate access and refresh token by jwt.sign in user.models.js file,
7.) Then in generateAccessAndRefreshTokens function, we update refreshToken in database and save
8.) Now user is logged in, so we create cookie of accessToken and refreshToken from the cookieParser package.
9.) Then we send an ApiResponse sending the tokens to the user.

In LOGOUT USER:
1.) We verify if the user is already logged in, if yes we collect ttheir user._id and remove the tokens and cookies from the database.
2.) In auth.middleware.js, we access the accessToken from the cookies or headers (as required).
3.) Decode the accessToken and get the payload by the help of jwt.verify.
4.) Collect user details.
5.) If user exists, we go req.user = user AND do next()
6.) next() induces logoutUser to call automatically (see "/logout" user.routs.js)
7.) In logoutUser, we use mongoose's findByIdAndUpdate, make refreshToken: undefined.
8.) then we remove the cookies  using clearCookie.
9.) Send ApiResponse of logout success. 
*/

const isValidPassword = (password) => {
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const minLength = password.length >= 5;
  return hasLetter && hasDigit && minLength;
};

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);

    //generate tokens by the id
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    //uploading refresh token to database
    user.refreshToken = refreshToken;
    //saving the update without any validation
    await user.save({
      validateBeforeSave: false,
    });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Internal Server error, Tokens not generated");
  }
};

const registerUser = asyncHandler(async (req, res) => {
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

  const { fullname, email, username, password } = req.body;

  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required.");
  }

  if (!email.includes("@")) {
    throw new ApiError(400, "@ in email is required.");
  }

  if (!(username === username.toLowerCase())) {
    throw new ApiError(400, "lowercase characters only");
  }

  if (
    [username, email, password].some((field) => field?.trim().includes(" "))
  ) {
    throw new ApiError(400, "Empty Spaces not allowed");
  }

  if (!isValidPassword(password)) {
    throw new ApiError(
      400,
      "Password is wrong, it should have min 5 characters, atleast a digit, and atleast a letter."
    );
  }

  const existingUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existingUser) {
    throw new ApiError(409, "User already exists, change username or email.");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  //const coverImgLocalPath = req.files?.coverImg[0]?.path

  let coverImgLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImg) &&
    req.files.coverImg.length > 0
  ) {
    coverImgLocalPath = req.files.coverImg[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required.");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImg = await uploadOnCloudinary(coverImgLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar is required");
  }

  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImg: coverImg.url,
    email,
    password,
    username,
  });

  const createdUser = await User.findById(user._id).select(
    //remove password and refresh token field from response
    "-password -refreshToken" //write whatever are not required to be removed
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registration.");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Registration Complete."));
});

const loginUser = asyncHandler(async (req, res) => {
  //from req.body, get data
  //username or email login
  //find user
  //if found, check password
  //access and refresh token generate
  //send tokens in cookies
  //response

  const { username, email, password } = req.body;

  if (!email && !username) {
    throw new ApiError(400, "Username and email is required");
  }

  //find user
  const user = await User.findOne({ $or: [{ username }, { email }] });

  //user not found
  if (!user) {
    throw new ApiError(404, "User does not exist!");
  }

  //userf found!
  //check password
  const isPassValid = await user.isPassCorrect(password);

  //password wrong
  if (!isPassValid) {
    throw new ApiError(401, "Password Invalid");
  }

  //password is now correct
  //generate access, refresh token
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  //update user in the database with the refreshToken
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  //send cookies
  const options = {
    httpOnly: true,
    secure: true, //so that server can not modify the cookies
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options) //key value pair with an additional options variable
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in succesfully!"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  //remove cookies and tokens
  //since it is done after the auth middleware, so we do the following:
  await User.findByIdAndUpdate(
    req.user._id, //we are able to use this since see line 29 req.user = user in auth.middleware.js
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  //refreshToken required, which is stored in cookies
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token");
    }

    //match the token with the token in database
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh Token expired/invalid");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed!"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalidd refresh token");
  }
});

const changeCurrentUserPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user?._id);
  const isPassRight = await user.isPassCorrect(oldPassword);
  if (!isPassRight) {
    throw new ApiError(400, "Invalid Password");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current USER fetched successfully!"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;
  if (!fullname || !email) {
    throw new ApiError(400, "All fields are required");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullname,
        email: email,
      },
    },
    { new: true }
  ).select("-password"); //to return the new updated info to user

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User details upadted"));
});

const updateAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file missing");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading avatar");
  }
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");

  return res.status(200).json(new ApiResponse(200, user, "Avatar Img updated"));
});

const updateCoverImg = asyncHandler(async (req, res) => {
  const coverImgLocalPath = req.file?.path;
  if (!coverImgLocalPath) {
    throw new ApiError(400, "Cover Image missing");
  }
  const coverImg = uploadOnCloudinary(coverImgLocalPath);
  if (!coverImg.url) {
    throw new ApiError(400, "error while uploading Cover Img");
  }
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        coverImg: coverImg.url,
      },
    },
    { new: true }
  ).select("-password");

  return res.status(200).json(new ApiResponse(200, user, "Cover Img updated"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentUserPassword,
  getCurrentUser,
  updateAccountDetails,
  updateAvatar,
  updateCoverImg,
};

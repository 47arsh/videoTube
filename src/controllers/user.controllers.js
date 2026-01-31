import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.models.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
//import {generateAccessToken , generateRefreshToken} from "../models/user.models.js"

const generateAccessAndRefreshToken = async (userId) => {

  try {
    const user = await User.findById(userId);
    if(!user){
      throw new ApiError(
        404,
        "user not found"
      )
    }
  
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
  
    user.refreshToken = refreshToken;
    await user.save({validateBeforeSave : false});
    return {accessToken,refreshToken};
  } catch (error) {
    throw new ApiError(
      500,
      "something went wrong while generating access and refresh token"
    )
  }

}


const registerUser = asyncHandler(async (req,res) => {
  const {fullname, username, email, password} = req.body;

  //validation
  if(
    [fullname,username,email,password].some((field) => field?.trim()==="")
  ){
    throw new ApiError(
      400,
      "all fields are required"
    )
  }

  const existedUser = await User.findOne({
    $or : [ {username}, {email} ]
  })

  if(existedUser){
    throw new ApiError(
      409,
      "username with email or password already exists"
    )
  }
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if(!avatarLocalPath) {
    throw new ApiError(
      400,
      "avatar file is missing"
    )
  }

  // const avatar = await uploadOnCloudinary(avatarLocalPath);
  // let coverImage = "";
  // if(coverImageLocalPath){
  //   coverImage = await uploadOnCloudinary(coverImageLocalPath);
  // }

  let avatar;
  try {
    avatar = await uploadOnCloudinary(avatarLocalPath);
    console.log("avatar uploaded!");
    
  } catch (error) {
    console.log("error uploading avatar :", error);
    throw new ApiError(
      500,
      "failed to upload avatar"
    )
  }

  let coverImage;
  try {
    coverImage = await uploadOnCloudinary(coverImageLocalPath);
    console.log("coverImage uploaded!");
    
  } catch (error) {
    console.log("error uploading coverImage :", error);
    throw new ApiError(
      500,
      "failed to upload coverImage"
    )
  }

  try {
    const user = await User.create({
      fullname,
      avatar : avatar.url,
      coverImage : coverImage?.url || "",
      email,
      password,
      username : username.toLowerCase() 
    })
  
    const createdUser = await User.findById(user._id).select("-password -refreshToken");
    if(!createdUser){
      throw new ApiError(
        404,
        "something went wrong while registering user"
      )
    }
  
    return res
            .status(201)
            .json(
              new ApiResponse(
                200,
                createdUser,
                "user registered successfully"
              )
            )
  } catch (error) {
    console.log("user creation failed");
    if(avatar){
      await deleteFromCloudinary(avatar.public_id)
    }
    if(coverImage){
      await deleteFromCloudinary(coverImage.public_id);
    }
    throw new ApiError(
      500,
      "something went wrong while registering user and images were deleted"
    )
  }
})

const loginUser = asyncHandler( async (req,res) => {
  const {email,username,password} = req.body;

  //validation
  if(!email){
    throw new ApiError(
      400,
      "email is required"
    )
  }

  const user = await User.findOne({
    $or : [{username} , {email}]
  })

  if(!user){
    throw new ApiError(
      404,
      "User not found"
    )
  }

  //validate password
  const isPasswordValid = await user.isPasswordCorrect(password);
  if(!isPasswordValid){
    throw new ApiError(
      401,
      "invalid user credentials -> password"
    )
  }

  const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id);

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

  if(!loggedInUser){
    throw new ApiError(
      404,
      "user not found in database"
    )
  }

  const options = {
    httpOnly : true,
    secure : process.env.NODE_ENV==="production"
  }

  return res
          .status(200)
          .cookie("accessToken",accessToken,options)
          .cookie("refreshToken",refreshToken,options)
          .json( new ApiResponse(
            200, 
            {user : loggedInUser, accessToken, refreshToken}, 
            "user logged in successfully"
            ) 
          )
})

const logoutUser = asyncHandler( async (req,res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set : { 
        refreshToken : undefined
      }
    },
    {new : true}
  )
  const options = {
    httpOnly : true,
    secure : process.env.NODE_ENV==="production"
  }
  return res
          .status(200)
          .clearCookie("accessToken",options)
          .clearCookie("refreshToken",options)
          .json(
            new ApiResponse(
              200,
              {},
              "User logged out successfully"
            )
          )
})

const refreshAccessToken = asyncHandler(async (req,res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if(!incomingRefreshToken){
    throw new ApiError(
      401,
      "refresh token is required"
    )
  }

  try {
    const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id);
    if(!user){
      throw new ApiError(
        401,
        "User not found due to invalid refresh token"
      )
    }
    //now that the user is found/ user exists , we need to compare the refresh token that we have
    // in our database with the refresh token that user sent us

    if(incomingRefreshToken !== user?.refreshToken){
      throw new ApiError(
        401,
        "invalid refresh token"
      )
    }

    const options = {
      httpOnly : true,
      secure : process.env.NODE_ENV==="production",
    }

    const {accessToken , refreshToken : newRefreshToken} = await generateAccessAndRefreshToken(user._id);

    return res
            .status(200)
            .cookie("accessToken",accessToken,options)
            .cookie("refreshToken",newRefreshToken,options)
            .json(
              new ApiResponse(
                200,
                {accessToken, refreshToken : newRefreshToken},
                "Access token successfully refreshed"
              )
            )

  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while refreshing access token"
    )
  }

})

export{
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
}
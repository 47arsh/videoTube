import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.models.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";


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

export{
  registerUser,

}
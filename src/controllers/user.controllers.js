import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.models.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = async (req, res) => {
  const { fullname, email, username, password } = req.body;

  // 🔎 Debug once
  console.log("BODY:", req.body);
  console.log("FILES:", req.files);

  if (!fullname) {
    throw new Error("fullname is required");
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path;

  if (!avatarLocalPath) {
    throw new Error("avatar file is required");
  }

  const avatarUpload = await uploadOnCloudinary(
  avatarLocalPath.replace(/\\/g, "/")
);


  if (!avatarUpload?.url) {
    throw new Error("avatar upload failed");
  }

  const user = await User.create({
    fullname,                // ✅ REQUIRED
    email,
    username,
    password,
    avatar: avatarUpload.url // ✅ REQUIRED
  });

  return res.status(201).json({
    success: true,
    user
  });
};


export {
    registerUser,

}
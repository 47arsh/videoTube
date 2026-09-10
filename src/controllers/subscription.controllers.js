import mongoose from "mongoose";
import { Subscription } from "../models/subscription.models.js";
import { User } from "../models/user.models.js";
import { Video } from "../models/video.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const subscribe = asyncHandler(async (req, res) => {
  const channelId = req.params.channelId;
  if (!mongoose.isValidObjectId(channelId) || channelId === req.user._id.toString()) throw new ApiError(400, "invalid channel");
  if (!await User.exists({ _id: channelId })) throw new ApiError(404, "channel not found");
  const subscription = await Subscription.findOneAndUpdate(
    { subscriber: req.user._id, channel: channelId },
    { subscriber: req.user._id, channel: channelId },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  return res.status(200).json(new ApiResponse(200, subscription, "channel subscribed successfully"));
});

export const unsubscribe = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.channelId)) throw new ApiError(400, "invalid channel id");
  await Subscription.findOneAndDelete({ subscriber: req.user._id, channel: req.params.channelId });
  return res.status(200).json(new ApiResponse(200, {}, "channel unsubscribed successfully"));
});

export const getSubscriptions = asyncHandler(async (req, res) => {
  const subscriptions = await Subscription.find({ subscriber: req.user._id }).populate("channel", "username fullname avatar").sort({ createdAt: -1 });
  return res.status(200).json(new ApiResponse(200, subscriptions, "subscriptions fetched successfully"));
});

export const getSubscriptionFeed = asyncHandler(async (req, res) => {
  const videos = await Subscription.aggregate([
    { $match: { subscriber: new mongoose.Types.ObjectId(req.user._id) } },
    { $lookup: { from: "videos", localField: "channel", foreignField: "owner", as: "videos" } },
    { $unwind: "$videos" },
    { $match: { "videos.isPublished": true } },
    { $replaceRoot: { newRoot: "$videos" } },
    { $sort: { createdAt: -1 } },
  ]);
  return res.status(200).json(new ApiResponse(200, videos, "subscription feed fetched successfully"));
});
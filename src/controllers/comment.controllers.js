import mongoose from "mongoose";
import { Comment } from "../models/comment.models.js";
import { Video } from "../models/video.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getComment = async (commentId) => {
  if (!mongoose.isValidObjectId(commentId)) throw new ApiError(400, "invalid comment id");
  const comment = await Comment.findById(commentId);
  if (!comment) throw new ApiError(404, "comment not found");
  return comment;
};

export const createComment = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content?.trim() || !mongoose.isValidObjectId(req.params.videoId)) throw new ApiError(400, "valid videoId and content are required");
  if (!await Video.exists({ _id: req.params.videoId })) throw new ApiError(404, "video not found");
  const comment = await Comment.create({ content: content.trim(), video: req.params.videoId, owner: req.user._id });
  return res.status(201).json(new ApiResponse(201, await comment.populate("owner", "username fullname avatar"), "comment created successfully"));
});

export const getComments = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.videoId)) throw new ApiError(400, "invalid video id");
  const comments = await Comment.find({ video: req.params.videoId }).populate("owner", "username fullname avatar").sort({ createdAt: -1 });
  return res.status(200).json(new ApiResponse(200, comments, "comments fetched successfully"));
});

export const updateComment = asyncHandler(async (req, res) => {
  const comment = await getComment(req.params.commentId);
  if (comment.owner.toString() !== req.user._id.toString()) throw new ApiError(403, "you are not allowed to modify this comment");
  if (!req.body.content?.trim()) throw new ApiError(400, "content is required");
  comment.content = req.body.content.trim();
  await comment.save();
  return res.status(200).json(new ApiResponse(200, comment, "comment updated successfully"));
});

export const deleteComment = asyncHandler(async (req, res) => {
  const comment = await getComment(req.params.commentId);
  if (comment.owner.toString() !== req.user._id.toString()) throw new ApiError(403, "you are not allowed to delete this comment");
  await comment.deleteOne();
  return res.status(200).json(new ApiResponse(200, {}, "comment deleted successfully"));
});
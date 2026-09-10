import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { videoService } from "../services/video.service.js";
import { User } from "../models/user.models.js";

const getVideoOrThrow = async (videoId) => {
  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "invalid video id");
  }

  const video = await videoService.getById(videoId);
  if (!video) throw new ApiError(404, "video not found");
  return video;
};

const ensureOwner = (video, userId) => {
  if (video.owner.toString() !== userId.toString()) {
    throw new ApiError(403, "you are not allowed to modify this video");
  }
};

export const publishVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const videoFile = req.files?.videoFile?.[0];
  const thumbnailFile = req.files?.thumbnail?.[0];

  if (!title?.trim() || !description?.trim()) {
    throw new ApiError(400, "title and description are required");
  }
  if (!videoFile || !thumbnailFile) {
    throw new ApiError(400, "videoFile and thumbnail files are required");
  }

  const uploadedVideo = await uploadOnCloudinary(videoFile.path, "video");
  const uploadedThumbnail = await uploadOnCloudinary(thumbnailFile.path, "image");
  if (!uploadedVideo || !uploadedThumbnail) {
    if (uploadedVideo) await deleteFromCloudinary(uploadedVideo.public_id, "video");
    if (uploadedThumbnail) await deleteFromCloudinary(uploadedThumbnail.public_id);
    throw new ApiError(500, "failed to upload video files");
  }

  try {
    const video = await videoService.create({
      videoFile: uploadedVideo.secure_url || uploadedVideo.url,
      videoPublicId: uploadedVideo.public_id,
      thumbnail: uploadedThumbnail.secure_url || uploadedThumbnail.url,
      thumbnailPublicId: uploadedThumbnail.public_id,
      title: title.trim(),
      description: description.trim(),
      duration: uploadedVideo.duration || 0,
      owner: req.user._id,
    });

    return res.status(201).json(new ApiResponse(201, video, "video published successfully"));
  } catch (error) {
    await deleteFromCloudinary(uploadedVideo.public_id, "video");
    await deleteFromCloudinary(uploadedThumbnail.public_id);
    throw error;
  }
});

export const getVideos = asyncHandler(async (req, res) => {
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 10, 1), 50);
  const search = req.query.search?.trim();
  const sort = req.query.sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };
  const filter = { isPublished: true };

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const [videos, total] = await videoService.listPublished(filter, sort, (page - 1) * limit, limit);

  return res.status(200).json(new ApiResponse(200, {
    videos,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  }, "videos fetched successfully"));
});

export const getVideoById = asyncHandler(async (req, res) => {
  const video = await getVideoOrThrow(req.params.videoId);
  if (!video.isPublished && (!req.user || video.owner.toString() !== req.user._id.toString())) {
    throw new ApiError(404, "video not found");
  }

  const updatedVideo = await videoService.incrementViews(video._id);
  if (req.user) {
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { watchHistory: video._id } });
  }
  return res.status(200).json(new ApiResponse(200, updatedVideo, "video fetched successfully"));
});

export const getChannelAnalytics = asyncHandler(async (req, res) => {
  const analytics = await User.aggregate([
    { $match: { _id: req.user._id } },
    { $lookup: { from: "videos", localField: "_id", foreignField: "owner", as: "videos" } },
    { $unwind: { path: "$videos", preserveNullAndEmptyArrays: true } },
    { $match: { "videos.isPublished": true } },
    { $group: {
      _id: "$_id",
      totalVideos: { $sum: 1 },
      totalViews: { $sum: "$videos.views" },
      averageViews: { $avg: "$videos.views" },
    } },
    { $project: { _id: 0, totalVideos: 1, totalViews: 1, averageViews: { $round: ["$averageViews", 2] } } },
  ]);
  return res.status(200).json(new ApiResponse(200, analytics[0] || { totalVideos: 0, totalViews: 0, averageViews: 0 }, "channel analytics fetched successfully"));
});

export const updateVideo = asyncHandler(async (req, res) => {
  const video = await getVideoOrThrow(req.params.videoId);
  ensureOwner(video, req.user._id);
  const updates = {};

  if (req.body.title?.trim()) updates.title = req.body.title.trim();
  if (req.body.description?.trim()) updates.description = req.body.description.trim();

  const thumbnailFile = req.files?.thumbnail?.[0];
  if (thumbnailFile) {
    const uploadedThumbnail = await uploadOnCloudinary(thumbnailFile.path, "image");
    if (!uploadedThumbnail) throw new ApiError(500, "failed to upload thumbnail");
    updates.thumbnail = uploadedThumbnail.secure_url || uploadedThumbnail.url;
    updates.thumbnailPublicId = uploadedThumbnail.public_id;
  }

  if (!Object.keys(updates).length) throw new ApiError(400, "no updates provided");
  const updatedVideo = await videoService.update(video._id, updates);
  if (thumbnailFile && video.thumbnailPublicId) await deleteFromCloudinary(video.thumbnailPublicId);
  return res.status(200).json(new ApiResponse(200, updatedVideo, "video updated successfully"));
});

export const deleteVideo = asyncHandler(async (req, res) => {
  const video = await getVideoOrThrow(req.params.videoId);
  ensureOwner(video, req.user._id);
  await videoService.remove(video);
  await Promise.all([
    deleteFromCloudinary(video.videoPublicId, "video"),
    deleteFromCloudinary(video.thumbnailPublicId),
  ]);
  return res.status(200).json(new ApiResponse(200, {}, "video deleted successfully"));
});

export const togglePublishStatus = asyncHandler(async (req, res) => {
  const video = await getVideoOrThrow(req.params.videoId);
  ensureOwner(video, req.user._id);
  const updatedVideo = await videoService.update(video._id, { isPublished: !video.isPublished });
  return res.status(200).json(new ApiResponse(200, updatedVideo, "video publish status updated"));
});
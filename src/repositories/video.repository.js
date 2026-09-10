import { Video } from "../models/video.models.js";

export const videoRepository = {
  findById(videoId) {
    return Video.findById(videoId);
  },
  findPublished(filter, sort, skip, limit) {
    return Video.find(filter).populate("owner", "username fullname avatar").sort(sort).skip(skip).limit(limit);
  },
  count(filter) {
    return Video.countDocuments(filter);
  },
  create(data) {
    return Video.create(data);
  },
  updateById(videoId, updates) {
    return Video.findByIdAndUpdate(videoId, updates, { new: true, runValidators: true });
  },
  incrementViews(videoId) {
    return Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } }, { new: true }).populate("owner", "username fullname avatar");
  },
  delete(video) {
    return video.deleteOne();
  },
};
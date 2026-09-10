import { videoRepository } from "../repositories/video.repository.js";

export const videoService = {
  getById(videoId) {
    return videoRepository.findById(videoId);
  },
  listPublished(filter, sort, skip, limit) {
    return Promise.all([
      videoRepository.findPublished(filter, sort, skip, limit),
      videoRepository.count(filter),
    ]);
  },
  create(data) {
    return videoRepository.create(data);
  },
  update(videoId, updates) {
    return videoRepository.updateById(videoId, updates);
  },
  incrementViews(videoId) {
    return videoRepository.incrementViews(videoId);
  },
  remove(video) {
    return videoRepository.delete(video);
  },
};
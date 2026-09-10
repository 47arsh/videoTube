import mongoose , {Schema} from "mongoose";

const videoSchema = new Schema({
    videoFile : {
        type : String,
        required : true
    },
    videoPublicId : {
        type : String
    },
    thumbnail : {
        type : String,
        required : true
    },
    thumbnailPublicId : {
        type : String
    },
    title : {
        type : String,
        required : true
    },
    description : {
        type : String,
        required : true,
    },
    views : {
        type : Number,
        default : 0
    },
    duration : {
        type : Number,
        default : 0
    },
    isPublished : {
        type : Boolean,
        default: true
    },
    owner : {
        type : Schema.Types.ObjectId,
        ref : "User"
    },
},{timestamps : true})

videoSchema.index({ owner: 1, createdAt: -1 });
videoSchema.index({ isPublished: 1, createdAt: -1 });

export const Video = mongoose.model("Video",videoSchema);
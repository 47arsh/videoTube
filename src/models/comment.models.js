import mongoose, {Schema} from "mongoose";

const commentSchema = new Schema(
    {
        content: {
            type: String,
            required: true
        },
        video: {
            type: Schema.Types.ObjectId,
            ref: "Video"
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    },
    {
        timestamps: true
    }
)


commentSchema.index({ video: 1, createdAt: -1 });

export const Comment = mongoose.model("Comment", commentSchema)
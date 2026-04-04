import mongoose from "mongoose";

const { Schema, model } = mongoose;

const sessionTokenSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    token: {
      type: String,
      required: true,
      unique: true
    },
    expiresAt: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

sessionTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const SessionToken = model("SessionToken", sessionTokenSchema);

export default SessionToken;

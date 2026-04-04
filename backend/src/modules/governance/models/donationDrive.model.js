import mongoose from "mongoose";

const { Schema, model } = mongoose;

const leaderboardEntrySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    score: { type: Number, default: 0 }
  },
  { _id: false }
);

const donationDriveSchema = new Schema(
  {
    title: { type: String, required: true },
    city: { type: String, required: true, index: true },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    leaderboard: { type: [leaderboardEntrySchema], default: [] }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

const DonationDrive = model("DonationDrive", donationDriveSchema);

export default DonationDrive;

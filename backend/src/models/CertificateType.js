import mongoose from "mongoose";

const certificateTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    supportsMercury: {
      type: Boolean,
      default: true,
    },
    supportsPh: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export const CertificateType = mongoose.model("CertificateType", certificateTypeSchema);

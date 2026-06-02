import mongoose from "mongoose";

const fieldLabelSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    section: {
      type: String,
      default: "certificate",
      trim: true,
    },
  },
  { timestamps: true },
);

export const FieldLabel = mongoose.model("FieldLabel", fieldLabelSchema);

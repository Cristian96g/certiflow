import mongoose from "mongoose";

const settingSchema = new mongoose.Schema(
  {
    laboratoryName: {
      type: String,
      default: "Laboratorio Campo Molino",
      trim: true,
    },
    defaultSignerName: {
      type: String,
      default: "Verna Matias",
      trim: true,
    },
    defaultSignerRole: {
      type: String,
      default: "Laboratorio",
      trim: true,
    },
    signatureImageUrl: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true },
);

export const Setting = mongoose.model("Setting", settingSchema);

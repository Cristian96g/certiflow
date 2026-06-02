import mongoose from "mongoose";

const certificateSchema = new mongoose.Schema(
  {
    certificateNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    certificateType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CertificateType",
      required: true,
      index: true,
    },
    site: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Site",
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    time: {
      type: String,
      required: true,
      trim: true,
    },
    samplePoint: {
      type: String,
      required: true,
      trim: true,
    },
    destination: {
      type: String,
      required: true,
      trim: true,
    },
    mercuryPpb: {
      type: Number,
      default: null,
    },
    density: {
      type: Number,
      required: true,
      min: 0,
    },
    temperatureC: {
      type: Number,
      default: 15,
    },
    api: {
      type: Number,
      required: true,
    },
    freeWaterPct: {
      type: Number,
      default: null,
    },
    totalImpurityPct: {
      type: Number,
      default: null,
    },
    emulsionPct: {
      type: Number,
      default: null,
    },
    sedimentPct: {
      type: Number,
      default: null,
    },
    tvrPsi: {
      type: Number,
      default: null,
    },
    ph: {
      type: Number,
      default: null,
    },
    observations: {
      type: String,
      default: "",
      trim: true,
    },
    signedBy: {
      type: String,
      default: "",
      trim: true,
    },
    signedRole: {
      type: String,
      default: "",
      trim: true,
    },
    templateSheet: {
      type: String,
      default: "",
      trim: true,
    },
    exportStatus: {
      pdfReady: {
        type: Boolean,
        default: false,
      },
      excelReady: {
        type: Boolean,
        default: false,
      },
    },
    excelPath: {
      type: String,
      default: "",
      trim: true,
    },
    pdfPath: {
      type: String,
      default: "",
      trim: true,
    },
    generatedAt: {
      type: Date,
      default: null,
    },
    sampleCount: {
      type: Number,
      default: 1,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

certificateSchema.index({ certificateNumber: 1, certificateType: 1 }, { unique: true });

export const Certificate = mongoose.model("Certificate", certificateSchema);

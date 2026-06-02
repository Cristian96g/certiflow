import mongoose from "mongoose";
import { env } from "./env.js";
import dns from "node:dns";



dns.setServers(["8.8.8.8", "1.1.1.1"]);

export const connectDatabase = async () => {
  if (!env.mongoUri) {
    throw new Error("Database connection aborted: env.mongoUri is undefined.");
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongoUri);
  console.log("MongoDB connected");
};



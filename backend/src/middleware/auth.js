import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    throw new AppError("Unauthorized", 401);
  }

  const token = authHeader.replace("Bearer ", "");
  const payload = jwt.verify(token, env.jwtSecret);
  const user = await User.findById(payload.sub);

  if (!user || !user.isActive) {
    throw new AppError("Unauthorized", 401);
  }

  req.user = user;
  next();
});

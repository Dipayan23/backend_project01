import { ApiError } from "../utils/api_error.utils";
import { async_handler } from "../utils/async_handler.utils";
import jwt from "jsonwebtoken";
import { User } from "../models/user.models";

export const verifyJWT = async_handler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.acessToken ||
      req.header("Authorization")?.replace("Bearer", "");
    if (!token) {
      throw new ApiError(401, "Unauthorized token");
    }
    const decodedToken = await jwt.verify(token, process.env.ACCESS_TOKEN_SECREt);
    const user = await User.findById(
      decodedToken?._id.select("-password -refreshToken")
    );
    if (!user) {
      throw new ApiError(401, "Invalid Acess Token");
    }
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401,error?.message);
  }
});

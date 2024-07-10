import { ApiError } from "../utils/api_error.utils.js";
import { async_handler } from "../utils/async_handler.utils.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";

export const verifyJWT = async_handler(async (req, _, next) => {
  try {
    const token = req.cookies?.acessToken || req.header("Authorization")?.replace("Bearer", "")
        
        //console.log(typeof(token));
        if (!token) {
            throw new ApiError(401, "Unauthorized request")
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if (!user) {
            
            throw new ApiError(401, "Invalid Access Token")
        }
    
        req.user = user;
        next()
  } catch (error) {
    throw new ApiError(401,error?.message);
  }
});

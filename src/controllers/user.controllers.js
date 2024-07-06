import { async_handler } from "../utils/async_handler.utils.js";
import { ApiError } from "../utils/api_error.utils.js";
import { User } from "../models/user.models.js";
import { uploadonCloudinary } from "../utils/cloudinary.utils.js";
import { ApiResponse } from "../utils/api_response.utils.js";

const registerUser = async_handler(async (req, res) => {
  //get user detail from frontend we can get it from post man
  const { fullname, email, username, password } = req.body;
  //console.log(email);
  //validation
  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All field are required");
  }
  //check user already exist or not via email and username
  const existed_user = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existed_user) {
    throw new ApiError(409, "User already exist");
  }
  //avater is available or not and also image
  const avatarlocalPath = await req.files?.avatar[0]?.path;
  //const coverlocalPath = await req.files?.coverImage[0]?.path;

  let coverlocalPath;
  if (req.files&&Array.isArray(req.files.coverImage)&&req.files?.coverImage.length()>0) {
    coverlocalPath = await req.files?.coverImage[0]?.path
  }

  if (!avatarlocalPath) {
    throw new ApiError(400, "Avatar is required");
  }
  //upload them cloudinary,avter check
  const avatar=await uploadonCloudinary(avatarlocalPath)
  const coverImage = await uploadonCloudinary(coverlocalPath)
  if (!avatar) {
    throw new ApiError(400, "Avatar is required");
  }
  //create user object-create entry in db
  const user=await User.create({
    fullname,
    avatar:avatar.url,
    coverImage:coverImage?.url ||"",
    email,
    password,
    username:username.toLowerCase(),
  })
  //remove password and refresh token field

  //check for user creation
  const createdUser=await User.findById(user._id).select(
    "-password -refreshToken"
  )
  if (!createdUser) {
    throw new ApiError(500,"Something went wron while uploading.")
  }
  //return response
  return res.status(201).json(
    new ApiResponse(200,createdUser,"User registered Succesfully.")
  )
});

export { registerUser };

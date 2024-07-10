import { async_handler } from "../utils/async_handler.utils.js";
import { ApiError } from "../utils/api_error.utils.js";
import { User } from "../models/user.models.js";
import { uploadonCloudinary } from "../utils/cloudinary.utils.js";
import { ApiResponse } from "../utils/api_response.utils.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const acessToken = user.generateAccessToken();
    const refreshToken = user.generateRefershToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { acessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      505,
      "Something went wrong while generatin acess and refresh token"
    );
  }
};

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
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files?.coverImage.length() > 0
  ) {
    coverlocalPath = await req.files?.coverImage[0]?.path;
  }

  if (!avatarlocalPath) {
    throw new ApiError(400, "Avatar is required");
  }
  //upload them cloudinary,avter check
  const avatar = await uploadonCloudinary(avatarlocalPath);
  const coverImage = await uploadonCloudinary(coverlocalPath);
  if (!avatar) {
    throw new ApiError(400, "Avatar is required");
  }
  //create user object-create entry in db
  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });
  //remove password and refresh token field

  //check for user creation
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "Something went wron while uploading.");
  }
  //return response
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Succesfully."));
});

const logInUser = async_handler(async (req, res) => {
  //req body se data
  const { username, email, password } = req.body;
  //console.log(email);
  //console.log(password);
  if (!username && !email) {
    throw new ApiError(400, "username and email required");
  }
  //check username or email is ok

  //find the user
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (!user) {
    throw new ApiError(404, "User does not exist");
  }
  console.log(password, email);
  //if yes check password
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (isPasswordValid === false) {
    throw new ApiError(403, "Password is incorrect");
  }
  //if yes create acess and refresh token
  const { acessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  //send them cookies
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("acessToken", acessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          acessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
  //response
});

const logOutUser = async_handler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("acessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"));
});

const refreshAcessToken = async_handler(async (req, res) => {
  try {
    const incomingRefreshToken =
      req.cookies?.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) {
      throw new ApiError(401, "unautherized request");
    }
    console.log(incomingRefreshToken);

    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    console.log("OK");
    const user = await User.findById(decodedToken._id);
    if (!user) {
      throw new ApiError(401, "invalid refresh token");
    }
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token expired");
    }
    const options = {
      httpOnly: true,
      secure: true,
    };
    const { acessToken, nrefreshToken } = await generateAccessAndRefreshToken(
      user._id
    );
    return res
      .status(200)
      .cookie("acessToken", acessToken, options)
      .cookie("refreshToken", nrefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { acessToken, refreshToken: nrefreshToken },
          "access token refresh"
        )
      );
  } catch (error) {
    throw new ApiError(401, error);
  }
});

const updatePassword = async_handler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);
  const isPassword = await user.isPasswordCorrect(oldPassword);
  if (!isPassword) {
    throw new ApiError(400, "Invalide old password");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res.status(200).json(new ApiResponse(200, user, "Password save"));
});

const getCurrentUser = async_handler(async (req, res) => {
  return res
    .status(200)
    .json(200, req.user, "current user fetched successfully");
});
const updateDetails = async_handler(async (req, res) => {
  const { fullname, email } = req.body;
  if (!fullname || !email) {
    throw new ApiError(402, "All fields are required");
  }
  const user = User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullname: fullname,
        email: email,
      },
    },
    { new: true }
  ).select("-password");
  return res.status(200).json(new ApiResponse(201,user,"Account details updated"));
});

const updateUserAvatar = async_handler(async (req, res) => {
  const avatarlocalPath = req.file?.path;
  if (!avatarlocalPath) {
    throw new ApiError(401, "You are not upload the avatar");
  }
  const avatar = uploadonCloudinary(avatarlocalPath);
  if (!avatar.url) {
    throw new ApiError(505, "Error occurs while uploading the avatar file");
  }
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");
  return res.status(200).json(new ApiResponse(201,user,"avatar updated"))
});
const updateUserCoverImage = async_handler(async (req, res) => {
  const coverImagelocalPath = req.file?.path;
  if (!coverImagelocalPath) {
    throw new ApiError(401, "You are not upload the avatar");
  }
  const coverImage = uploadonCloudinary(coverImagelocalPath);
  if (!coverImage.url) {
    throw new ApiError(505, "Error occurs while uploading the avatar file");
  }
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");
  return res.status(200).json(new ApiResponse(201,user,"avatar updated"))
});

export {
  registerUser,
  logInUser,
  logOutUser,
  refreshAcessToken,
  updatePassword,
  getCurrentUser,
  updateDetails,
  updateUserAvatar,
  updateUserCoverImage
};

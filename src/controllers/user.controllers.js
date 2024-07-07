import { async_handler } from "../utils/async_handler.utils.js";
import { ApiError } from "../utils/api_error.utils.js";
import { User } from "../models/user.models.js";
import { uploadonCloudinary } from "../utils/cloudinary.utils.js";
import { ApiResponse } from "../utils/api_response.utils.js";

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
  if (!username || !email) {
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
  //if yes check password
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (isPasswordValid === false) {
    throw new ApiError(403, "Password is incorrect");
  }
  //if yes create acess and refresh token
  const { acessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );
  const loggedInUser = await user
    .findById(user._id)
    .select("-password -refreshToken");

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
    .clearCookie("acessToken", acessToken, options)
    .clearCookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, {}, "User logged out"));
});

export { registerUser, logInUser, logOutUser };

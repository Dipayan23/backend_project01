import { async_handler } from "../utils/async_handler.utils.js";

const registerUser = async_handler(async (req, res) => {
  res.status(200).json({
    message: "OK",
  });
});

export { registerUser };

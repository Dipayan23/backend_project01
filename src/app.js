import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" })); //if our data comes through json file this way express accept it
app.use(express.urlencoded({ extended: true, limit: "16kb" })); //if the data come through url this wat express handle it
app.use(express.static("public")); //in public our assets store for use
app.use(cookieParser());//for cookie handleing
export { app };

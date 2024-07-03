import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
const connectDB=async()=>{
    try {
        const conectionInstance=await mongoose.connect(process.env.MONGODB_URI+'/'+DB_NAME)
        console.log("MONGO db connected :"+conectionInstance.connection.host);
    } catch (error) {
        console.log("mongo ERROR :"+error);
        process.exit(1)
    }
}

export default connectDB
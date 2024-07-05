import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); //well some times original name(name given by user) may cause error because if user uploade 2 or 3 same name file then this get override but here we save the data for limited time then we uploade it in cloudinary so the problem is not too serious.
  },
});

export const upload = multer({ storage: storage });

const multer = require("multer");
const storage = multer.diskStorage({});
const uploadcloudinary = multer({ storage: storage });

module.exports = uploadcloudinary;

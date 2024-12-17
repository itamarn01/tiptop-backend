const cloudinary = require("cloudinary");
var path = require("path");
const { URL } = require("url");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

uploadToCloudinary = (path, folder) => {
  return cloudinary.v2.uploader
    .upload(path, {
      folder,
    })
    .then((data) => {
      const url = new URL(data.secure_url);
      // Append the string after the word 'upload'
      url.pathname = url.pathname.replace(
        "/upload",
        "/upload/q_auto,f_auto,fl_lossy"
      );

      // Get the modified URL
      const modifiedUrl = url.href;
      console.log("the new url:", modifiedUrl)
      return { url: modifiedUrl, public_id: data.public_id, data: data };
    })
    .catch((err) => {
      console.log(err);
    });
};
removeFromCloudinary = async (public_id) => {
  await cloudinary.v2.uploader.destroy(public_id, function (err, res) {
    console.log(res, err);
  });
};
uploadFiletoCloudinary = async (filePath, folder, filename) => {
  let extension = filename.split(".").pop();
  let shortFileName = filename.split(".").slice(0, -1).join(".");
  return cloudinary.v2.uploader
    .upload(filePath, {
      folder: folder,
      use_filename: "true",
      filename_override: shortFileName,
      resource_type: "auto",
      //public_id: fileName + ext,
      format: extension,
      // raw_convert: "aspose",
    })
    .then((data) => {
      return { url: data.url, public_id: data.public_id, data: data };
    })
    .catch((err) => {
      console.log(err);
    });
};

uploadVideotoCloudinary = (path, folder) => {
  return cloudinary.v2.uploader
    .upload(path, {
      folder: folder,
      resource_type: "video",
      /* public_id: "myfolder/mysubfolder/dog_closeup",
    chunk_size: 6000000,
    eager: [
      { width: 300, height: 300, crop: "pad", audio_codec: "none" }, 
      { width: 160, height: 100, crop: "crop", gravity: "south", audio_codec: "none" } ],                                   
    eager_async: true,
    eager_notification_url: "https://mysite.example.com/notify_endpoint"*/
    })
    .then((data) => {
      const url = new URL(data.secure_url);
      // Append the string after the word 'upload'
      url.pathname = url.pathname.replace("/upload", "/upload/q_auto,f_auto");

      // Get the modified URL
      const modifiedUrl = url.href;
      return { url: modifiedUrl, public_id: data.public_id, data: data };
    })
    .catch((err) => {
      console.log(err);
    });
};

cloudinaryThumbnail = (path, folder) => {
  return cloudinary.v2.uploader
    .upload(path, {
      folder: folder,
      resource_type: "video",
      /* public_id: "myfolder/mysubfolder/dog_closeup",
    chunk_size: 6000000,
    eager: [
      { width: 300, height: 300, crop: "pad", audio_codec: "none" }, 
      { width: 160, height: 100, crop: "crop", gravity: "south", audio_codec: "none" } ],                                   
    eager_async: true,
    eager_notification_url: "https://mysite.example.com/notify_endpoint"*/
    })
    .then((data) => {
      console.log(data);

      return { url: data.url, public_id: data.public_id, data: data };
    })
    .catch((err) => {
      console.log(err);
    });
};

module.exports = {
  uploadToCloudinary,
  removeFromCloudinary,
  uploadFiletoCloudinary,
  uploadVideotoCloudinary,
  cloudinaryThumbnail,
};

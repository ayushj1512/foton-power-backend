import cloudinary from "./cloudinary.config.js";

const BASE_FOLDER = process.env.CLOUDINARY_BASE_FOLDER || "foton_media";

const clean = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9/_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^\/+|\/+$/g, "");

export const buildCloudinaryFolder = ({
  channel = "general",
  section = "",
  subSection = "",
} = {}) => {
  return [BASE_FOLDER, clean(channel), clean(section), clean(subSection)]
    .filter(Boolean)
    .join("/");
};

export const uploadToCloudinary = async ({
  file,
  folder,
  publicId,
  resourceType = "auto",
  tags = [],
  overwrite = false,
} = {}) => {
  if (!file?.buffer) {
    throw new Error("File buffer is required");
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId || undefined,
        resource_type: resourceType,
        tags,
        overwrite,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    stream.end(file.buffer);
  });
};

export const deleteFromCloudinary = async ({
  publicId,
  resourceType = "image",
} = {}) => {
  if (!publicId) throw new Error("publicId is required");

  return cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
  });
};

export const formatCloudinaryResponse = (file = {}) => ({
  assetId: file.asset_id || null,
  publicId: file.public_id || "",
  version: file.version || null,
  folder: file.folder || "",
  resourceType: file.resource_type || "",
  format: file.format || "",
  bytes: file.bytes || 0,
  width: file.width || null,
  height: file.height || null,
  url: file.url || "",
  secureUrl: file.secure_url || "",
  originalFilename: file.original_filename || "",
});
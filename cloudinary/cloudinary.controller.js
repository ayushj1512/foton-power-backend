import cloudinary from "./cloudinary.config.js";
import {
  buildCloudinaryFolder,
  uploadToCloudinary,
  deleteFromCloudinary,
  formatCloudinaryResponse,
} from "./cloudinary.utils.js";

const parseNumber = (value, fallback) => {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : fallback;
};

const getFolderFromBody = (body = {}) => {
  const {
    folder = "",
    channel = "general",
    section = "",
    subSection = "",
  } = body;

  if (folder && String(folder).trim()) {
    return String(folder).trim().replace(/^\/+|\/+$/g, "");
  }

  return buildCloudinaryFolder({ channel, section, subSection });
};

export const uploadSingleMedia = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "File is required" });
    }

    const { publicId = "", channel = "general", section = "", subSection = "", folder = "" } = req.body;

    const finalFolder = getFolderFromBody({
      folder,
      channel,
      section,
      subSection,
    });

    const uploaded = await uploadToCloudinary({
      file,
      folder: finalFolder,
      publicId: publicId || undefined,
      resourceType: "auto",
      tags: [channel, section, subSection].filter(Boolean),
    });

    return res.status(201).json({
      success: true,
      message: "File uploaded successfully",
      file: formatCloudinaryResponse(uploaded),
    });
  } catch (error) {
    console.error("uploadSingleMedia error:", error);
    return res.status(500).json({
      success: false,
      message: "Upload failed",
      error: error.message,
    });
  }
};

export const uploadMultipleMedia = async (req, res) => {
  try {
    const files = req.files || [];

    if (!files.length) {
      return res.status(400).json({ message: "Files are required" });
    }

    const { channel = "general", section = "", subSection = "", folder = "" } = req.body;

    const finalFolder = getFolderFromBody({
      folder,
      channel,
      section,
      subSection,
    });

    const uploadedFiles = await Promise.all(
      files.map((file) =>
        uploadToCloudinary({
          file,
          folder: finalFolder,
          resourceType: "auto",
          tags: [channel, section, subSection].filter(Boolean),
        })
      )
    );

    return res.status(201).json({
      success: true,
      message: "Files uploaded successfully",
      files: uploadedFiles.map(formatCloudinaryResponse),
    });
  } catch (error) {
    console.error("uploadMultipleMedia error:", error);
    return res.status(500).json({
      success: false,
      message: "Multiple upload failed",
      error: error.message,
    });
  }
};

export const getMediaLibrary = async (req, res) => {
  try {
    const {
      folder = "",
      resourceType = "image",
      page = 1,
      limit = 24,
    } = req.query;

    const safePage = parseNumber(page, 1);
    const safeLimit = parseNumber(limit, 24);
    const maxResults = Math.min(safeLimit, 100);

    const options = {
      type: "upload",
      prefix: folder ? String(folder).trim().replace(/^\/+|\/+$/g, "") : undefined,
      max_results: maxResults,
    };

    let result;

    if (resourceType === "video") {
      result = await cloudinary.api.resources_by_asset_folder(
        options.prefix || "",
        {
          resource_type: "video",
          type: "upload",
          max_results: maxResults,
          next_cursor: req.query.nextCursor || undefined,
        }
      );
    } else if (options.prefix) {
      result = await cloudinary.search
        .expression(`resource_type:${resourceType} AND folder="${options.prefix}"`)
        .sort_by("created_at", "desc")
        .max_results(maxResults)
        .next_cursor(req.query.nextCursor || undefined)
        .execute();
    } else {
      result = await cloudinary.search
        .expression(`resource_type:${resourceType}`)
        .sort_by("created_at", "desc")
        .max_results(maxResults)
        .next_cursor(req.query.nextCursor || undefined)
        .execute();
    }

    const resources = Array.isArray(result?.resources) ? result.resources : [];
    const items = resources.map((file) => ({
      _id: file.asset_id || file.public_id,
      ...formatCloudinaryResponse(file),
      createdAt: file.created_at || null,
      originalName: file.original_filename || "",
    }));

    return res.status(200).json({
      success: true,
      message: "Media fetched successfully",
      items,
      page: safePage,
      limit: safeLimit,
      nextCursor: result?.next_cursor || null,
      hasMore: !!result?.next_cursor,
      total: items.length,
    });
  } catch (error) {
    console.error("getMediaLibrary error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch media",
      error: error.message,
    });
  }
};

export const removeMedia = async (req, res) => {
  try {
    const { publicId, resourceType = "image" } = req.body;

    if (!publicId) {
      return res.status(400).json({ message: "publicId is required" });
    }

    const result = await deleteFromCloudinary({ publicId, resourceType });

    return res.status(200).json({
      success: true,
      message: "File deleted successfully",
      result,
    });
  } catch (error) {
    console.error("removeMedia error:", error);
    return res.status(500).json({
      success: false,
      message: "Delete failed",
      error: error.message,
    });
  }
};
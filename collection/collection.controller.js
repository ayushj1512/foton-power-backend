import mongoose from "mongoose";
import Collection from "./collection.js";

/* -------------------------------------------------------
   Helpers
------------------------------------------------------- */
const clean = (v = "") => String(v || "").trim();

const slugify = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const toBool = (value) => {
  if (typeof value === "boolean") return value;
  const v = String(value || "")
    .trim()
    .toLowerCase();
  return v === "true" || v === "1" || v === "yes";
};

const toNum = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const normalizeCode = (value = "") => {
  const raw = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");

  if (!raw) return "";
  if (/^\d+$/.test(raw)) return raw.padStart(5, "0");
  return raw;
};

const uniqueCodes = (codes = []) => [
  ...new Set(
    (Array.isArray(codes) ? codes : [codes]).map(normalizeCode).filter(Boolean)
  ),
];

/* -------------------------------------------------------
   Create
------------------------------------------------------- */
export const createCollection = async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      image,
      bannerImage,
      productCodes,
      isActive,
      isFeatured,
      showOnHomepage,
      sortOrder,
      seo,
    } = req.body;

    if (!clean(name)) {
      return res.status(400).json({
        success: false,
        message: "Collection name is required",
      });
    }

    const finalSlug = clean(slug) || slugify(name);

    const exists = await Collection.findOne({
      $or: [{ name: clean(name) }, { slug: finalSlug }],
    });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Collection with same name or slug already exists",
      });
    }

    const collection = await Collection.create({
      name: clean(name),
      slug: finalSlug,
      description: clean(description),
      image: clean(image),
      bannerImage: clean(bannerImage),
      productCodes: uniqueCodes(productCodes),
      isActive: typeof isActive === "undefined" ? true : toBool(isActive),
      isFeatured:
        typeof isFeatured === "undefined" ? false : toBool(isFeatured),
      showOnHomepage:
        typeof showOnHomepage === "undefined" ? false : toBool(showOnHomepage),
      sortOrder: toNum(sortOrder, 0),
      seo: {
        title: clean(seo?.title || name),
        description: clean(seo?.description),
        keywords: Array.isArray(seo?.keywords)
          ? [...new Set(seo.keywords.map((k) => clean(k)).filter(Boolean))]
          : [],
      },
    });

    return res.status(201).json({
      success: true,
      message: "Collection created successfully",
      collection,
    });
  } catch (error) {
    console.error("createCollection error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create collection",
      error: error.message,
    });
  }
};

/* -------------------------------------------------------
   Get All
------------------------------------------------------- */
export const getAllCollections = async (req, res) => {
  try {
    const {
      search = "",
      isActive,
      isFeatured,
      showOnHomepage,
      sort = "sortOrder",
      order = "asc",
      page = 1,
      limit = 20,
    } = req.query;

    const filters = {};

    if (clean(search)) {
      filters.$or = [
        { name: { $regex: clean(search), $options: "i" } },
        { slug: { $regex: clean(search), $options: "i" } },
        { description: { $regex: clean(search), $options: "i" } },
        { productCodes: { $in: [normalizeCode(search)] } },
      ];
    }

    if (typeof isActive !== "undefined") filters.isActive = toBool(isActive);
    if (typeof isFeatured !== "undefined") {
      filters.isFeatured = toBool(isFeatured);
    }
    if (typeof showOnHomepage !== "undefined") {
      filters.showOnHomepage = toBool(showOnHomepage);
    }

    const pageNum = Math.max(1, toNum(page, 1));
    const limitNum = Math.max(1, toNum(limit, 20));
    const skip = (pageNum - 1) * limitNum;

    const sortMap = {
      name: { name: order === "desc" ? -1 : 1 },
      createdAt: { createdAt: order === "desc" ? -1 : 1 },
      updatedAt: { updatedAt: order === "desc" ? -1 : 1 },
      sortOrder: { sortOrder: order === "desc" ? -1 : 1, createdAt: -1 },
    };

    const sortQuery = sortMap[sort] || { sortOrder: 1, createdAt: -1 };

    const [collections, total] = await Promise.all([
      Collection.find(filters).sort(sortQuery).skip(skip).limit(limitNum),
      Collection.countDocuments(filters),
    ]);

    return res.status(200).json({
      success: true,
      collections,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("getAllCollections error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch collections",
      error: error.message,
    });
  }
};

/* -------------------------------------------------------
   Get Active
------------------------------------------------------- */
export const getActiveCollections = async (_req, res) => {
  try {
    const collections = await Collection.find({ isActive: true }).sort({
      sortOrder: 1,
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      collections,
    });
  } catch (error) {
    console.error("getActiveCollections error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch active collections",
      error: error.message,
    });
  }
};

/* -------------------------------------------------------
   Get One (id or slug)
------------------------------------------------------- */
export const getCollectionByIdOrSlug = async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const value = clean(idOrSlug).toLowerCase();

    let collection = null;

    if (mongoose.isValidObjectId(idOrSlug)) {
      collection = await Collection.findById(idOrSlug);
    }

    if (!collection) {
      collection = await Collection.findOne({ slug: value });
    }

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Collection not found",
      });
    }

    return res.status(200).json({
      success: true,
      collection,
    });
  } catch (error) {
    console.error("getCollectionByIdOrSlug error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch collection",
      error: error.message,
    });
  }
};

/* -------------------------------------------------------
   Update
------------------------------------------------------- */
export const updateCollection = async (req, res) => {
  try {
    const { id } = req.params;

    const collection = await Collection.findById(id);
    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Collection not found",
      });
    }

    const {
      name,
      slug,
      description,
      image,
      bannerImage,
      productCodes,
      isActive,
      isFeatured,
      showOnHomepage,
      sortOrder,
      seo,
    } = req.body;

    if (typeof name !== "undefined") collection.name = clean(name);
    if (typeof slug !== "undefined") collection.slug = clean(slug).toLowerCase();
    if (typeof description !== "undefined") {
      collection.description = clean(description);
    }
    if (typeof image !== "undefined") collection.image = clean(image);
    if (typeof bannerImage !== "undefined") {
      collection.bannerImage = clean(bannerImage);
    }
    if (typeof isActive !== "undefined") collection.isActive = toBool(isActive);
    if (typeof isFeatured !== "undefined") {
      collection.isFeatured = toBool(isFeatured);
    }
    if (typeof showOnHomepage !== "undefined") {
      collection.showOnHomepage = toBool(showOnHomepage);
    }
    if (typeof sortOrder !== "undefined") {
      collection.sortOrder = toNum(sortOrder, 0);
    }

    if (typeof productCodes !== "undefined") {
      collection.productCodes = uniqueCodes(productCodes);
    }

    if (seo) {
      collection.seo = {
        title:
          typeof seo.title !== "undefined"
            ? clean(seo.title)
            : collection.seo?.title || "",
        description:
          typeof seo.description !== "undefined"
            ? clean(seo.description)
            : collection.seo?.description || "",
        keywords:
          typeof seo.keywords !== "undefined"
            ? [...new Set((seo.keywords || []).map((k) => clean(k)).filter(Boolean))]
            : collection.seo?.keywords || [],
      };
    }

    await collection.save();

    return res.status(200).json({
      success: true,
      message: "Collection updated successfully",
      collection,
    });
  } catch (error) {
    console.error("updateCollection error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update collection",
      error: error.message,
    });
  }
};

/* -------------------------------------------------------
   Delete
------------------------------------------------------- */
export const deleteCollection = async (req, res) => {
  try {
    const { id } = req.params;

    const collection = await Collection.findByIdAndDelete(id);
    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Collection not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Collection deleted successfully",
    });
  } catch (error) {
    console.error("deleteCollection error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete collection",
      error: error.message,
    });
  }
};

/* -------------------------------------------------------
   Toggle Flags
------------------------------------------------------- */
export const toggleCollectionStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const collection = await Collection.findById(id);
    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Collection not found",
      });
    }

    collection.isActive = !collection.isActive;
    await collection.save();

    return res.status(200).json({
      success: true,
      message: `Collection ${collection.isActive ? "activated" : "deactivated"} successfully`,
      collection,
    });
  } catch (error) {
    console.error("toggleCollectionStatus error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to toggle collection status",
      error: error.message,
    });
  }
};

export const toggleCollectionFeatured = async (req, res) => {
  try {
    const { id } = req.params;

    const collection = await Collection.findById(id);
    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Collection not found",
      });
    }

    collection.isFeatured = !collection.isFeatured;
    await collection.save();

    return res.status(200).json({
      success: true,
      message: "Collection featured flag updated successfully",
      collection,
    });
  } catch (error) {
    console.error("toggleCollectionFeatured error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to toggle featured flag",
      error: error.message,
    });
  }
};

export const toggleCollectionHomepage = async (req, res) => {
  try {
    const { id } = req.params;

    const collection = await Collection.findById(id);
    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Collection not found",
      });
    }

    collection.showOnHomepage = !collection.showOnHomepage;
    await collection.save();

    return res.status(200).json({
      success: true,
      message: "Collection homepage flag updated successfully",
      collection,
    });
  } catch (error) {
    console.error("toggleCollectionHomepage error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to toggle homepage flag",
      error: error.message,
    });
  }
};

/* -------------------------------------------------------
   Product Codes
------------------------------------------------------- */
export const addProductCodesToCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const { productCodes = [] } = req.body;

    const collection = await Collection.findById(id);
    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Collection not found",
      });
    }

    const nextCodes = uniqueCodes([
      ...(collection.productCodes || []),
      ...uniqueCodes(productCodes),
    ]);

    collection.productCodes = nextCodes;
    await collection.save();

    return res.status(200).json({
      success: true,
      message: "Product codes added successfully",
      collection,
    });
  } catch (error) {
    console.error("addProductCodesToCollection error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add product codes",
      error: error.message,
    });
  }
};

export const removeProductCodesFromCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const { productCodes = [] } = req.body;

    const collection = await Collection.findById(id);
    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Collection not found",
      });
    }

    const removeSet = new Set(uniqueCodes(productCodes));
    collection.productCodes = (collection.productCodes || []).filter(
      (code) => !removeSet.has(normalizeCode(code))
    );

    await collection.save();

    return res.status(200).json({
      success: true,
      message: "Product codes removed successfully",
      collection,
    });
  } catch (error) {
    console.error("removeProductCodesFromCollection error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove product codes",
      error: error.message,
    });
  }
};
import mongoose from "mongoose";
import Category from "./Category.js";

/* =========================================================
   HELPERS
========================================================= */
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const parseBool = (value, fallback = undefined) => {
  if (value === undefined) return fallback;
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
};

const parseNumber = (value, fallback) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const cleanArray = (arr = []) => {
  if (!Array.isArray(arr)) return [];
  return [...new Set(arr.map((v) => String(v || "").trim()).filter(Boolean))];
};

const normalizeSubcategoryPayload = (body = {}) => ({
  name: String(body.name || "").trim(),
  slug: String(body.slug || "").trim(),
  code: String(body.code || "").trim(),
  description: String(body.description || "").trim(),
  image: String(body.image || "").trim(),
  icon: String(body.icon || "").trim(),
  color: String(body.color || "").trim(),
  tags: cleanArray(body.tags),
  sortOrder: parseNumber(body.sortOrder, 0),
  isFeatured: !!body.isFeatured,
  isActive: body.isActive !== undefined ? !!body.isActive : true,
});

const buildAdminFilters = (query = {}) => {
  const filter = {};

  if (query.search) {
    const search = String(query.search).trim();
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { slug: { $regex: search, $options: "i" } },
      { code: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { tags: { $in: [new RegExp(search, "i")] } },
      { "subcategories.name": { $regex: search, $options: "i" } },
      { "subcategories.slug": { $regex: search, $options: "i" } },
      { "subcategories.code": { $regex: search, $options: "i" } },
    ];
  }

  const isActive = parseBool(query.isActive);
  const isFeatured = parseBool(query.isFeatured);

  if (typeof isActive === "boolean") filter.isActive = isActive;
  if (typeof isFeatured === "boolean") filter.isFeatured = isFeatured;

  return filter;
};

const buildStoreFilters = (query = {}) => {
  const filter = { isActive: true };

  if (query.featured === "true") filter.isFeatured = true;

  if (query.search) {
    const search = String(query.search).trim();
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { slug: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { tags: { $in: [new RegExp(search, "i")] } },
      { "subcategories.name": { $regex: search, $options: "i" } },
    ];
  }

  return filter;
};

const categoryListSelect = `
  name slug code description shortDescription image bannerImage icon color
  tags sortOrder isFeatured isActive subcategories createdAt updatedAt
`;

/* =========================================================
   ADMIN - CATEGORY
========================================================= */

// POST /api/admin/categories
export const createCategory = async (req, res) => {
  try {
    const {
      name,
      slug,
      code,
      description,
      shortDescription,
      image,
      bannerImage,
      icon,
      color,
      tags,
      sortOrder,
      isFeatured,
      isActive,
      seoTitle,
      seoDescription,
      subcategories = [],
    } = req.body;

    if (!String(name || "").trim()) {
      return res.status(400).json({ success: false, message: "Category name is required" });
    }

    const category = await Category.create({
      name,
      slug,
      code,
      description,
      shortDescription,
      image,
      bannerImage,
      icon,
      color,
      tags: cleanArray(tags),
      sortOrder: parseNumber(sortOrder, 0),
      isFeatured: !!isFeatured,
      isActive: isActive !== undefined ? !!isActive : true,
      seoTitle,
      seoDescription,
      subcategories: Array.isArray(subcategories)
        ? subcategories.map(normalizeSubcategoryPayload)
        : [],
      createdBy: req.user?._id || null,
      updatedBy: req.user?._id || null,
    });

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create category",
    });
  }
};

// GET /api/admin/categories
export const getAdminCategories = async (req, res) => {
  try {
    const page = Math.max(parseNumber(req.query.page, 1), 1);
    const limit = Math.min(Math.max(parseNumber(req.query.limit, 20), 1), 200);
    const skip = (page - 1) * limit;

    const sortBy = req.query.sortBy || "sortOrder";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

    const allowedSorts = ["sortOrder", "name", "createdAt", "updatedAt"];
    const finalSortBy = allowedSorts.includes(sortBy) ? sortBy : "sortOrder";

    const filter = buildAdminFilters(req.query);

    const [items, total] = await Promise.all([
      Category.find(filter)
        .sort({ [finalSortBy]: sortOrder, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select(categoryListSelect),
      Category.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: items,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch categories",
    });
  }
};

// GET /api/admin/categories/:id
export const getAdminCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid category id" });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    return res.json({ success: true, data: category });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch category",
    });
  }
};

// PATCH /api/admin/categories/:id
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid category id" });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    const fields = [
      "name",
      "slug",
      "code",
      "description",
      "shortDescription",
      "image",
      "bannerImage",
      "icon",
      "color",
      "seoTitle",
      "seoDescription",
    ];

    for (const field of fields) {
      if (req.body[field] !== undefined) category[field] = req.body[field];
    }

    if (req.body.tags !== undefined) category.tags = cleanArray(req.body.tags);
    if (req.body.sortOrder !== undefined) category.sortOrder = parseNumber(req.body.sortOrder, 0);
    if (req.body.isFeatured !== undefined) category.isFeatured = !!req.body.isFeatured;
    if (req.body.isActive !== undefined) category.isActive = !!req.body.isActive;
    if (req.body.subcategories !== undefined) {
      category.subcategories = Array.isArray(req.body.subcategories)
        ? req.body.subcategories.map(normalizeSubcategoryPayload)
        : [];
    }

    category.updatedBy = req.user?._id || null;

    await category.save();

    return res.json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update category",
    });
  }
};

// PATCH /api/admin/categories/:id/toggle-active
export const toggleCategoryStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid category id" });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    category.isActive = !category.isActive;
    category.updatedBy = req.user?._id || null;
    await category.save();

    return res.json({
      success: true,
      message: `Category ${category.isActive ? "activated" : "deactivated"} successfully`,
      data: category,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to toggle category status",
    });
  }
};

// DELETE /api/admin/categories/:id
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid category id" });
    }

    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    return res.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete category",
    });
  }
};

/* =========================================================
   ADMIN - SUBCATEGORY
========================================================= */

// POST /api/admin/categories/:categoryId/subcategories
export const addSubcategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    if (!isValidObjectId(categoryId)) {
      return res.status(400).json({ success: false, message: "Invalid category id" });
    }

    const payload = normalizeSubcategoryPayload(req.body);
    if (!payload.name) {
      return res.status(400).json({ success: false, message: "Subcategory name is required" });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    category.subcategories.push(payload);
    category.updatedBy = req.user?._id || null;
    await category.save();

    return res.status(201).json({
      success: true,
      message: "Subcategory added successfully",
      data: category,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to add subcategory",
    });
  }
};

// PATCH /api/admin/categories/:categoryId/subcategories/:subcategoryId
export const updateSubcategory = async (req, res) => {
  try {
    const { categoryId, subcategoryId } = req.params;

    if (!isValidObjectId(categoryId) || !isValidObjectId(subcategoryId)) {
      return res.status(400).json({ success: false, message: "Invalid id provided" });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    const subcategory = category.subcategories.id(subcategoryId);
    if (!subcategory) {
      return res.status(404).json({ success: false, message: "Subcategory not found" });
    }

    const fields = [
      "name",
      "slug",
      "code",
      "description",
      "image",
      "icon",
      "color",
      "sortOrder",
      "isFeatured",
      "isActive",
    ];

    for (const field of fields) {
      if (req.body[field] !== undefined) subcategory[field] = req.body[field];
    }

    if (req.body.tags !== undefined) subcategory.tags = cleanArray(req.body.tags);

    category.updatedBy = req.user?._id || null;
    await category.save();

    return res.json({
      success: true,
      message: "Subcategory updated successfully",
      data: category,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update subcategory",
    });
  }
};

// PATCH /api/admin/categories/:categoryId/subcategories/:subcategoryId/toggle-active
export const toggleSubcategoryStatus = async (req, res) => {
  try {
    const { categoryId, subcategoryId } = req.params;

    if (!isValidObjectId(categoryId) || !isValidObjectId(subcategoryId)) {
      return res.status(400).json({ success: false, message: "Invalid id provided" });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    const subcategory = category.subcategories.id(subcategoryId);
    if (!subcategory) {
      return res.status(404).json({ success: false, message: "Subcategory not found" });
    }

    subcategory.isActive = !subcategory.isActive;
    category.updatedBy = req.user?._id || null;

    await category.save();

    return res.json({
      success: true,
      message: `Subcategory ${subcategory.isActive ? "activated" : "deactivated"} successfully`,
      data: category,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to toggle subcategory status",
    });
  }
};

// DELETE /api/admin/categories/:categoryId/subcategories/:subcategoryId
export const deleteSubcategory = async (req, res) => {
  try {
    const { categoryId, subcategoryId } = req.params;

    if (!isValidObjectId(categoryId) || !isValidObjectId(subcategoryId)) {
      return res.status(400).json({ success: false, message: "Invalid id provided" });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    const subcategory = category.subcategories.id(subcategoryId);
    if (!subcategory) {
      return res.status(404).json({ success: false, message: "Subcategory not found" });
    }

    subcategory.deleteOne();
    category.updatedBy = req.user?._id || null;
    await category.save();

    return res.json({
      success: true,
      message: "Subcategory deleted successfully",
      data: category,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete subcategory",
    });
  }
};

/* =========================================================
   STORE / CUSTOMER
========================================================= */

// GET /api/categories
export const getStoreCategories = async (req, res) => {
  try {
    const filter = buildStoreFilters(req.query);

    const categories = await Category.find(filter)
      .sort({ sortOrder: 1, name: 1 })
      .select(categoryListSelect)
      .lean();

    const data = categories.map((item) => ({
      ...item,
      subcategories: (item.subcategories || [])
        .filter((sub) => sub.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    }));

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch categories",
    });
  }
};

// GET /api/categories/featured
export const getFeaturedCategories = async (_req, res) => {
  try {
    const categories = await Category.find({
      isActive: true,
      isFeatured: true,
    })
      .sort({ sortOrder: 1, createdAt: -1 })
      .select(categoryListSelect)
      .lean();

    const data = categories.map((item) => ({
      ...item,
      subcategories: (item.subcategories || []).filter((sub) => sub.isActive),
    }));

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch featured categories",
    });
  }
};

// GET /api/categories/:slug
export const getStoreCategoryBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const category = await Category.findOne({
      slug: String(slug || "").trim().toLowerCase(),
      isActive: true,
    })
      .select(categoryListSelect)
      .lean();

    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    category.subcategories = (category.subcategories || [])
      .filter((sub) => sub.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    return res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch category",
    });
  }
};

// GET /api/categories/:categorySlug/subcategories/:subcategorySlug
export const getStoreSubcategoryBySlug = async (req, res) => {
  try {
    const { categorySlug, subcategorySlug } = req.params;

    const category = await Category.findOne({
      slug: String(categorySlug || "").trim().toLowerCase(),
      isActive: true,
    })
      .select(categoryListSelect)
      .lean();

    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    const subcategory = (category.subcategories || []).find(
      (sub) =>
        sub.isActive &&
        sub.slug === String(subcategorySlug || "").trim().toLowerCase()
    );

    if (!subcategory) {
      return res.status(404).json({ success: false, message: "Subcategory not found" });
    }

    return res.json({
      success: true,
      data: {
        category: {
          _id: category._id,
          name: category.name,
          slug: category.slug,
          code: category.code,
          image: category.image,
          bannerImage: category.bannerImage,
        },
        subcategory,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch subcategory",
    });
  }
};
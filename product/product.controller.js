import mongoose from "mongoose";
import Product from "./product.js";
import Category from "../category/category.js";
import Collection from "../collection/collection.js";

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const clean = (v = "") => String(v || "").trim();

const parseBool = (value) => {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return undefined;
};

const parseNumber = (value, fallback = undefined) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const escapeRegex = (text = "") =>
  String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildSort = (sort = "newest") => {
  switch (sort) {
    case "oldest":
      return { createdAt: 1 };
    case "price_asc":
      return { discountPrice: 1, createdAt: -1 };
    case "price_desc":
      return { discountPrice: -1, createdAt: -1 };
    case "name_asc":
      return { name: 1 };
    case "name_desc":
      return { name: -1 };
    case "best_selling":
      return { soldCount: -1, createdAt: -1 };
    default:
      return { createdAt: -1 };
  }
};

const productPopulate = [
  { path: "category", select: "name slug subcategories" },
  { path: "collections", select: "name slug" },
  { path: "createdBy", select: "name email" },
  { path: "updatedBy", select: "name email" },
];

const publicPopulate = [
  { path: "category", select: "name slug subcategories" },
  { path: "collections", select: "name slug" },
];

const resolveCategoryId = async (value) => {
  const raw = clean(value);
  if (!raw) return null;

  if (isValidObjectId(raw)) return raw;

  const category = await Category.findOne({
    $or: [
      { slug: raw.toLowerCase() },
      { name: new RegExp(`^${escapeRegex(raw)}$`, "i") },
    ],
  }).select("_id");

  return category?._id || null;
};

const resolveSubcategory = async (value, categoryValue = "") => {
  const raw = clean(value);
  const rawCategory = clean(categoryValue);

  if (!raw) return null;

  const categoryFilter = rawCategory
    ? {
        $or: isValidObjectId(rawCategory)
          ? [{ _id: rawCategory }]
          : [
              { slug: rawCategory.toLowerCase() },
              { name: new RegExp(`^${escapeRegex(rawCategory)}$`, "i") },
            ],
      }
    : {};

  const subcategoryMatch = {
    $or: [
      { "subcategories.slug": raw.toLowerCase() },
      { "subcategories.name": new RegExp(`^${escapeRegex(raw)}$`, "i") },
      ...(isValidObjectId(raw) ? [{ "subcategories._id": raw }] : []),
    ],
  };

  const category = await Category.findOne({
    ...categoryFilter,
    ...subcategoryMatch,
  }).select("name slug subcategories");

  if (!category) return null;

  const subcategory =
    category.subcategories?.find((sub) => {
      if (isValidObjectId(raw) && String(sub._id) === raw) return true;
      if (sub.slug === raw.toLowerCase()) return true;
      return new RegExp(`^${escapeRegex(raw)}$`, "i").test(sub.name);
    }) || null;

  if (!subcategory) return null;

  return {
    categoryId: category._id,
    category,
    subcategoryId: subcategory._id,
    subcategory,
  };
};

const resolveCollectionIds = async (values = []) => {
  const arr = Array.isArray(values) ? values : [values];
  const cleaned = arr.map(clean).filter(Boolean);

  if (!cleaned.length) return [];

  const objectIds = cleaned.filter(isValidObjectId);
  const nonIds = cleaned.filter((item) => !isValidObjectId(item));

  if (!nonIds.length) return [...new Set(objectIds)];

  const collections = await Collection.find({
    $or: [
      { slug: { $in: nonIds.map((v) => v.toLowerCase()) } },
      ...nonIds.map((v) => ({
        name: new RegExp(`^${escapeRegex(v)}$`, "i"),
      })),
    ],
  }).select("_id");

  return [...new Set([...objectIds, ...collections.map((c) => String(c._id))])];
};

const attachSubcategoryDetails = (product) => {
  const item = product?.toObject ? product.toObject() : product;
  if (!item?.category || !item?.subcategory) return item;

  const subcategory =
    item.category.subcategories?.find(
      (sub) => String(sub._id) === String(item.subcategory)
    ) || null;

  return {
    ...item,
    subcategoryDetails: subcategory
      ? {
          _id: subcategory._id,
          name: subcategory.name,
          slug: subcategory.slug,
          code: subcategory.code,
          image: subcategory.image,
          icon: subcategory.icon,
          color: subcategory.color,
          isActive: subcategory.isActive,
          isFeatured: subcategory.isFeatured,
        }
      : null,
  };
};

const buildProductFilters = async (query = {}, { admin = false } = {}) => {
  const {
    search,
    status,
    category,
    subcategory,
    collection,
    featured,
    bestSeller,
    minPrice,
    maxPrice,
    inStock,
    color,
    size,
    productCode,
  } = query;

  const filter = {};

  if (!admin) {
    filter.status = "active";
  } else if (clean(status)) {
    filter.status = clean(status);
  }

  if (clean(search)) {
    const rx = new RegExp(escapeRegex(clean(search)), "i");
    filter.$or = [
      { name: rx },
      { productCode: rx },
      { description: rx },
      { shortDescription: rx },
      { tags: rx },
      { color: rx },
    ];
  }

  if (clean(productCode)) {
    filter.productCode = clean(productCode);
  }

  if (clean(category)) {
    const categoryId = await resolveCategoryId(category);
    if (!categoryId) {
      return { impossible: true, filter: { _id: null } };
    }
    filter.category = categoryId;
  }

  if (clean(subcategory)) {
    const resolved = await resolveSubcategory(subcategory, category);
    if (!resolved) {
      return { impossible: true, filter: { _id: null } };
    }

    filter.category = resolved.categoryId;
    filter.subcategory = resolved.subcategoryId;
  }

  if (clean(collection)) {
    const collectionIds = await resolveCollectionIds(
      String(collection)
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean)
    );

    if (!collectionIds.length) {
      return { impossible: true, filter: { _id: null } };
    }

    filter.collections = { $in: collectionIds };
  }

  const featuredBool = parseBool(featured);
  if (typeof featuredBool === "boolean") {
    filter.isFeatured = featuredBool;
  }

  const bestSellerBool = parseBool(bestSeller);
  if (typeof bestSellerBool === "boolean") {
    filter.isBestSeller = bestSellerBool;
  }

  const min = parseNumber(minPrice);
  const max = parseNumber(maxPrice);
  if (min !== undefined || max !== undefined) {
    filter.discountPrice = {};
    if (min !== undefined) filter.discountPrice.$gte = min;
    if (max !== undefined) filter.discountPrice.$lte = max;
  }

  const inStockBool = parseBool(inStock);
  if (inStockBool === true) {
    filter.stock = { $gt: 0 };
  }

  if (clean(color)) {
    filter.color = new RegExp(`^${escapeRegex(clean(color))}$`, "i");
  }

  if (clean(size)) {
    filter["variants.size"] = clean(size).toUpperCase();
  }

  return { impossible: false, filter };
};

/* =========================================================
   ADMIN
========================================================= */

// POST /api/admin/products
export const createProduct = async (req, res) => {
  try {
    const body = { ...req.body };

    if (body.category) {
      const categoryId = await resolveCategoryId(body.category);
      if (!categoryId) {
        return res.status(400).json({
          success: false,
          message: "Valid category not found",
        });
      }
      body.category = categoryId;
    }

    if (body.subcategory) {
      const resolved = await resolveSubcategory(body.subcategory, body.category);
      if (!resolved) {
        return res.status(400).json({
          success: false,
          message: "Valid subcategory not found",
        });
      }
      body.category = resolved.categoryId;
      body.subcategory = resolved.subcategoryId;
    }

    if (body.collections?.length) {
      body.collections = await resolveCollectionIds(body.collections);
    }

    if (req.user?._id) {
      body.createdBy = req.user._id;
      body.updatedBy = req.user._id;
    }

    const product = await Product.create(body);

    const populated = await Product.findById(product._id).populate(productPopulate);

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product: attachSubcategoryDetails(populated),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create product",
    });
  }
};

// GET /api/admin/products
export const getAdminProducts = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 20, 1);
    const skip = (page - 1) * limit;

    const { filter } = await buildProductFilters(req.query, { admin: true });
    const sort = buildSort(req.query.sort);

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate(productPopulate)
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Product.countDocuments(filter),
    ]);

    res.json({
      success: true,
      products: products.map(attachSubcategoryDetails),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch products",
    });
  }
};

// GET /api/admin/products/:id
export const getAdminProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id).populate(productPopulate);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      product: attachSubcategoryDetails(product),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch product",
    });
  }
};

// PATCH /api/admin/products/:id
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const body = { ...req.body };

    const existing = await Product.findById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (body.category) {
      const categoryId = await resolveCategoryId(body.category);
      if (!categoryId) {
        return res.status(400).json({
          success: false,
          message: "Valid category not found",
        });
      }
      body.category = categoryId;
    }

    if (body.subcategory) {
      const resolved = await resolveSubcategory(
        body.subcategory,
        body.category || existing.category
      );

      if (!resolved) {
        return res.status(400).json({
          success: false,
          message: "Valid subcategory not found",
        });
      }

      body.category = resolved.categoryId;
      body.subcategory = resolved.subcategoryId;
    }

    if (body.collections) {
      body.collections = await resolveCollectionIds(body.collections);
    }

    if (req.user?._id) {
      body.updatedBy = req.user._id;
    }

    Object.assign(existing, body);
    await existing.save();

    const updated = await Product.findById(existing._id).populate(productPopulate);

    res.json({
      success: true,
      message: "Product updated successfully",
      product: attachSubcategoryDetails(updated),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update product",
    });
  }
};

// DELETE /api/admin/products/:id
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Product.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete product",
    });
  }
};

/* =========================================================
   PUBLIC
========================================================= */

// GET /api/products
export const getAllProducts = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 12, 1);
    const skip = (page - 1) * limit;

    const { filter } = await buildProductFilters(req.query, { admin: false });
    const sort = buildSort(req.query.sort);

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate(publicPopulate)
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Product.countDocuments(filter),
    ]);

    res.json({
      success: true,
      products: products.map(attachSubcategoryDetails),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch products",
    });
  }
};

// GET /api/products/subcategory/:subcategory
export const getProductsBySubcategory = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 12, 1);
    const skip = (page - 1) * limit;

    const resolved = await resolveSubcategory(
      req.params.subcategory,
      req.query.category
    );

    if (!resolved) {
      return res.status(404).json({
        success: false,
        message: "Subcategory not found",
      });
    }

    const filter = {
      status: "active",
      category: resolved.categoryId,
      subcategory: resolved.subcategoryId,
    };

    const sort = buildSort(req.query.sort);

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate(publicPopulate)
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Product.countDocuments(filter),
    ]);

    res.json({
      success: true,
      category: {
        _id: resolved.category._id,
        name: resolved.category.name,
        slug: resolved.category.slug,
      },
      subcategory: {
        _id: resolved.subcategory._id,
        name: resolved.subcategory.name,
        slug: resolved.subcategory.slug,
        code: resolved.subcategory.code,
        image: resolved.subcategory.image,
        icon: resolved.subcategory.icon,
        color: resolved.subcategory.color,
        isActive: resolved.subcategory.isActive,
        isFeatured: resolved.subcategory.isFeatured,
      },
      products: products.map(attachSubcategoryDetails),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch products by subcategory",
    });
  }
};

// GET /api/products/:idOrCode
export const getProductByIdOrCode = async (req, res) => {
  try {
    const { idOrCode } = req.params;

    const filter = isValidObjectId(idOrCode)
      ? { $or: [{ _id: idOrCode }, { productCode: idOrCode }] }
      : { productCode: idOrCode };

    const product = await Product.findOne({
      ...filter,
      status: "active",
    }).populate(publicPopulate);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      product: attachSubcategoryDetails(product),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch product",
    });
  }
};
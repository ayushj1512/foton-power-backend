import jwt from "jsonwebtoken";
import AdminUser from "./adminUsers.js";

/* =========================================================
   JWT helper
========================================================= */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

/* =========================================================
   CREATE ADMIN USER
========================================================= */
export const createAdminUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    const existingUser = await AdminUser.findOne({
      email: String(email).toLowerCase().trim(),
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    const user = await AdminUser.create({
      name: String(name).trim(),
      email: String(email).toLowerCase().trim(),
      password,
      role: role || "admin",
    });

    return res.status(201).json({
      success: true,
      message: "Admin user created successfully",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("createAdminUser error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create admin user",
      error: error.message,
    });
  }
};

/* =========================================================
   LOGIN ADMIN USER
========================================================= */
export const loginAdminUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await AdminUser.findOne({
      email: String(email).toLowerCase().trim(),
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("loginAdminUser error:", error);
    return res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
};

/* =========================================================
   GET ALL ADMIN USERS
========================================================= */
export const getAllAdminUsers = async (req, res) => {
  try {
    const users = await AdminUser.find()
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error("getAllAdminUsers error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin users",
      error: error.message,
    });
  }
};

/* =========================================================
   GET SINGLE ADMIN USER
========================================================= */
export const getAdminUserById = async (req, res) => {
  try {
    const user = await AdminUser.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Admin user not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("getAdminUserById error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin user",
      error: error.message,
    });
  }
};

/* =========================================================
   GET CURRENT LOGGED-IN USER
   req.user should come from auth middleware
========================================================= */
export const getMe = async (req, res) => {
  try {
    const user = await AdminUser.findById(req.user?._id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("getMe error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
      error: error.message,
    });
  }
};

/* =========================================================
   UPDATE ADMIN USER BASIC DETAILS
   password update alag controller se hoga
========================================================= */
export const updateAdminUser = async (req, res) => {
  try {
    const { name, email, role } = req.body;

    const user = await AdminUser.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Admin user not found",
      });
    }

    if (email && email !== user.email) {
      const existingEmail = await AdminUser.findOne({
        email: String(email).toLowerCase().trim(),
        _id: { $ne: user._id },
      });

      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: "Email already in use",
        });
      }

      user.email = String(email).toLowerCase().trim();
    }

    if (name) user.name = String(name).trim();
    if (role) user.role = role;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Admin user updated successfully",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("updateAdminUser error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update admin user",
      error: error.message,
    });
  }
};

/* =========================================================
   CHANGE PASSWORD
========================================================= */
export const changeAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long",
      });
    }

    const user = await AdminUser.findById(req.user?._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isPasswordMatch = await user.comparePassword(currentPassword);

    if (!isPasswordMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("changeAdminPassword error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to change password",
      error: error.message,
    });
  }
};

/* =========================================================
   DELETE ADMIN USER
========================================================= */
export const deleteAdminUser = async (req, res) => {
  try {
    const user = await AdminUser.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Admin user not found",
      });
    }

    await user.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Admin user deleted successfully",
    });
  } catch (error) {
    console.error("deleteAdminUser error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete admin user",
      error: error.message,
    });
  }
};
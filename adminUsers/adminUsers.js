import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const adminUserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    role: {
      type: String,
      default: "admin", // future use
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

/* =========================================================
   🔐 HASH PASSWORD BEFORE SAVE
========================================================= */
adminUserSchema.pre("save", async function () {
  // only hash if password modified
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

/* =========================================================
   🔑 COMPARE PASSWORD
========================================================= */
adminUserSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const AdminUser =
  mongoose.models.AdminUser ||
  mongoose.model("AdminUser", adminUserSchema);

export default AdminUser;
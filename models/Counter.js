import mongoose from "mongoose";

const counterSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    seq: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

/* =========================================================
   GET NEXT NUMBER
========================================================= */
counterSchema.statics.getNext = async function (key, { start = 1 } = {}) {
  const existing = await this.findOne({ key });

  if (!existing) {
    const created = await this.create({
      key,
      seq: start,
    });
    return created.seq;
  }

  const updated = await this.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { returnDocument: "after" }
  );

  return updated.seq;
};

/* =========================================================
   GET NEXT PADDED VALUE
========================================================= */
counterSchema.statics.getNextPadded = async function (
  key,
  { pad = 5, start = 1, prefix = "", suffix = "" } = {}
) {
  const nextSeq = await this.getNext(key, { start });
  return `${prefix}${String(nextSeq).padStart(pad, "0")}${suffix}`;
};

const Counter = mongoose.model("Counter", counterSchema);

export default Counter;
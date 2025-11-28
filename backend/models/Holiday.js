// backend/models/Holiday.js
const mongoose = require("mongoose");

const HolidaySchema = new mongoose.Schema(
  {
    autoId: {
      type: Number,
      unique: true, 
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    scheduleOf: {
      type: String,
      default: "Doctor",
    },
    name: {
      type: String,
      required: true,
    },
    doctorName: {
      type: String,
      required: true,
    },
    fromDate: {
      type: Date,
      required: true,
    },
    toDate: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

HolidaySchema.pre("save", async function (next) {
  if (this.autoId) return next(); // already assigned

  const last = await this.constructor.findOne().sort({ autoId: -1 });
  this.autoId = last ? last.autoId + 1 : 1;

  next();
});

module.exports = mongoose.model("Holiday", HolidaySchema);

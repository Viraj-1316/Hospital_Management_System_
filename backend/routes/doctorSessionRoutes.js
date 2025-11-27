const express = require("express");
const router = express.Router();
const fs = require("fs");
const csv = require("csv-parser");
const DoctorSessionModel = require("../models/DoctorSession");
const AppointmentModel = require("../models/Appointment"); // <-- added import
const upload = require("../middleware/upload");

// ===============================
//   CRUD: Doctor Sessions
// ===============================

// Get all sessions  -> GET /doctor-sessions
router.get("/", async (req, res) => {
  try {
    const list = await DoctorSessionModel.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    console.error("Error fetching doctor sessions:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Create session -> POST /doctor-sessions
router.post("/", async (req, res) => {
  try {
    const doc = await DoctorSessionModel.create(req.body);
    res.json({ message: "Doctor session created", data: doc });
  } catch (err) {
    console.error("Error creating doctor session:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Update session -> PUT /doctor-sessions/:id
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await DoctorSessionModel.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    if (!updated) {
      return res.status(404).json({ message: "Doctor session not found" });
    }
    res.json({ message: "Doctor session updated", data: updated });
  } catch (err) {
    console.error("Error updating doctor session:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Delete session -> DELETE /doctor-sessions/:id
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await DoctorSessionModel.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Doctor session not found" });
    }
    res.json({ message: "Doctor session deleted" });
  } catch (err) {
    console.error("Error deleting doctor session:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ===============================
//   CSV Import  -> POST /doctor-sessions/import
// ===============================
router.post("/import", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const results = [];
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (row) => {
        const daysString = row.days || "";
        const daysArray = daysString.split(",").map(d => d.trim()).filter(d => d);

        results.push({
          doctorId: row.doctorId || "",
          doctorName: row.doctorName || "",
          clinic: row.clinic || "",
          days: daysArray,
          timeSlotMinutes: parseInt(row.timeSlotMinutes) || 30,
          morningStart: row.morningStart || "",
          morningEnd: row.morningEnd || "",
          eveningStart: row.eveningStart || "",
          eveningEnd: row.eveningEnd || "",
        });
      })
      .on("end", async () => {
        try {
          await DoctorSessionModel.insertMany(results);
          fs.unlinkSync(req.file.path);
          res.json({
            message: "Imported doctor sessions successfully",
            count: results.length
          });
        } catch (err) {
          console.error("Database insertion error:", err);
          if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
          res.status(500).json({ message: "Database insertion failed", error: err.message });
        }
      })
      .on("error", (err) => {
        console.error("CSV parse error:", err);
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ message: "CSV parse error", error: err.message });
      });
  } catch (err) {
    console.error("Import error:", err);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ===============================
//   DYNAMIC SLOT GENERATION
//   -> GET /doctor-sessions/available-slots?doctorId=...&date=YYYY-MM-DD
// ===============================

// Parse "10:00 am" into Date on a given YYYY-MM-DD (keeps local time)
const parseTime = (timeStr, dateStr) => {
  if (!timeStr) return null;
  const d = new Date(dateStr.includes("T") ? dateStr : `${dateStr}T00:00:00`);
  const [time, modifier] = timeStr.split(" ");
  let [hours, minutes] = time.split(":");
  if (hours === "12") hours = "00";
  if (modifier && modifier.toLowerCase() === "pm") hours = parseInt(hours, 10) + 12;
  d.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
  return d;
};

// Format Date back to "10:00 am"
const formatTime = (date) =>
  date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase();

// FIX: use router, not app
router.get("/available-slots", async (req, res) => {
  try {
    const { doctorId, date } = req.query;
    if (!doctorId || !date) {
      return res.status(400).json({ message: "Missing parameters: doctorId and date are required" });
    }

    // Fetch doctor's session
    const session = await DoctorSessionModel.findOne({ doctorId });
    if (!session) return res.json([]);

    // Determine weekday names from date
    const inputDate = new Date(date.includes("T") ? date : `${date}T00:00:00`);
    const daysMap = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const longDay = daysMap[inputDate.getDay()];
    const shortDay = longDay.substring(0, 3);

    // Check if doctor works that day (supports "Tue" or "Tuesday")
    const isWorkingDay = (session.days || []).some((d) => {
      const clean = String(d || "").trim().toLowerCase();
      return clean === longDay.toLowerCase() || clean === shortDay.toLowerCase();
    });
    if (!isWorkingDay) return res.json([]);

    // Generate slot candidates from morning/evening ranges
    const allSlots = [];
    const interval = parseInt(session.timeSlotMinutes, 10) || 30;

    const ranges = [
      { start: session.morningStart, end: session.morningEnd },
      { start: session.eveningStart, end: session.eveningEnd },
    ];

    for (const range of ranges) {
      if (range.start && range.end && range.start !== "-" && range.end !== "-") {
        let current = parseTime(range.start, date);
        const endTime = parseTime(range.end, date);
        if (current && endTime && current < endTime) {
          while (current < endTime) {
            allSlots.push(formatTime(current));
            current.setMinutes(current.getMinutes() + interval);
          }
        }
      }
    }

    // Remove already booked times (non-cancelled)
    const bookedApps = await AppointmentModel.find({
      doctorId,
      date, // assume your Appointment.date stores YYYY-MM-DD
      status: { $ne: "cancelled" },
    }).select("time");

    const bookedTimes = bookedApps.map((a) => a.time);
    const available = allSlots.filter((slot) => !bookedTimes.includes(slot));

    return res.json(available);
  } catch (err) {
    console.error("Slot generation error:", err);
    res.status(500).json({ message: "Error generating slots", error: err.message });
  }
});

module.exports = router;

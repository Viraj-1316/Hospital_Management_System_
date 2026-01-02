const express = require("express");
const router = express.Router();
const fs = require("fs");
const csv = require("csv-parser");
const DoctorSessionModel = require("../models/DoctorSession");
const AppointmentModel = require("../models/Appointment");
const upload = require("../middleware/upload");
const { verifyToken } = require("../middleware/auth");

// ===============================
//   CRUD: Doctor Sessions
// ===============================

// Get all sessions -> GET /doctor-sessions
// Get all sessions -> GET /doctor-sessions
router.get("/", verifyToken, async (req, res) => {
  try {
    const query = {};
    let currentUser = null;
    let safeClinicId = null;

    if (req.user.role === 'admin') {
      currentUser = await require("../models/Admin").findById(req.user.id);
    } else {
      currentUser = await require("../models/User").findById(req.user.id);
    }

    if (currentUser) {
      safeClinicId = currentUser.clinicId;
    } else {
      safeClinicId = req.user.clinicId || null;
    }

    const effectiveRole = currentUser ? currentUser.role : req.user.role;

    if (effectiveRole === 'admin') {
      // Global View
    } else if (safeClinicId) {
      query.clinicId = safeClinicId;
    } else {
      return res.json([]);
    }

    const list = await DoctorSessionModel.find(query).sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    console.error("Error fetching doctor sessions:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Create session -> POST /doctor-sessions
router.post("/", verifyToken, async (req, res) => {
  try {
    const payload = {
      ...req.body,
      clinicId: req.user.clinicId
    };
    const doc = await DoctorSessionModel.create(payload);
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
//   CSV Import -> POST /doctor-sessions/import
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
// ===============================

// Parse "10:00 am" into Date object for a specific date string (YYYY-MM-DD)
// This explicitly uses the date parts to avoid UTC shifting issues.
const parseTime = (timeStr, dateStr) => {
  if (!timeStr) return null;

  // Split date "2025-11-28" -> [2025, 11, 28]
  const [y, m, d] = dateStr.split('-').map(Number);

  // Create date object at midnight local time
  const dateObj = new Date(y, m - 1, d); // Month is 0-indexed

  const [time, modifier] = timeStr.split(" ");
  let [hours, minutes] = time.split(":").map(Number);

  if (hours === 12) hours = 0;
  if (modifier && modifier.toLowerCase() === "pm") hours += 12;

  dateObj.setHours(hours, minutes, 0, 0);
  return dateObj;
};

// Format Date back to "10:00 am"
const formatTime = (date) =>
  date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase();

router.get("/available-slots", async (req, res) => {
  try {
    const { doctorId, date } = req.query; // date format: YYYY-MM-DD
    if (!doctorId || !date) {
      return res.status(400).json({ message: "Missing parameters: doctorId and date are required" });
    }

    // 1. Fetch doctor's session settings
    const session = await DoctorSessionModel.findOne({ doctorId });
    if (!session) return res.json([]); // No settings found = no slots

    // 2. Determine Day of Week reliably
    // Splitting ensures we treat the date as local YMD, avoiding UTC shifts
    const [y, m, d] = date.split('-').map(Number);
    const inputDate = new Date(y, m - 1, d);

    const daysMap = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const longDay = daysMap[inputDate.getDay()];
    const shortDay = longDay.substring(0, 3);

    // 3. Check if doctor works on this day
    const isWorkingDay = (session.days || []).some((day) => {
      const cleanDay = String(day || "").trim().toLowerCase();
      return cleanDay === longDay.toLowerCase() || cleanDay === shortDay.toLowerCase();
    });

    if (!isWorkingDay) return res.json([]); // Doctor off today

    // 4. Generate All Potential Slots
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
          // Loop until current time reaches end time
          while (current < endTime) {
            allSlots.push(formatTime(current));
            // Increment by interval
            current.setMinutes(current.getMinutes() + interval);
          }
        }
      }
    }

    // 5. Filter out Booked Slots
    // Important: Ensure AppointmentModel uses 'time' field like "10:00 am"
    const bookedApps = await AppointmentModel.find({
      doctorId,
      date, // Ensure this matches format stored in DB (String 'YYYY-MM-DD')
      status: { $ne: "cancelled" },
    }).select("time"); // Only need the time field

    const bookedTimes = bookedApps.map((a) => a.time?.toLowerCase()); // Normalize to lowercase for comparison

    const available = allSlots.filter((slot) => !bookedTimes.includes(slot));

    return res.json(available);

  } catch (err) {
    console.error("Slot generation error:", err);
    res.status(500).json({ message: "Error generating slots", error: err.message });
  }
});

module.exports = router;
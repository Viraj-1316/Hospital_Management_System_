const Holiday = require("../models/Holiday");
const Doctor = require("../models/Doctor");

exports.createHoliday = async (req, res) => {
  try {


    const { doctorId, fromDate, toDate } = req.body;
    if (!doctorId || !fromDate || !toDate) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const holiday = new Holiday({
      doctorId,
      scheduleOf: "doctor",
      name: `${doctor.firstName} ${doctor.lastName}`,
      doctorName: `${doctor.firstName} ${doctor.lastName}`,
      fromDate,
      toDate,
    });

    await holiday.save();

    res.status(201).json(holiday);

  } catch (err) {
    console.error("Error creating holiday:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};

exports.getHolidays = async (req, res) => {
  try {
    const holidays = await Holiday.find()
      .populate("doctorId", "firstName lastName")
      .sort({ autoId: 1 });

    res.status(200).json(holidays);
  } catch (err) {
    console.error("Error in getHolidays:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.updateHoliday = async (req, res) => {
  try {
    const updated = await Holiday.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ message: "Holiday not found" });
    }
    res.status(200).json(updated);
  } catch (err) {
    console.error("Error updating holiday:", err);
    res.status(400).json({ message: err.message });
  }
};

exports.deleteHoliday = async (req, res) => {
  try {
    const deleted = await Holiday.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Holiday not found" });
    }
    res.status(200).json({ message: "Holiday deleted successfully" });
  } catch (err) {
    console.error("Error deleting holiday:", err);
    res.status(500).json({ message: err.message });
  }
};

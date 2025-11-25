const EncounterModel = require("../models/Encounter");

// Create new encounter
exports.createEncounter = async (req, res) => {
  try {
    const { date, clinic, doctor, doctorId, patient, patientId, description, status } = req.body;

    const newEncounter = new EncounterModel({
      date,
      clinic,
      doctor,
      doctorId,
      patient,
      patientId,
      description,
      status: status || "active",
    });

    const savedEncounter = await newEncounter.save();
    res.status(201).json(savedEncounter);
  } catch (err) {
    console.error("Error creating encounter:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get all encounters
exports.getEncounters = async (req, res) => {
  try {
    const encounters = await EncounterModel.find().sort({ createdAt: -1 });
    res.json(encounters);
  } catch (err) {
    console.error("Error fetching encounters:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Delete encounter
exports.deleteEncounter = async (req, res) => {
  try {
    const { id } = req.params;
    await EncounterModel.findByIdAndDelete(id);
    res.json({ message: "Encounter deleted successfully" });
  } catch (err) {
    console.error("Error deleting encounter:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

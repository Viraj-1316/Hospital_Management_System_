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

// Get all encounters (with optional filtering)
exports.getEncounters = async (req, res) => {
  try {
    const { doctorId } = req.query;
    let query = {};
    
    if (doctorId) {
      query.doctorId = doctorId;
    }

    const encounters = await EncounterModel.find(query).sort({ createdAt: -1 });
    res.json(encounters);
  } catch (err) {
    console.error("Error fetching encounters:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Update encounter
exports.updateEncounter = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedEncounter = await EncounterModel.findByIdAndUpdate(id, req.body, { new: true });
    res.json(updatedEncounter);
  } catch (err) {
    console.error("Error updating encounter:", err);
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

// Add Medical Report
exports.addMedicalReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, date } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const newReport = {
      name,
      date,
      file: `/uploads/${file.filename}`,
      originalName: file.originalname
    };

    const updatedEncounter = await EncounterModel.findByIdAndUpdate(
      id,
      { $push: { medicalReports: newReport } },
      { new: true }
    );

    res.json(updatedEncounter);
  } catch (err) {
    console.error("Error adding medical report:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Delete Medical Report
exports.deleteMedicalReport = async (req, res) => {
  try {
    const { id, reportId } = req.params;

    const updatedEncounter = await EncounterModel.findByIdAndUpdate(
      id,
      { $pull: { medicalReports: { _id: reportId } } },
      { new: true }
    );

    res.json(updatedEncounter);
  } catch (err) {
    console.error("Error deleting medical report:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Update Medical Report
exports.updateMedicalReport = async (req, res) => {
  try {
    const { id, reportId } = req.params;
    const { name, date } = req.body;
    const file = req.file;

    const encounter = await EncounterModel.findById(id);
    if (!encounter) {
        return res.status(404).json({ message: "Encounter not found" });
    }

    const reportIndex = encounter.medicalReports.findIndex(r => r._id.toString() === reportId);
    if (reportIndex === -1) {
        return res.status(404).json({ message: "Report not found" });
    }

    encounter.medicalReports[reportIndex].name = name;
    encounter.medicalReports[reportIndex].date = date;
    
    if (file) {
        encounter.medicalReports[reportIndex].file = `/uploads/${file.filename}`;
        encounter.medicalReports[reportIndex].originalName = file.originalname;
    }

    await encounter.save();
    res.json(encounter);

  } catch (err) {
    console.error("Error updating medical report:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

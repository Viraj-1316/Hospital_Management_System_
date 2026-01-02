const EncounterTemplateModel = require("../models/EncounterTemplate");

// Create new template
exports.createTemplate = async (req, res) => {
  try {
    const { name } = req.body;
    const newTemplate = new EncounterTemplateModel({
      name,
      clinicId: req.user.clinicId, // Assign clinicId
      problems: [],
      observations: [],
      notes: [],
      prescriptions: []
    });
    const savedTemplate = await newTemplate.save();
    res.status(201).json(savedTemplate);
  } catch (err) {
    console.error("Error creating template:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get all templates
exports.getTemplates = async (req, res) => {
  try {
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
    const query = {};

    if (effectiveRole === "admin") {
      // Global View
    } else if (safeClinicId) {
      query.clinicId = safeClinicId;
    } else {
      return res.json([]);
    }

    const templates = await EncounterTemplateModel.find(query).sort({ createdAt: -1 });
    res.json(templates);
  } catch (err) {
    console.error("Error fetching templates:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get single template
exports.getTemplateById = async (req, res) => {
  try {
    const { id } = req.params;
    const template = await EncounterTemplateModel.findById(id);
    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }
    res.json(template);
  } catch (err) {
    console.error("Error fetching template:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Update template
exports.updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedTemplate = await EncounterTemplateModel.findByIdAndUpdate(id, req.body, { new: true });
    res.json(updatedTemplate);
  } catch (err) {
    console.error("Error updating template:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Delete template
exports.deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    await EncounterTemplateModel.findByIdAndDelete(id);
    res.json({ message: "Template deleted successfully" });
  } catch (err) {
    console.error("Error deleting template:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

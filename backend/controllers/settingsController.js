const AppointmentSetting = require("../models/AppointmentSetting");
const SmsTemplate = require("../models/SmsTemplate");

// ==========================================
// Appointment Settings
// ==========================================

exports.getAppointmentSettings = async (req, res) => {
    try {
        let settings = await AppointmentSetting.findOne();
        if (!settings) {
            // Create default if not exists
            settings = await AppointmentSetting.create({});
        }
        res.json(settings);
    } catch (err) {
        console.error("Error fetching appointment settings:", err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.updateAppointmentSettings = async (req, res) => {
    try {
        let settings = await AppointmentSetting.findOne();
        if (!settings) {
            settings = new AppointmentSetting(req.body);
        } else {
            Object.assign(settings, req.body);
        }
        await settings.save();
        res.json({ message: "Settings saved successfully", data: settings });
    } catch (err) {
        console.error("Error updating appointment settings:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// ==========================================
// SMS / WhatsApp Templates
// ==========================================

exports.getAllTemplates = async (req, res) => {
    try {
        const templates = await SmsTemplate.find();
        res.json(templates);
    } catch (err) {
        console.error("Error fetching templates:", err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.updateTemplate = async (req, res) => {
    try {
        const { templateId } = req.params;
        const { body } = req.body;

        const template = await SmsTemplate.findOne({ templateId });
        if (!template) {
            // If template doesn't exist in DB (maybe first time override from hardcoded frontend defaults), create it?
            // Ideally, we should seed them, but for now let's allow creating if missing but with restricted fields.
            return res.status(404).json({ message: "Template not found" });
        }

        template.body = body;
        await template.save();

        res.json({ message: "Template updated successfully", data: template });
    } catch (err) {
        console.error("Error updating template:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// Bulk create/update (Seeding initial templates if needed from frontend)
exports.seedTemplates = async (req, res) => {
    try {
        const { templates } = req.body; // Array of template objects
        if (!Array.isArray(templates)) {
            return res.status(400).json({ message: "Invalid input" });
        }

        const operations = templates.map(t => ({
            updateOne: {
                filter: { templateId: t.templateId },
                update: { $set: t },
                upsert: true
            }
        }));

        await SmsTemplate.bulkWrite(operations);
        res.json({ message: "Templates synced successfully" });
    } catch (err) {
        console.error("Error seeding templates:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// ==========================================
// Pro Settings (Twilio SMS/WhatsApp)
// ==========================================
const ProSetting = require("../models/ProSetting");

// Token mask constant for sensitive data
const TOKEN_MASK = "••••••••";

exports.getProSettings = async (req, res) => {
    try {
        let settings = await ProSetting.findOne();
        if (!settings) {
            settings = await ProSetting.create({});
        }
        // Mask sensitive tokens for response
        const masked = settings.toObject();
        if (masked.smsToken) masked.smsToken = TOKEN_MASK;
        if (masked.whatsappToken) masked.whatsappToken = TOKEN_MASK;
        res.json(masked);
    } catch (err) {
        console.error("Error fetching pro settings:", err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.updateProSettings = async (req, res) => {
    try {
        let settings = await ProSetting.findOne();
        if (!settings) {
            settings = new ProSetting(req.body);
        } else {
            // Only update if a new token is provided (not masked placeholder)
            const update = { ...req.body };
            if (update.smsToken === TOKEN_MASK) delete update.smsToken;
            if (update.whatsappToken === TOKEN_MASK) delete update.whatsappToken;
            Object.assign(settings, update);
        }
        await settings.save();
        res.json({ message: "Pro settings saved successfully", data: settings });
    } catch (err) {
        console.error("Error updating pro settings:", err);
        res.status(500).json({ message: "Server error" });
    }
};

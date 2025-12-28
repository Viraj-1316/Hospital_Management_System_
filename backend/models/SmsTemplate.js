const mongoose = require("mongoose");

const smsTemplateSchema = new mongoose.Schema({
    templateId: {
        type: String,
        required: true,
        unique: true, // e.g., 'clinic_admin_reg', 'new_appt_clinic'
    },
    category: {
        type: String, // 'clinic', 'doctor', 'patient', 'common', 'receptionist'
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    body: {
        type: String,
        required: true,
    },
    keys: {
        type: [String], // Array of available dynamic keys e.g. ["{{user_name}}"]
        default: [],
    },
    isActive: {
        type: Boolean,
        default: true,
    }
}, { timestamps: true });

const SmsTemplate = mongoose.model("SmsTemplate", smsTemplateSchema);

module.exports = SmsTemplate;

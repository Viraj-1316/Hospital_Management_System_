const mongoose = require("mongoose");

const appointmentSettingSchema = new mongoose.Schema({
    bookingOpenBefore: {
        type: Number,
        default: 365,
    },
    bookingCloseBefore: {
        type: Number,
        default: 0,
    },
    allowSameDay: {
        type: Boolean,
        default: false,
    },
    emailReminder: {
        type: Boolean,
        default: false,
    },
    smsReminder: {
        type: Boolean,
        default: false,
    },
    whatsappReminder: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

// We expect only one document for settings, typically.
const AppointmentSetting = mongoose.model("AppointmentSetting", appointmentSettingSchema);

module.exports = AppointmentSetting;

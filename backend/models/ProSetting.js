const mongoose = require("mongoose");

const ProSettingSchema = new mongoose.Schema(
  {
    // SMS Configuration (Twilio)
    smsEnabled: { type: Boolean, default: false },
    smsSid: { type: String, default: "" },
    smsToken: { type: String, default: "" },
    smsPhone: { type: String, default: "" },

    // WhatsApp Configuration (Twilio)
    whatsappEnabled: { type: Boolean, default: false },
    whatsappSid: { type: String, default: "" },
    whatsappToken: { type: String, default: "" },
    whatsappPhone: { type: String, default: "" },

    // Copyright Text
    copyrightText: { type: String, default: "OneCare © 2024. All rights reserved." },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProSetting", ProSettingSchema);

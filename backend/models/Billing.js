const mongoose = require("mongoose");

const BillingSchema = new mongoose.Schema(
  {
    // Sequential bill number with prefix (e.g., OC-000001)
    // Changed from Number to String to support prefixes
    billNumber: {
      type: String,
      required: true,
      unique: true
    },

    // ObjectId references for proper population
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: false // Allow bills without linked patient
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: false // Allow bills without linked doctor
    },
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      required: false
    },
    encounterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Encounter",
      required: false,
      default: null
    },

    // Denormalized names for display (fallback if population fails)
    doctorName: { type: String, required: false, default: "" },
    clinicName: { type: String, required: false, default: "" },
    patientName: { type: String, required: false, default: "" },

    // Enhanced services with category and description
    services: [{
      name: { type: String },
      description: { type: String, default: "" },  // e.g., "Includes Laboratory Testing 1"
      category: { type: String, default: "" },     // e.g., "Laboratory", "Consultation"
      amount: { type: Number, default: 0 }
    }],

    // Amounts
    subTotal: { type: Number, default: 0 },        // Sum before discount/tax
    totalAmount: { type: Number, required: true }, // Final amount after discount+tax
    discount: { type: Number, default: 0 },
    
    // Tax details for GST breakdown
    taxDetails: [{
      name: { type: String },       // e.g., "GST", "CGST", "SGST"
      rate: { type: Number },       // e.g., 0 for 0%, 18 for 18%
      amount: { type: Number }      // calculated tax amount
    }],
    taxAmount: { type: Number, default: 0 },       // Total tax amount
    
    amountDue: { type: Number, required: true },   // Amount remaining to be paid
    paidAmount: { type: Number, default: 0 },      // Amount already paid

    status: {
      type: String,
      enum: ["unpaid", "paid", "partial", "cancelled"],
      default: "unpaid"
    },

    // Date and time of bill
    date: { type: Date, required: true, default: Date.now },
    time: { type: String, default: "" },  // e.g., "05:20 PM"

    notes: { type: String, default: "" },
    
    // Payment Mode (for Razorpay integration)
    paymentMethod: { 
      type: String, 
      enum: ["", "Cash", "Online"],
      default: "" 
    },
    
    // Razorpay payment tracking
    razorpayOrderId: { type: String, default: "" },
    razorpayPaymentId: { type: String, default: "" },
    onlinePaymentDate: { type: Date, default: null },  // Timestamp when online payment was completed

    // Verification URL for QR code (auto-generated on save)
    verificationUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

// Pre-save hook to auto-generate verification URL
BillingSchema.pre('save', function(next) {
  if (!this.verificationUrl && this.billNumber) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    this.verificationUrl = `${frontendUrl}/verify/bill/${this._id}`;
  }
  next();
});

// Index for common queries
BillingSchema.index({ patientId: 1 });
BillingSchema.index({ doctorId: 1 });
BillingSchema.index({ clinicId: 1 });
BillingSchema.index({ date: -1 });
BillingSchema.index({ status: 1 });


module.exports = mongoose.model("Billing", BillingSchema);

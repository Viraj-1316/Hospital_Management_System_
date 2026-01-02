// routes/approvalRoutes.js
const express = require("express");
const router = express.Router();
const DoctorModel = require("../models/Doctor");
const Receptionist = require("../models/Receptionist");
const Clinic = require("../models/Clinic");
const { sendEmail } = require("../utils/emailService");
const { staffApprovedTemplate, staffRejectedTemplate } = require("../utils/emailTemplates");
const { verifyToken, requireRole } = require("../middleware/auth");

// Clinic admin can approve/reject staff - allow clinic_admin and admin roles
const clinicAdminAuth = requireRole("clinic_admin", "admin");

// Get all pending approval requests for a clinic
// GET /api/approvals/pending
const mongoose = require("mongoose");
// ... imports

// ...

router.get("/pending", verifyToken, clinicAdminAuth, async (req, res) => {
    try {
        const { clinicId } = req.user;

        if (!clinicId) {
            return res.status(400).json({ success: false, message: "Clinic ID not found in user session" });
        }

        let clinic;
        // Try finding by ObjectId
        if (mongoose.Types.ObjectId.isValid(clinicId)) {
            clinic = await Clinic.findById(clinicId);
        }

        // Fallback: try finding by hospitalId string
        if (!clinic) {
            clinic = await Clinic.findOne({ hospitalId: clinicId });
        }

        if (!clinic) {
            console.error("Clinic not found for ID:", clinicId);
            return res.status(404).json({ success: false, message: "Clinic not found" });
        }

        const realClinicId = clinic._id;
        console.log(`Resolved Clinic: ${clinic.name} (${realClinicId}) from input: ${clinicId}`);

        // Find pending doctors using the resolved canonical ObjectId
        const pendingDoctors = await DoctorModel.find({
            clinicId: realClinicId,
            approvalStatus: "pending"
        }).select("firstName lastName email phone createdAt");

        console.log("Pending Doctors Found:", pendingDoctors.length);

        // Find pending receptionists
        const pendingReceptionists = await Receptionist.find({
            clinicIds: realClinicId,
            approvalStatus: "pending"
        }).select("name email mobile createdAt");

        console.log("Pending Receptionists Found:", pendingReceptionists.length);

        // Format the response
        const pendingRequests = [
            ...pendingDoctors.map(doc => ({
                _id: doc._id,
                name: `${doc.firstName} ${doc.lastName}`,
                email: doc.email,
                phone: doc.phone,
                role: "doctor",
                createdAt: doc.createdAt
            })),
            ...pendingReceptionists.map(rec => ({
                _id: rec._id,
                name: rec.name,
                email: rec.email,
                phone: rec.mobile,
                role: "receptionist",
                createdAt: rec.createdAt
            }))
        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return res.json({
            success: true,
            pendingRequests,
            clinicName: clinic?.name || "Unknown Clinic"
        });
    } catch (error) {
        console.error("Error fetching pending approvals:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
});

// Approve a doctor/staff registration
// PUT /api/approvals/:id/approve
router.put("/:id/approve", verifyToken, clinicAdminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body; // 'doctor' or 'receptionist'
        const { clinicId } = req.user;

        if (!role || !['doctor', 'receptionist'].includes(role)) {
            return res.status(400).json({ success: false, message: "Valid role is required (doctor or receptionist)" });
        }

        let clinic;
        if (mongoose.Types.ObjectId.isValid(clinicId)) {
            clinic = await Clinic.findById(clinicId);
        }
        if (!clinic) {
            clinic = await Clinic.findOne({ hospitalId: clinicId });
        }

        if (!clinic) {
            return res.status(404).json({ success: false, message: "Clinic not found" });
        }
        const realClinicId = clinic._id;

        let staff;
        let staffName;

        if (role === "doctor") {
            staff = await DoctorModel.findOneAndUpdate(
                { _id: id, clinicId: realClinicId, approvalStatus: "pending" },
                { approvalStatus: "approved" },
                { new: true }
            );
            staffName = staff ? `${staff.firstName} ${staff.lastName}` : null;
        } else {
            staff = await Receptionist.findOneAndUpdate(
                { _id: id, clinicIds: realClinicId, approvalStatus: "pending" },
                { approvalStatus: "approved" },
                { new: true }
            );
            staffName = staff?.name;
        }

        if (!staff) {
            return res.status(404).json({ success: false, message: "Pending request not found or already processed" });
        }

        // Send approval email
        if (staff.email) {
            sendEmail({
                to: staff.email,
                subject: "Registration Approved - OneCare",
                html: staffApprovedTemplate({
                    staffName: staffName,
                    clinicName: clinic?.name || "your clinic"
                })
            });
        }

        return res.json({
            success: true,
            message: `${staffName} has been approved successfully`,
        });
    } catch (error) {
        console.error("Error approving staff:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
});

// Reject a doctor/staff registration
// PUT /api/approvals/:id/reject
router.put("/:id/reject", verifyToken, clinicAdminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body; // 'doctor' or 'receptionist'
        const { clinicId } = req.user;

        if (!role || !['doctor', 'receptionist'].includes(role)) {
            return res.status(400).json({ success: false, message: "Valid role is required (doctor or receptionist)" });
        }

        let clinic;
        if (mongoose.Types.ObjectId.isValid(clinicId)) {
            clinic = await Clinic.findById(clinicId);
        }
        if (!clinic) {
            clinic = await Clinic.findOne({ hospitalId: clinicId });
        }

        if (!clinic) {
            return res.status(404).json({ success: false, message: "Clinic not found" });
        }
        const realClinicId = clinic._id;

        let staff;
        let staffName;

        if (role === "doctor") {
            staff = await DoctorModel.findOneAndUpdate(
                { _id: id, clinicId: realClinicId, approvalStatus: "pending" },
                { approvalStatus: "rejected" },
                { new: true }
            );
            staffName = staff ? `${staff.firstName} ${staff.lastName}` : null;
        } else {
            staff = await Receptionist.findOneAndUpdate(
                { _id: id, clinicIds: realClinicId, approvalStatus: "pending" },
                { approvalStatus: "rejected" },
                { new: true }
            );
            staffName = staff?.name;
        }

        if (!staff) {
            return res.status(404).json({ success: false, message: "Pending request not found or already processed" });
        }

        // Send rejection email
        if (staff.email) {
            sendEmail({
                to: staff.email,
                subject: "Registration Request Update - OneCare",
                html: staffRejectedTemplate({
                    staffName: staffName,
                    clinicName: clinic?.name || "your clinic"
                })
            });
        }

        return res.json({
            success: true,
            message: `${staffName}'s request has been rejected`,
        });
    } catch (error) {
        console.error("Error rejecting staff:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
});

module.exports = router;

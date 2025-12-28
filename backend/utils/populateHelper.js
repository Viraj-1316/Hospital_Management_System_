
// Standard population configuration for Patient references
const patientPopulate = {
    path: "patientId",
    select: "firstName lastName email phone",
    model: "Patient"
};

// Standard population configuration for Doctor references
const doctorPopulate = {
    path: "doctorId",
    select: "name clinic firstName lastName email phone",
    model: "Doctor"
};

// Standard population configuration for Clinic references
const clinicPopulate = {
    path: "clinicId",
    select: "name address",
    model: "Clinic"
};

/**
 * Apply standard populations to a Mongoose query for appointments/bills
 * @param {Object} query - Mongoose query object
 * @returns {Object} - Query with populations applied
 */
const applyStandardPopulations = (query) => {
    return query
        .populate(patientPopulate)
        .populate(doctorPopulate);
};

/**
 * Apply all populations including clinic to a Mongoose query
 * @param {Object} query - Mongoose query object
 * @returns {Object} - Query with all populations applied
 */
const applyFullPopulations = (query) => {
    return query
        .populate(patientPopulate)
        .populate(doctorPopulate)
        .populate(clinicPopulate);
};

/**
 * Normalize patient data from populated document or fallback fields
 * @param {Object} doc - Document with patientId reference
 * @returns {Object} - Normalized patient info
 */
const normalizePatientInfo = (doc) => {
    if (doc.patientId && typeof doc.patientId === "object") {
        const p = doc.patientId;
        return {
            name: `${p.firstName || ""} ${p.lastName || ""}`.trim() || p.name || "N/A",
            email: p.email || "N/A",
            phone: p.phone || "N/A"
        };
    }
    return {
        name: doc.patientName || "N/A",
        email: doc.patientEmail || "N/A",
        phone: doc.patientPhone || "N/A"
    };
};

/**
 * Normalize doctor data from populated document or fallback fields
 * @param {Object} doc - Document with doctorId reference
 * @returns {Object} - Normalized doctor info
 */
const normalizeDoctorInfo = (doc) => {
    if (doc.doctorId && typeof doc.doctorId === "object") {
        const d = doc.doctorId;
        return {
            name: d.name || `${d.firstName || ""} ${d.lastName || ""}`.trim() || "N/A",
            clinic: d.clinic || doc.clinic || "N/A"
        };
    }
    return {
        name: doc.doctorName || "N/A",
        clinic: doc.clinic || "N/A"
    };
};

/**
 * Normalize a complete document (appointment or bill) with patient and doctor data
 * @param {Object} doc - Document to normalize
 * @returns {Object} - Document with normalized data
 */
const normalizeDocument = (doc) => {
    const copy = { ...doc };

    // Normalize patient data
    if (copy.patientId && typeof copy.patientId === "object") {
        const p = copy.patientId;
        copy.patientName = copy.patientName || `${p.firstName || ""} ${p.lastName || ""}`.trim() || p.name || "";
        copy.patientEmail = copy.patientEmail || p.email || "";
        copy.patientPhone = copy.patientPhone || p.phone || "";
    }

    // Normalize doctor data
    if (copy.doctorId && typeof copy.doctorId === "object") {
        const d = copy.doctorId;
        const docName = d.name || `${d.firstName || ""} ${d.lastName || ""}`.trim();
        copy.doctorName = copy.doctorName || docName || "";
        copy.clinic = copy.clinic || d.clinic || copy.clinic;
    }

    // Normalize clinic data
    if (copy.clinicId && typeof copy.clinicId === "object") {
        copy.clinicName = copy.clinicName || copy.clinicId.name || "";
    }

    return copy;
};

/**
 * Normalize an array of documents
 * @param {Array} docs - Array of documents
 * @returns {Array} - Array of normalized documents
 */
const normalizeDocuments = (docs) => {
    return docs.map(normalizeDocument);
};

module.exports = {
    // Population configurations
    patientPopulate,
    doctorPopulate,
    clinicPopulate,

    // Query helpers
    applyStandardPopulations,
    applyFullPopulations,

    // Normalization helpers
    normalizePatientInfo,
    normalizeDoctorInfo,
    normalizeDocument,
    normalizeDocuments
};

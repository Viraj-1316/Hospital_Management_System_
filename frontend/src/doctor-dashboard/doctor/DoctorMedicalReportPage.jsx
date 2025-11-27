import React from "react";
import DoctorLayout from "../layouts/DoctorLayout";
import MedicalReport from "../../components/Encounter/MedicalReport";

export default function DoctorMedicalReportPage() {
  return (
    <DoctorLayout>
      <MedicalReport role="doctor" />
    </DoctorLayout>
  );
}

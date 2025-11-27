import React from "react";
import DoctorLayout from "../layouts/DoctorLayout";
import SharedEncounterTemplateDetails from "../../components/Encounter/SharedEncounterTemplateDetails";

export default function DoctorEncounterTemplateDetails() {
  return (
    <DoctorLayout>
      <SharedEncounterTemplateDetails role="doctor" />
    </DoctorLayout>
  );
}

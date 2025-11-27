import React from "react";
import DoctorLayout from "../layouts/DoctorLayout";
import SharedEncounterTemplateList from "../../components/Encounter/SharedEncounterTemplateList";

export default function DoctorEncounterTemplateList() {
  return (
    <DoctorLayout>
      <SharedEncounterTemplateList role="doctor" />
    </DoctorLayout>
  );
}

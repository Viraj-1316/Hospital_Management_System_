import React from "react";
import DoctorLayout from "../layouts/DoctorLayout";
import SharedEncounterDetails from "../../components/Encounter/SharedEncounterDetails";

export default function DoctorEncounterDetails() {
  return (
    <DoctorLayout>
      <SharedEncounterDetails role="doctor" />
    </DoctorLayout>
  );
}

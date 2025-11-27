import React, { useState, useEffect } from "react";
import DoctorLayout from "../layouts/DoctorLayout";
import SharedEncounterList from "../../components/Encounter/SharedEncounterList";

export default function DoctorEncounterList() {
  const [doctorId, setDoctorId] = useState(null);

  useEffect(() => {
    const doctorStr = localStorage.getItem("doctor");
    if (doctorStr) {
      try {
        const doctor = JSON.parse(doctorStr);
        setDoctorId(doctor._id || doctor.id);
      } catch (e) {
        console.error("Error parsing doctor from local storage", e);
      }
    }
  }, []);

  return (
    <DoctorLayout>
      <SharedEncounterList role="doctor" doctorId={doctorId} />
    </DoctorLayout>
  );
}

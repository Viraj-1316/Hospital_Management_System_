import React, { useEffect, useState } from "react";
import DoctorLayout from "../layouts/DoctorLayout";
import SharedServices from "../../components/Shared/SharedServices";

/* ---------- Main Doctor Services Component ---------- */
export default function DoctorServices() {
  const [currentDoctor, setCurrentDoctor] = useState({ firstName: "", lastName: "", clinic: "" });

  useEffect(() => {
    const stored = localStorage.getItem("doctor");
    if (stored) {
      setCurrentDoctor(JSON.parse(stored));
    }
  }, []);

  return (
    <DoctorLayout>
      {/* Pass isDoctor=true and the doctor info */}
      <SharedServices isDoctor={true} doctorInfo={currentDoctor} />
    </DoctorLayout>
  );
}
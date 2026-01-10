import React, { useEffect, useState } from "react";
import DoctorLayout from "../layouts/DoctorLayout";
import SharedServices from "../../components/Shared/SharedServices";

/* ---------- Main Doctor Services Component ---------- */
export default function DoctorServices() {
  const [currentDoctor, setCurrentDoctor] = useState({ firstName: "", lastName: "", clinic: "" });

  useEffect(() => {
    const stored = localStorage.getItem("doctor");
    if (stored) {
      const doctorData = JSON.parse(stored);

      // Check if clinic info is missing and try to get from authUser
      if (!doctorData.clinic) {
        const authUser = localStorage.getItem("authUser");
        if (authUser) {
          try {
            const authData = JSON.parse(authUser);
            if (authData.clinicName) {
              doctorData.clinic = authData.clinicName;
            }
          } catch (e) {
            console.error("Error parsing authUser", e);
          }
        }
      }

      setCurrentDoctor(doctorData);
    }
  }, []);

  return (
    <DoctorLayout>
      {/* Pass isDoctor=true and the doctor info */}
      <SharedServices isDoctor={true} doctorInfo={currentDoctor} />
    </DoctorLayout>
  );
}
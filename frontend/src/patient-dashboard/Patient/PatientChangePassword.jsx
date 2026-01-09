import React from "react";
import PatientLayout from "../layouts/PatientLayout";
import ChangePasswordForm from "../../common/ChangePasswordForm";

const PatientChangePassword = () => {
  return (
    <PatientLayout>
      <div className="container-fluid py-5">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <ChangePasswordForm />
          </div>
        </div>
      </div>
    </PatientLayout>
  );
};

export default PatientChangePassword;

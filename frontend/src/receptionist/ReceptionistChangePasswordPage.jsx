import React from "react";
import ReceptionistLayout from "./layouts/ReceptionistLayout";
import ChangePasswordForm from "../common/ChangePasswordForm";

const ReceptionistChangePasswordPage = () => {
  return (
    <ReceptionistLayout>
      <div className="container-fluid py-5">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <ChangePasswordForm />
          </div>
        </div>
      </div>
    </ReceptionistLayout>
  );
};

export default ReceptionistChangePasswordPage;

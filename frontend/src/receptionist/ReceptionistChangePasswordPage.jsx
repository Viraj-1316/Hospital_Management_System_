import React from "react";
import ReceptionLayout from "./layouts/ReceptionLayout";
import ChangePasswordForm from "../common/ChangePasswordForm";

const ReceptionistChangePasswordPage = () => {
  return (
    <ReceptionLayout>
      <div className="container-fluid py-5">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <ChangePasswordForm />
          </div>
        </div>
      </div>
    </ReceptionLayout>
  );
};

export default ReceptionistChangePasswordPage;

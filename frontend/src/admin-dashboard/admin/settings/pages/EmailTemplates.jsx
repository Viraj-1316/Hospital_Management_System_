import React, { useState } from "react";
import { Accordion, Button, Form, Card, Modal } from "react-bootstrap";
import toast from "react-hot-toast";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { FaCheckSquare, FaSave, FaPaperPlane } from "react-icons/fa";
import API_BASE from "../../../../config";

const EmailTemplates = () => {
  // Mock data for categories and templates
  const templateCategories = [
    {
      id: "clinic",
      title: "Clinic Templates",
      templates: [
        {
          id: "clinic_admin_reg",
          title: "Clinic Admin registration notification to user",
          subject: "Clinic Admin Registration",
          body: `
            <p>Welcome to Clinic,</p>
            <p>You are successfully registered as clinic admin</p>
            <p>Your email: {{user_email}}, username: {{user_name}} and password: {{user_password}}</p>
            <p>Thank you.</p>
          `,
          keys: ["{{user_email}}", "{{user_name}}", "{{user_password}}", "{{login_url}}", "{{current_date}}", "{{current_date_time}}"],
        },
        {
          id: "new_appt_clinic",
          title: "New Appointment Notification to Clinic",
          subject: "Clinic Booked Appointment Template",
          body: `
            <p>New appointment</p>
            <p>New appointment Book on {{current_date}}</p>
            <p>For Date: {{appointment_date}} , Time : {{appointment_time}} , Patient : {{patient_name}} , Doctor : {{doctor_name}}</p>
            <p>Thank you.</p>
          `,
          keys: [
            "{{appointment_date}}",
            "{{appointment_time}}",
            "{{service_name}}",
            "{{patient_name}}",
            "{{patient_email}}",
            "{{patient_contact_number}}",
            "{{doctor_name}}",
            "{{doctor_email}}",
            "{{doctor_contact_number}}",
            "{{current_date}}",
            "{{current_date_time}}"
          ],
        },
      ],
    },
    {
      id: "common",
      title: "Common Templates",
      templates: [
        {
          id: "resend_creds",
          title: "Resend user credentials",
          subject: "Resend user credentials",
          body: `
            <p>Welcome to OneCare ,</p>
            <p>Your kivicare account user credential</p>
            <p>Your email: {{user_email}} , username: {{user_name}} and password: {{user_password}}</p>
            <p>Thank you.</p>
          `,
          keys: ["{{user_email}}", "{{user_name}}", "{{user_password}}", "{{login_url}}", "{{current_date}}", "{{current_date_time}}"],
        },
        {
          id: "user_verified",
          title: "User Verified Acknowledgement notification Template",
          subject: "User Verified By Admin",
          body: `
            <p>Your Account Has been Verified By admin On Date: {{current_date}}</p>
            <p>Login Page: {{login_url}}</p>
            <p>Thank you.</p>
          `,
          keys: ["{{current_date}}", "{{login_url}}"],
        },
        {
          id: "new_admin_user",
          title: "New Admin User Registration Notification",
          subject: "New User Register On site",
          body: `
            <p>New User Register On site {{site_url}} On Date: {{current_date}}</p>
            <p>Name : {{user_name}}</p>
            <p>Email :{{user_email}}</p>
            <p>Contact No :{{user_contact}}</p>
            <p>User Role :{{user_role}}</p>
            <p>Thank you.</p>
          `,
          keys: ["{{site_url}}", "{{current_date}}", "{{user_name}}", "{{user_email}}", "{{user_contact}}", "{{user_role}}"],
        },
        {
          id: "payment_pending",
          title: "Payment pending notification to user template",
          subject: "Appointment Payment Pending Template",
          body: `
            <p>Appointment Payment ,</p>
            <p>Your Appointment is cancelled due to pending payment</p>
            <p>Thank you.</p>
          `,
          keys: ["{{current_date}}", "{{current_date_time}}"],
        },
        {
          id: "patient_invoice",
          title: "Patient Invoice Template",
          subject: "Patient Invoice",
          body: `
            <p>Welcome to OneCare ,</p>
            <p>Find your Invoice in attachment</p>
            <p>Thank you.</p>
          `,
          keys: ["{{patient_name}}", "{{invoice_url}}"],
        },
      ],
    },
    {
      id: "doctor",
      title: "Doctor Templates",
      templates: [
        {
          id: "doctor_registration",
          title: "Kivicare Doctor Registration",
          subject: "Doctor Registration Template",
          body: `
            <p>Welcome to OneCare ,</p>
            <p>You are successfully registered with</p>
            <p>Your email: {{user_email}} , username: {{user_name}} and password: {{user_password}}</p>
            <p>Thank you.</p>
          `,
          keys: ["{{user_email}}", "{{user_name}}", "{{user_password}}", "{{login_url}}", "{{current_date}}", "{{current_date_time}}"],
        },
        {
          id: "new_appt_doctor",
          title: "New Appointment Notification to Doctor Template",
          subject: "Doctor Booked Appointment Template",
          body: `
            <p>New appointment</p>
            <p>Your have new appointment on</p>
            <p>Date: {{appointment_date}} , Time : {{appointment_time}} ,Patient : {{patient_name}}</p>
            <p>Thank you.</p>
          `,
          keys: [
            "{{appointment_date}}",
            "{{appointment_time}}",
            "{{service_name}}",
            "{{patient_name}}",
            "{{patient_email}}",
            "{{clinic_name}}",
            "{{clinic_email}}",
            "{{clinic_contact_number}}",
            "{{clinic_address}}",
            "{{current_date}}",
            "{{current_date_time}}"
          ],
        },
        {
          id: "zoom_appt_doctor",
          title: "New Zoom video appointment notification to doctor template",
          subject: "Doctor Zoom Video Conference appointment Template",
          body: `
            <p>Zoom video conference</p>
            <p>Your have new appointment on</p>
            <p>Date: {{appointment_date}} , Time : {{appointment_time}} ,Patient : {{patient_name}} , Zoom Link : {{add_doctor_zoom_link}}</p>
            <p>Thank you.</p>
          `,
          keys: [
            "{{appointment_date}}",
            "{{appointment_time}}",
            "{{add_doctor_zoom_link}}",
            "{{patient_name}}",
            "{{patient_email}}",
            "{{patient_contact_number}}",
            "{{clinic_name}}",
            "{{clinic_email}}",
            "{{clinic_contact_number}}",
            "{{clinic_address}}",
            "{{current_date}}",
            "{{current_date_time}}"
          ],
        },
        {
          id: "google_meet_doctor",
          title: "New Google Meet video appointment notification to doctor template",
          subject: "Doctor Google Meet Video Conference appointment Template",
          body: `
            <p>Google Meet conference</p>
            <p>Your have new appointment on</p>
            <p>Date: {{appointment_date}} , Time : {{appointment_time}} ,Patient : {{patient_name}} , Google Meet Link : {{meet_link}}</p>
            <p>Event Link {{meet_event_link}}</p>
            <p>Thank you.</p>
          `,
          keys: [
            "{{appointment_date}}",
            "{{appointment_time}}",
            "{{meet_link}}",
            "{{meet_event_link}}",
            "{{clinic_name}}",
            "{{clinic_email}}",
            "{{clinic_contact_number}}",
            "{{clinic_address}}",
            "{{patient_name}}",
            "{{patient_email}}",
            "{{patient_contact_number}}",
            "{{current_date}}",
            "{{current_date_time}}"
          ],
        },
        {
          id: "patient_reminder_doctor",
          title: "Patient Appointment Reminder Notification Template for Doctor",
          subject: "Doctor Appointment Reminder",
          body: `
            <p>Welcome to OneCare ,</p>
            <p>You Have appointment  on</p>
            <p>{{appointment_date}} , Time : {{appointment_time}} , Patient : {{patient_name}}</p>
            <p>Thank you.</p>
          `,
          keys: [
            "{{appointment_date}}",
            "{{appointment_time}}",
            "{{clinic_name}}",
            "{{clinic_email}}",
            "{{clinic_contact_number}}",
            "{{clinic_address}}",
            "{{doctor_name}}",
            "{{doctor_email}}",
            "{{patient_name}}",
            "{{doctor_contact_number}}",
            "{{current_date}}",
            "{{current_date_time}}"
          ],
        },
      ],
    },
    {
      id: "patient",
      title: "Patient Templates",
      templates: [
        {
          id: "patient_registration",
          title: "Registration Notification to Patient template",
          subject: "Patient Registration Template",
          body: `
            <p>Welcome to OneCare ,</p>
            <p>Your registration process with {{user_email}} is successfully completed, and your password is  {{user_password}}</p>
            <p>Thank you.</p>
          `,
          keys: ["{{user_email}}", "{{user_password}}", "{{login_url}}", "{{widgets_login_url}}", "{{current_date}}", "{{current_date_time}}", "{{appointment_page_url}}"],
        },
        {
          id: "allow_cancel_appt",
          title: "Allow Cancel appointments",
          subject: "Cancel appointment",
          body: `
            <p>Welcome to OneCare ,</p>
            <p>Your appointment Booking is cancel.</p>
            <p>Date: {{appointment_date}} , Time : {{appointment_time}}</p>
            <p>Clinic: {{clinic_name}} Doctor: {{doctor_name}}</p>
            <p>Thank you.</p>
          `,
          keys: [
            "{{appointment_date}}",
            "{{appointment_time}}",
            "{{clinic_name}}",
            "{{clinic_email}}",
            "{{clinic_contact_number}}",
            "{{clinic_address}}",
            "{{doctor_name}}",
            "{{doctor_email}}",
            "{{doctor_contact_number}}",
            "{{current_date}}",
            "{{current_date_time}}"
          ],
        },
        {
          id: "video_conf_appt_patient",
          title: "Video conference appointment booking notification template",
          subject: "Video Conference appointment Template",
          body: `
            <p>Zoom video conference</p>
            <p>Your have new appointment on</p>
            <p>Date: {{appointment_date}} , Time : {{appointment_time}} ,Doctor : {{doctor_name}} , Zoom Link : {{zoom_link}}</p>
            <p>Thank you.</p>
          `,
          keys: [
            "{{appointment_date}}",
            "{{appointment_time}}",
            "{{zoom_link}}",
            "{{clinic_name}}",
            "{{clinic_email}}",
            "{{clinic_contact_number}}",
            "{{clinic_address}}",
            "{{doctor_name}}",
            "{{doctor_email}}",
            "{{doctor_contact_number}}",
            "{{current_date}}",
            "{{current_date_time}}"
          ],
        },
        {
          id: "patient_appt_reminder",
          title: "Patient Appointment Reminder Notification Template",
          subject: "Patient Appointment Reminder",
          body: `
            <p>Welcome to OneCare ,</p>
            <p>You Have appointment  on</p>
            <p>{{appointment_date}} , Time : {{appointment_time}}</p>
            <p>Thank you.</p>
          `,
          keys: [
            "{{appointment_date}}",
            "{{appointment_time}}",
            "{{clinic_name}}",
            "{{clinic_email}}",
            "{{clinic_contact_number}}",
            "{{clinic_address}}",
            "{{doctor_name}}",
            "{{doctor_email}}",
            "{{doctor_contact_number}}",
            "{{current_date}}",
            "{{current_date_time}}"
          ],
        },
        {
          id: "google_meet_patient",
          title: "New Google Meet video appointment email to patient template",
          subject: "Google Meet Video Conference appointment Template",
          body: `
            <p>Google Meet conference</p>
            <p>Your have new appointment on</p>
            <p>Date: {{appointment_date}} , Time : {{appointment_time}} ,Doctor : {{doctor_name}} , Google Meet Link : {{meet_link}}</p>
            <p>Event Link {{meet_event_link}}</p>
            <p>Thank you.</p>
          `,
          keys: [
            "{{appointment_date}}",
            "{{appointment_time}}",
            "{{patient_name}}",
            "{{meet_link}}",
            "{{meet_event_link}}",
            "{{clinic_name}}",
            "{{clinic_email}}",
            "{{clinic_contact_number}}",
            "{{clinic_address}}",
            "{{doctor_name}}",
            "{{doctor_email}}",
            "{{doctor_contact_number}}",
            "{{current_date}}",
            "{{current_date_time}}"
          ],
        },
        {
          id: "patient_checkin",
          title: "Patient clinic Check In notify template",
          subject: "Patient Clinic In",
          body: `
            <p>Welcome to OneCare ,</p>
            <p>New Patient Check In to Clinic</p>
            <p>Patient: {{patient_name}}</p>
            <p>Patient Email: {{patient_email}}</p>
            <p>Check In Date: {{current_date}}</p>
            <p>Thank you.</p>
          `,
          keys: ["{{patient_name}}", "{{patient_email}}", "{{current_date}}"],
        },
        {
          id: "OneCare_book_appt",
          title: "OneCare Book Appointment",
          subject: "Patient Appointment Booking Template",
          body: `
            <p>Welcome to OneCare ,</p>
            <p>Your appointment has been booked  successfully on</p>
            <p>{{appointment_date}} , Time : {{appointment_time}}</p>
            <p>Thank you.</p>
          `,
          keys: [
            "{{appointment_date}}",
            "{{appointment_time}}",
            "{{service_name}}",
            "{{clinic_name}}",
            "{{clinic_email}}",
            "{{clinic_contact_number}}",
            "{{clinic_address}}",
            "{{doctor_name}}",
            "{{doctor_email}}",
            "{{doctor_contact_number}}",
            "{{current_date}}",
            "{{current_date_time}}"
          ],
        },
        {
          id: "patient_report",
          title: "Patient Report Template",
          subject: "Patient Report",
          body: `
            <p>Welcome to OneCare ,</p>
            <p>Find your Report in attachment</p>
            <p>Thank you.</p>
          `,
          keys: ["{{current_date}}", "{{current_date_time}}"],
        },
        {
          id: "patient_prescription",
          title: "Patient Prescription Notification Template",
          subject: "Patient Prescription Reminder",
          body: `
            <p>Welcome to OneCare ,</p>
            <p>You Have Medicine Prescription on</p>
            <p>Clinic : {{clinic_name}}</p>
            <p>Doctor : {{doctor_name}}</p>
            <p>Prescription :{{prescription}}</p>
            <p>Thank you.</p>
          `,
          keys: [
            "{{prescription}}",
            "{{clinic_name}}",
            "{{clinic_email}}",
            "{{clinic_contact_number}}",
            "{{clinic_address}}",
            "{{doctor_name}}",
            "{{doctor_email}}",
            "{{doctor_contact_number}}",
            "{{current_date}}",
            "{{current_date_time}}",
            "{{service_name}}"
          ],
        },
      ],
    },
    {
      id: "receptionist",
      title: "Receptionist Templates",
      templates: [
        {
          id: "receptionist_registration",
          title: "Kivicare Receptionist Registration",
          subject: "Receptionist Registration Template",
          body: `
            <p>Welcome to OneCare ,</p>
            <p>Your registration process with {{user_email}} is successfully completed, and your password is  {{user_password}}</p>
            <p>Thank you.</p>
          `,
          keys: ["{{user_email}}", "{{user_password}}", "{{login_url}}", "{{current_date}}", "{{current_date_time}}"],
        },
      ],
    },
  ];

 
  // We'll store edits in a local state map: { [templateId]: { subject, body, enabled } }
  const [edits, setEdits] = useState({});

  const handleEditorChange = (templateId, value) => {
    setEdits((prev) => ({
      ...prev,
      [templateId]: { ...prev[templateId], body: value },
    }));
  };

  const handleSubjectChange = (templateId, value) => {
    setEdits((prev) => ({
      ...prev,
      [templateId]: { ...prev[templateId], subject: value },
    }));
  };

  const getTemplateData = (template) => {
    return edits[template.id] || { subject: template.subject, body: template.body, enabled: true };
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const [showTestEmailModal, setShowTestEmailModal] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testMessage, setTestMessage] = useState("Welcome to OneCare, This is test message");
  const [sendingTestEmail, setSendingTestEmail] = useState(false);

  const handleSendTestEmail = async () => {
    if (!testEmail) {
      toast.error("Please enter an email address.");
      return;
    }

    setSendingTestEmail(true);
    try {
      const response = await fetch(`${API_BASE}/api/email/test-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ to: testEmail, message: testMessage }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        setShowTestEmailModal(false);
        setTestEmail("");
      } else {
        toast.error(data.message || "Failed to send test email.");
      }
    } catch (error) {
      console.error("Error sending test email:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSendingTestEmail(false);
    }
  };

  return (
    <div className="p-2">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold text-primary mb-0">Email Template</h4>
        <Button variant="primary" size="sm" onClick={() => setShowTestEmailModal(true)}>
          <FaPaperPlane className="me-2" /> Send test Email
        </Button>
      </div>

      <Accordion defaultActiveKey="0" className="mb-4 shadow-sm border-0">
        {templateCategories.map((category, idx) => (
          <Accordion.Item eventKey={String(idx)} key={category.id} className="border-0 mb-2 rounded overflow-hidden">
            <Accordion.Header className="bg-white">
              <span className="fw-semibold text-primary">{category.title}</span>
            </Accordion.Header>
            <Accordion.Body className="p-0 bg-light">
              <Accordion className="flush">
                {category.templates.length > 0 ? (
                  category.templates.map((template, tIdx) => {
                    const data = getTemplateData(template);
                    return (
                      <Accordion.Item eventKey={String(tIdx)} key={template.id} className="border-bottom">
                        <Accordion.Header>
                          <div className="d-flex align-items-center gap-2">
                             <FaCheckSquare className="text-primary" />
                             <span className="fw-semibold text-primary" style={{ fontSize: '0.95rem' }}>{template.title}</span>
                          </div>
                        </Accordion.Header>
                        <Accordion.Body className="bg-white p-4">
                          <div className="mb-3 d-flex align-items-center gap-2">
                             <Form.Check 
                                type="checkbox" 
                                id={`enable-${template.id}`}
                                label={<span className="fw-bold text-primary">{template.title}</span>}
                                checked={true} 
                                readOnly
                             />
                          </div>

                          <Form.Group className="mb-3">
                            <Form.Label className="fw-bold small text-muted">Email Subject</Form.Label>
                            <Form.Control
                              type="text"
                              value={data.subject}
                              onChange={(e) => handleSubjectChange(template.id, e.target.value)}
                              className="p-2"
                            />
                          </Form.Group>

                          <div className="mb-3">
                            <Form.Label className="fw-bold small text-muted d-block">Template Dynamic Keys List(click on button to copy)</Form.Label>
                            <div className="d-flex flex-wrap gap-2">
                              {template.keys.map((key) => (
                                <Button
                                  key={key}
                                  variant="primary"
                                  size="sm"
                                  onClick={() => copyToClipboard(key)}
                                  style={{ fontSize: '0.75rem', fontWeight: 600 }}
                                >
                                  {key}
                                </Button>
                              ))}
                            </div>
                          </div>

                          <div className="mb-4">
                            <ReactQuill
                              theme="snow"
                              value={data.body}
                              onChange={(val) => handleEditorChange(template.id, val)}
                              style={{ height: '200px', marginBottom: '50px' }}
                            />
                          </div>

                          <div className="d-flex justify-content-end">
                             <Button variant="primary">
                                <FaSave className="me-2" /> Save
                             </Button>
                          </div>
                        </Accordion.Body>
                      </Accordion.Item>
                    );
                  })
                ) : (
                  <div className="p-3 text-muted text-center small">No templates available in this category.</div>
                )}
              </Accordion>
            </Accordion.Body>
          </Accordion.Item>
        ))}
      </Accordion>


      {/* Test Email Modal */}
      <Modal show={showTestEmailModal} onHide={() => setShowTestEmailModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold text-primary">Test email</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold small text-muted">Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter email Id"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold small text-muted">Test content</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-primary" onClick={() => setShowTestEmailModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSendTestEmail} disabled={sendingTestEmail}>
            {sendingTestEmail ? "Sending..." : "Test"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default EmailTemplates;

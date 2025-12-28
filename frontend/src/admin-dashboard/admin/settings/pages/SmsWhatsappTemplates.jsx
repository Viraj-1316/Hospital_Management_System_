import React, { useState, useEffect } from "react";
import { Accordion, Button, Form, Modal } from "react-bootstrap";
import toast from "react-hot-toast";
import { FaSms, FaWhatsapp, FaSave, FaPaperPlane, FaCheckSquare } from "react-icons/fa";
import axios from "axios";
import API_BASE from "../../../../config";

const SmsWhatsappTemplates = () => {
  // Mock data for categories and templates (Used for Structure & Initial Seeding)
  const templateCategories = [
    {
      id: "clinic",
      title: "Clinic Templates",
      templates: [
        {
          id: "clinic_admin_reg",
          title: "Clinic Admin registration notification to user",
          body: "Welcome to {{clinic_name}}, You are successfully registered as clinic admin. Your email: {{user_email}}, username: {{user_name}} and password: {{user_password}}. Thank you.",
          keys: ["{{clinic_name}}", "{{user_email}}", "{{user_name}}", "{{user_password}}"],
        },
        {
          id: "new_appt_clinic",
          title: "New Appointment Notification to Clinic",
          body: "New appointment Book on {{current_date}}. For Date: {{appointment_date}} , Time : {{appointment_time}} , Patient : {{patient_name}} , Doctor : {{doctor_name}}. Thank you.",
          keys: ["{{current_date}}", "{{appointment_date}}", "{{appointment_time}}", "{{patient_name}}", "{{doctor_name}}"],
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
          body: "Welcome to OneCare. Your account user credential. Your email: {{user_email}} , username: {{user_name}} and password: {{user_password}}. Thank you.",
          keys: ["{{user_email}}", "{{user_name}}", "{{user_password}}"],
        },
        {
          id: "user_verified",
          title: "User Verified Acknowledgement notification Template",
          body: "Your Account Has been Verified By admin On Date: {{current_date}}. Login Page: {{login_url}}. Thank you.",
          keys: ["{{current_date}}", "{{login_url}}"],
        },
        {
          id: "new_admin_user",
          title: "New Admin User Registration Notification",
          body: "New User Register On site {{site_url}} On Date: {{current_date}}. Name : {{user_name}}, Role : {{user_role}}. Thank you.",
          keys: ["{{site_url}}", "{{current_date}}", "{{user_name}}", "{{user_role}}"],
        },
        {
          id: "payment_pending",
          title: "Payment pending notification to user template",
          body: "Appointment Payment. Your Appointment is cancelled due to pending payment. Thank you.",
          keys: ["{{current_date}}"],
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
          body: "Welcome to OneCare. You are successfully registered. Your email: {{user_email}} , username: {{user_name}} and password: {{user_password}}. Thank you.",
          keys: ["{{user_email}}", "{{user_name}}", "{{user_password}}"],
        },
        {
          id: "new_appt_doctor",
          title: "New Appointment Notification to Doctor Template",
          body: "New appointment. You have new appointment on Date: {{appointment_date}} , Time : {{appointment_time}} ,Patient : {{patient_name}}. Thank you.",
          keys: ["{{appointment_date}}", "{{appointment_time}}", "{{patient_name}}"],
        },
        {
          id: "zoom_appt_doctor",
          title: "New Zoom video appointment notification to doctor template",
          body: "Zoom video conference. You have new appointment on Date: {{appointment_date}} , Time : {{appointment_time}} ,Patient : {{patient_name}} , Zoom Link : {{zoom_link}}. Thank you.",
          keys: ["{{appointment_date}}", "{{appointment_time}}", "{{patient_name}}", "{{zoom_link}}"],
        },
        {
          id: "google_meet_doctor",
          title: "New Google Meet video appointment notification to doctor template",
          body: "Google Meet conference. You have new appointment on Date: {{appointment_date}} , Time : {{appointment_time}} ,Patient : {{patient_name}} , Google Meet Link : {{meet_link}}. Thank you.",
          keys: ["{{appointment_date}}", "{{appointment_time}}", "{{patient_name}}", "{{meet_link}}"],
        },
        {
          id: "patient_reminder_doctor",
          title: "Patient Appointment Reminder Notification Template for Doctor",
          body: "Doctor Appointment Reminder. You Have appointment on {{appointment_date}} , Time : {{appointment_time}} , Patient : {{patient_name}}. Thank you.",
          keys: ["{{appointment_date}}", "{{appointment_time}}", "{{patient_name}}"],
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
          body: "Welcome to OneCare. Your registration process with {{user_email}} is successfully completed, and your password is {{user_password}}. Thank you.",
          keys: ["{{user_email}}", "{{user_password}}"],
        },
        {
          id: "allow_cancel_appt",
          title: "Allow Cancel appointments",
          body: "Your appointment Booking is cancel. Date: {{appointment_date}} , Time : {{appointment_time}}. Clinic: {{clinic_name}} Doctor: {{doctor_name}}. Thank you.",
          keys: ["{{appointment_date}}", "{{appointment_time}}", "{{clinic_name}}", "{{doctor_name}}"],
        },
        {
          id: "video_conf_appt_patient",
          title: "Video conference appointment booking notification template",
          body: "Zoom video conference. You have new appointment on Date: {{appointment_date}} , Time : {{appointment_time}} ,Doctor : {{doctor_name}} , Zoom Link : {{zoom_link}}. Thank you.",
          keys: ["{{appointment_date}}", "{{appointment_time}}", "{{doctor_name}}", "{{zoom_link}}"],
        },
        {
          id: "patient_appt_reminder",
          title: "Patient Appointment Reminder Notification Template",
          body: "Welcome to OneCare. You Have appointment on {{appointment_date}} , Time : {{appointment_time}}. Thank you.",
          keys: ["{{appointment_date}}", "{{appointment_time}}"],
        },
        {
          id: "google_meet_patient",
          title: "New Google Meet video appointment email to patient template",
          body: "Google Meet conference. You have new appointment on Date: {{appointment_date}} , Time : {{appointment_time}} ,Doctor : {{doctor_name}} , Google Meet Link : {{meet_link}}. Thank you.",
          keys: ["{{appointment_date}}", "{{appointment_time}}", "{{doctor_name}}", "{{meet_link}}"],
        },
        {
          id: "patient_checkin",
          title: "Patient clinic Check In notify template",
          body: "New Patient Check In to Clinic. Patient: {{patient_name}}. Check In Date: {{current_date}}. Thank you.",
          keys: ["{{patient_name}}", "{{current_date}}"],
        },
        {
          id: "new_appt_sms",
          title: "New Appointment SMS Template",
          body: "Your appointment has been booked successfully on {{appointment_date}} , Time : {{appointment_time}}. Thank you.",
          keys: ["{{appointment_date}}", "{{appointment_time}}"],
        },
        {
          id: "patient_report",
          title: "Patient Report Template",
          body: "Welcome to OneCare. Your Report is ready. Thank you.",
          keys: ["{{current_date}}"],
        },
        {
          id: "patient_prescription",
          title: "Patient Prescription Notification Template",
          body: "You Have Medicine Prescription on Clinic : {{clinic_name}}, Doctor : {{doctor_name}}. Thank you.",
          keys: ["{{clinic_name}}", "{{doctor_name}}"],
        },
      ],
    },
    {
      id: "receptionist",
      title: "Receptionist Templates",
      templates: [
        {
          id: "receptionist_registration",
          title: "Receptionist Registration",
          body: "Welcome to OneCare. Your registration process with {{user_email}} is successfully completed, and your password is {{user_password}}. Thank you.",
          keys: ["{{user_email}}", "{{user_password}}"],
        },
      ],
    },
  ];

  // State for edits (Holds the current body of templates)
  // Key: templateId, Value: { body: "..." }
  const [edits, setEdits] = useState({});

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API_BASE}/api/settings/templates`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data && data.length > 0) {
        // Hydrate state from backend
        const initialEdits = {};
        data.forEach(t => {
          initialEdits[t.templateId] = { body: t.body };
        });
        setEdits(initialEdits);
      } else {
        // Backend empty -> SEED IT
        seedTemplates();
      }
    } catch (err) {
      console.error("Error loading templates", err);
    }
  };

  const seedTemplates = async () => {
    try {
      const token = localStorage.getItem("token");

      // Flatten categories to list
      const allTemplates = [];
      templateCategories.forEach(cat => {
        cat.templates.forEach(t => {
          allTemplates.push({
            templateId: t.id,
            category: cat.id,
            title: t.title,
            body: t.body,
            keys: t.keys
          });
        });
      });

      await axios.post(`${API_BASE}/api/settings/templates/seed`, { templates: allTemplates }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // After seed, set edits mainly to defaults
      const initialEdits = {};
      allTemplates.forEach(t => {
        initialEdits[t.templateId] = { body: t.body };
      });
      setEdits(initialEdits);

      console.log("Templates seeded successfully");
    } catch (err) {
      console.error("Error seeding templates", err);
    }
  }

  const handleBodyChange = (templateId, value) => {
    setEdits((prev) => ({
      ...prev,
      [templateId]: { ...prev[templateId], body: value },
    }));
  };

  // Helper to fallback to hardcoded default if not in edits (though edits should be populated)
  const getTemplateData = (categoryTemplate) => {
    return edits[categoryTemplate.id] || { body: categoryTemplate.body };
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  // Test Modal State
  const [showTestModal, setShowTestModal] = useState(false);
  const [testType, setTestType] = useState("sms"); // 'sms' or 'whatsapp'
  const [testNumber, setTestNumber] = useState("");
  const [testMessage, setTestMessage] = useState("Welcome to OneCare, This is a test message");
  const [sendingTest, setSendingTest] = useState(false);

  const openTestModal = (type) => {
    setTestType(type);
    setShowTestModal(true);
  };

  const handleSendTest = async () => {
    if (!testNumber) {
      toast.error("Please enter a mobile number.");
      return;
    }

    setSendingTest(true);
    // Simulate API call
    setTimeout(() => {
      toast.success(`Test ${testType === 'sms' ? 'SMS' : 'WhatsApp'} sent successfully to ${testNumber}!`);
      setSendingTest(false);
      setShowTestModal(false);
      setTestNumber("");
    }, 1500);
  };

  const handleSaveAll = async () => {
    try {
      const token = localStorage.getItem("token");

      // Prepare bulk update payload
      // We reuse the /seed endpoint which does upsert/update
      const templatesToSave = [];

      templateCategories.forEach(cat => {
        cat.templates.forEach(t => {
          const currentData = getTemplateData(t);
          templatesToSave.push({
            templateId: t.id,
            category: cat.id,
            title: t.title,
            body: currentData.body,
            keys: t.keys
          });
        });
      });

      await axios.post(`${API_BASE}/api/settings/templates/seed`, { templates: templatesToSave }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success("All templates saved successfully!");
    } catch (err) {
      console.error("Error saving templates", err);
      toast.error("Failed to save templates");
    }
  }

  return (
    <div className="p-2">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold text-primary mb-0">SMS/WhatsApp Template <small className="text-muted fs-6 ms-2"><i className="bi bi-question-circle"></i></small></h4>
        <div className="d-flex gap-2">
          <Button variant="primary" size="sm" onClick={() => openTestModal('sms')}>
            <FaSms className="me-2" /> Send test Sms
          </Button>
          <Button variant="primary" size="sm" onClick={() => openTestModal('whatsapp')}>
            <FaWhatsapp className="me-2" /> Send test Whatsapp
          </Button>
        </div>
      </div>

      <Accordion defaultActiveKey="0" className="mb-4 shadow-sm border-0">
        {templateCategories.map((category, idx) => (
          <Accordion.Item
            eventKey={String(idx)}
            key={category.id}
            className={`border-0 mb-2 rounded overflow-hidden stagger-item stagger-${(idx % 5) + 1}`}
          >
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
                          <div className="mb-3">
                            <Form.Label className="fw-bold small text-muted d-block">Template Dynamic Keys List (click to copy)</Form.Label>
                            <div className="d-flex flex-wrap gap-2">
                              {template.keys.map((key) => (
                                <Button
                                  key={key}
                                  variant="outline-secondary"
                                  size="sm"
                                  onClick={() => copyToClipboard(key)}
                                  style={{ fontSize: '0.75rem', fontWeight: 600 }}
                                >
                                  {key}
                                </Button>
                              ))}
                            </div>
                          </div>

                          <Form.Group className="mb-3">
                            <Form.Label className="fw-bold small text-muted">Template Body</Form.Label>
                            <Form.Control
                              as="textarea"
                              rows={4}
                              value={data.body}
                              onChange={(e) => handleBodyChange(template.id, e.target.value)}
                              className="p-2"
                            />
                          </Form.Group>
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

      <div className="d-flex justify-content-end mb-4">
        <Button variant="primary" onClick={handleSaveAll}>
          <FaSave className="me-2" /> Save
        </Button>
      </div>

      {/* Test Modal */}
      <Modal show={showTestModal} onHide={() => setShowTestModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold text-primary">Test {testType === 'sms' ? 'SMS' : 'WhatsApp'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold small text-muted">Mobile Number</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter mobile number"
                value={testNumber}
                onChange={(e) => setTestNumber(e.target.value)}
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
          <Button variant="outline-primary" onClick={() => setShowTestModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSendTest} disabled={sendingTest}>
            {sendingTest ? "Sending..." : "Send"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default SmsWhatsappTemplates;

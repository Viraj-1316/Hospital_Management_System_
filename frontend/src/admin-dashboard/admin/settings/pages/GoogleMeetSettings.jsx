import React, { useState } from "react";
import { Form, Button, Row, Col, Card } from "react-bootstrap";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { FaQuestionCircle, FaSave } from "react-icons/fa";
import toast from "react-hot-toast";

const GoogleMeetSettings = () => {
  const [isConfigEnabled, setIsConfigEnabled] = useState(true);
  const [clientId, setClientId] = useState("demo.apps.googleusercontent.com");
  
  const [clientSecret, setClientSecret] = useState("demo_secret");
  const [appName, setAppName] = useState("OneCare");

  const [eventTitle, setEventTitle] = useState("{{service_name}}");
  const [eventDescription, setEventDescription] = useState(`
    <p>New appointment</p>
    <p>Your have new appointment on</p>
    <p>Date: {{appointment_date}} , Time : {{appointment_time}} ,Patient : {{patient_name}}</p>
    <p>Clinic: {{clinic_name}}.</p>
    <p>Appointment Description: {{appointment_desc}}.</p>
    <p>Thank you.</p>
  `);

  const handleSaveConfig = () => {
    toast.success("Google Meet configuration saved!");
  };

  const handleSaveTemplate = () => {
    toast.success("Google Meet event template saved!");
  };

  return (
    <div className="p-2">
      <div className="d-flex align-items-center mb-4">
        <h4 className="fw-bold text-primary mb-0 me-2">Google Meet</h4>
        <FaQuestionCircle className="text-muted" style={{ cursor: "pointer" }} title="Help" />
      </div>

      {/* Configuration Section */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
            <div className="d-flex align-items-center mb-4">
                <Form.Check 
                    type="switch"
                    id="google-meet-switch"
                    label={<span className="fw-bold text-secondary">Google Meet Configuration</span>}
                    checked={isConfigEnabled}
                    onChange={(e) => setIsConfigEnabled(e.target.checked)}
                    className="fs-5"
                />
            </div>

            <Row>
                <Col md={7}>
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-bold small text-muted">Google Meet Client ID</Form.Label>
                        <Form.Control 
                            type="text" 
                            value={clientId} 
                            onChange={(e) => setClientId(e.target.value)}
                            disabled={!isConfigEnabled}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-bold small text-muted">Google Meet Client Secret</Form.Label>
                        <Form.Control 
                            type="text" 
                            value={clientSecret} 
                            onChange={(e) => setClientSecret(e.target.value)}
                            disabled={!isConfigEnabled}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-bold small text-muted">App Name</Form.Label>
                        <Form.Control 
                            type="text" 
                            value={appName} 
                            onChange={(e) => setAppName(e.target.value)}
                            disabled={!isConfigEnabled}
                        />
                    </Form.Group>
                    
                    <div className="d-flex justify-content-end mt-4">
                        <Button variant="primary" onClick={handleSaveConfig} disabled={!isConfigEnabled}>
                            <FaSave className="me-2" /> Save
                        </Button>
                    </div>
                </Col>

                <Col md={5}>
                    <div className="bg-light p-3 rounded border">
                        <h6 className="fw-bold text-primary mb-3">Guide to setup google GoogleMeet.</h6>
                        <div className="mb-3">
                            <span className="fw-bold small">Step 1: </span>
                            <a href="https://console.cloud.google.com/apis/dashboard?pli=1  " className="text-decoration-none small">Please refer the following link for the setup.</a>
                        </div>
                        <p className="small text-muted mb-0">
                            Note: If you have already setup Google calendar then You can use same ClientID and Client Secret here.
                        </p>
                    </div>
                </Col>
            </Row>
        </Card.Body>
      </Card>

      {/* Event Template Section */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white py-3">
            <h5 className="fw-bold text-secondary mb-0">Google Meet Event Template</h5>
        </Card.Header>
        <Card.Body>
            <Form.Group className="mb-3">
                <Form.Label className="fw-bold small text-muted">Google Event title</Form.Label>
                <Form.Control 
                    type="text" 
                    value={eventTitle} 
                    onChange={(e) => setEventTitle(e.target.value)}
                />
            </Form.Group>

            <Form.Group className="mb-4">
                <Form.Label className="fw-bold small text-muted">Google Event Description</Form.Label>
                <ReactQuill 
                    theme="snow" 
                    value={eventDescription} 
                    onChange={setEventDescription}
                    style={{ height: '200px', marginBottom: '50px' }}
                />
            </Form.Group>

            <div className="d-flex justify-content-end">
                <Button variant="primary" onClick={handleSaveTemplate}>
                    <FaSave className="me-2" /> Save
                </Button>
            </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default GoogleMeetSettings;

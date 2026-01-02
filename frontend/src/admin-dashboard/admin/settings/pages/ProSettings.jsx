import React, { useState, useEffect } from "react";
import { Form, Button, Row, Col, Card } from "react-bootstrap";
import { FaSave, FaSms, FaWhatsapp } from "react-icons/fa";
import toast from "react-hot-toast";
import axios from "axios";
import API_BASE from "../../../../config";

const ProSettings = () => {
  // SMS State
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [smsSid, setSmsSid] = useState("");
  const [smsToken, setSmsToken] = useState("");
  const [smsPhone, setSmsPhone] = useState("");

  // WhatsApp State
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [waSid, setWaSid] = useState("");
  const [waToken, setWaToken] = useState("");
  const [waPhone, setWaPhone] = useState("");

  // Copyright State
  const [copyrightText, setCopyrightText] = useState("OneCare © 2024. All rights reserved.");

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API_BASE}/api/settings/pro`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data) {
        setSmsEnabled(data.smsEnabled ?? false);
        setSmsSid(data.smsSid ?? "");
        setSmsToken(data.smsToken ?? "");
        setSmsPhone(data.smsPhone ?? "");
        setWhatsappEnabled(data.whatsappEnabled ?? false);
        setWaSid(data.whatsappSid ?? "");
        setWaToken(data.whatsappToken ?? "");
        setWaPhone(data.whatsappPhone ?? "");
        setCopyrightText(data.copyrightText ?? "OneCare © 2024. All rights reserved.");
      }
    } catch (err) {
      console.error("Failed to fetch pro settings", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (section) => {
    try {
      const token = localStorage.getItem("token");
      let payload = {};

      if (section === 'SMS') {
        payload = {
          smsEnabled,
          smsSid,
          smsToken,
          smsPhone,
        };
      } else if (section === 'WhatsApp') {
        payload = {
          whatsappEnabled,
          whatsappSid: waSid,
          whatsappToken: waToken,
          whatsappPhone: waPhone,
        };
      } else if (section === 'Copyright') {
        payload = { copyrightText };
      }

      await axios.put(`${API_BASE}/api/settings/pro`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(`${section} settings saved successfully!`);
    } catch (err) {
      console.error(err);
      toast.error(`Failed to save ${section} settings`);
    }
  };

  const handleTest = (type) => {
    toast.success(`Test ${type} sent! (Note: Full integration requires backend SMS service setup)`);
  };

  if (loading) {
    return <div className="p-4">Loading settings...</div>;
  }

  return (
    <div className="p-2">
      <h4 className="fw-bold text-primary mb-4">Twilio Account Settings</h4>

      <Row>
        <Col md={7}>
            {/* SMS Configuration */}
            <div className="mb-5">
                <div className="mb-4">
                    <Form.Check 
                        type="switch"
                        id="sms-config-switch"
                        label={<span className="fw-bold text-secondary">SMS Configuration</span>}
                        checked={smsEnabled}
                        onChange={(e) => setSmsEnabled(e.target.checked)}
                        className="fs-5"
                    />
                </div>

                <Form.Group className="mb-3">
                    <Form.Label className="fw-bold small text-muted text-uppercase">Account SID</Form.Label>
                    <Form.Control 
                        type="text" 
                        value={smsSid} 
                        onChange={(e) => setSmsSid(e.target.value)}
                        disabled={!smsEnabled}
                    />
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label className="fw-bold small text-muted text-uppercase">Auth Token</Form.Label>
                    <Form.Control 
                        type="text" 
                        value={smsToken} 
                        onChange={(e) => setSmsToken(e.target.value)}
                        disabled={!smsEnabled}
                    />
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label className="fw-bold small text-muted text-uppercase">Phone Number</Form.Label>
                    <Form.Control 
                        type="text" 
                        value={smsPhone} 
                        onChange={(e) => setSmsPhone(e.target.value)}
                        disabled={!smsEnabled}
                    />
                </Form.Group>

                <div className="d-flex justify-content-end gap-2 mb-5">
                    <Button variant="primary" onClick={() => handleTest('SMS')} disabled={!smsEnabled}>
                        <FaSms className="me-2" /> Send test Sms
                    </Button>
                    <Button variant="primary" onClick={() => handleSave('SMS')} disabled={!smsEnabled}>
                        <FaSave className="me-2" /> Save
                    </Button>
                </div>
            </div>

            {/* WhatsApp Configuration */}
            <div className="mb-4">
                <div className="mb-4">
                    <Form.Check 
                        type="switch"
                        id="whatsapp-config-switch"
                        label={<span className="fw-bold text-secondary">WhatsApp Configuration</span>}
                        checked={whatsappEnabled}
                        onChange={(e) => setWhatsappEnabled(e.target.checked)}
                        className="fs-5"
                    />
                </div>

                <Form.Group className="mb-3">
                    <Form.Label className="fw-bold small text-muted text-uppercase">Account SID</Form.Label>
                    <Form.Control 
                        type="text" 
                        placeholder="Enter your ACCOUNT SID"
                        value={waSid} 
                        onChange={(e) => setWaSid(e.target.value)}
                        disabled={!whatsappEnabled}
                    />
                    <Form.Text className="text-warning small fw-bold">ACCOUNT SID Required.</Form.Text>
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label className="fw-bold small text-muted text-uppercase">Auth Token</Form.Label>
                    <Form.Control 
                        type="text" 
                        placeholder="Enter your AUTH TOKEN"
                        value={waToken} 
                        onChange={(e) => setWaToken(e.target.value)}
                        disabled={!whatsappEnabled}
                    />
                    <Form.Text className="text-warning small fw-bold">AUTH TOKEN Required.</Form.Text>
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label className="fw-bold small text-muted text-uppercase">Phone Number</Form.Label>
                    <Form.Control 
                        type="text" 
                        placeholder="Enter your to number"
                        value={waPhone} 
                        onChange={(e) => setWaPhone(e.target.value)}
                        disabled={!whatsappEnabled}
                    />
                    <Form.Text className="text-warning small fw-bold">PHONE NUMBER Required.</Form.Text>
                </Form.Group>

                <div className="d-flex justify-content-end gap-2">
                    <Button variant="primary" onClick={() => handleTest('WhatsApp')} disabled={!whatsappEnabled}>
                        <FaWhatsapp className="me-2" /> Send test Whatsapp
                    </Button>
                    <Button variant="primary" onClick={() => handleSave('WhatsApp')} disabled={!whatsappEnabled}>
                        <FaSave className="me-2" /> Save
                    </Button>
                </div>
            </div>
        </Col>

        <Col md={5}>
            {/* Guides */}
            <div className="mb-5">
                <h6 className="fw-bold text-primary mb-3">Twilio SMS guide</h6>
                <div className="border rounded bg-white">
                    <div className="p-3 border-bottom small text-muted">
                        Step 1: You can sign up for a free Twilio trial account here: <a href="#" className="text-decoration-none">Step 1: You can sign up for a free Twilio trial account here</a>
                    </div>
                    <div className="p-3 border-bottom small text-muted">
                        Step 2: To get the Twilio CLI connected to your account. Visit , <a href="#" className="text-decoration-none">Twilio SMS portal</a> and you'll find your unique Account SID and Auth Token to provide to the CLI.
                    </div>
                    <div className="p-3 border-bottom small text-muted">
                        Step 3: Copy and Paste ACCOUNT SID and AUTH TOKEN and click on save button and here you go.
                    </div>
                    <div className="p-3 border-bottom small text-muted">
                        Step 4 (Optional): To get your first Twilio phone number for sending sms. Visit , <a href="#" className="text-decoration-none">head on over to the console</a> and you will get phone number to send SMS if you dont want any particular number to send message use your SID.
                    </div>
                    <div className="p-3 small text-muted">
                        Important Note: Reciever(doctor/patient) Phone/contact No must be in twilio specific format ([+] [country code] [mobile number] ) , <a href="#" className="text-decoration-none">Please Refer here for more details</a>
                    </div>
                </div>
            </div>

            <div>
                <h6 className="fw-bold text-primary mb-3">Twilio Whatsapp guide</h6>
                <div className="border rounded bg-white">
                    <div className="p-3 border-bottom small text-muted">
                        Step 1: You can sign up for a free Twilio trial account here: <a href="#" className="text-decoration-none">Step 1: You can sign up for a free Twilio trial account here</a>
                    </div>
                    <div className="p-3 border-bottom small text-muted">
                        Step 2: To get the Twilio CLI connected to your account. Visit , <a href="#" className="text-decoration-none">Twilio SMS portal</a> and you'll find your unique Account SID and Auth Token to provide to the CLI.
                    </div>
                    <div className="p-3 border-bottom small text-muted">
                        Step 3: Copy and Paste ACCOUNT SID and AUTH TOKEN and click on save button and here you go.
                    </div>
                    <div className="p-3 border-bottom small text-muted">
                        Step 4 (Optional): To get your first Twilio phone number for sending sms. Visit , <a href="#" className="text-decoration-none">head on over to the console</a> and you will get phone number to send SMS if you dont want any particular number to send message use your SID.
                    </div>
                    <div className="p-3 small text-muted">
                        Important Note: Reciever(doctor/patient) Phone/contact No must be in twilio specific format ([+] [country code] [mobile number] ) , <a href="#" className="text-decoration-none">Please Refer here for more details</a>
                    </div>
                </div>
            </div>
        </Col>
      </Row>

      <hr className="my-5" />

      {/* Copyright Text Section */}
      <h4 className="fw-bold text-primary mb-4">Copyright Text</h4>
      <Card className="border-0 shadow-sm">
        <Card.Body>
            <Form.Group className="mb-3">
                <Form.Label className="fw-bold small text-muted">Change Copyright Text</Form.Label>
                <Form.Control 
                    type="text" 
                    value={copyrightText} 
                    onChange={(e) => setCopyrightText(e.target.value)}
                />
            </Form.Group>
            <div className="d-flex justify-content-end">
                <Button variant="primary" onClick={() => handleSave('Copyright')}>
                    <FaSave className="me-2" /> Save
                </Button>
            </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default ProSettings;

import React, { useState, useEffect } from "react";
import { Form, Button, Row, Col, Card, Spinner, InputGroup } from "react-bootstrap";
import { FaSave, FaEye, FaEyeSlash } from "react-icons/fa";
import toast from "react-hot-toast";
import axios from "axios";
import API_BASE from "../../../../config";

const PaymentSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  
  const [razorpayStatus, setRazorpayStatus] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [currency, setCurrency] = useState("INR");

  // Fetch existing settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE}/api/razorpay/settings/full`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setRazorpayStatus(res.data.razorpayEnabled || false);
        setApiKey(res.data.razorpayKeyId || "");
        setApiSecret(res.data.razorpayKeySecret || "");
        setCurrency(res.data.razorpayCurrency || "INR");
      } catch (err) {
        console.error("Error fetching Razorpay settings:", err);
        // Settings might not exist yet, which is fine
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (razorpayStatus && (!apiKey || !apiSecret)) {
      toast.error("Please enter both API Key and Secret when Razorpay is enabled");
      return;
    }
    
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_BASE}/api/razorpay/settings`, {
        razorpayEnabled: razorpayStatus,
        razorpayKeyId: apiKey,
        razorpayKeySecret: apiSecret,
        razorpayCurrency: currency
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success("Payment settings saved successfully!");
    } catch (err) {
      console.error("Error saving settings:", err);
      toast.error(err.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="p-2">
      <Card className="border-0 shadow-sm mb-4">
        <Card.Header className="bg-white py-3">
            <h5 className="fw-bold text-secondary mb-0">Razorpay Settings</h5>
        </Card.Header>
        <Card.Body>
            <div className="mb-4">
                <Form.Check 
                    type="switch"
                    id="razorpay-status-switch"
                    label={<span className="fw-bold text-secondary">Razorpay Status</span>}
                    checked={razorpayStatus}
                    onChange={(e) => setRazorpayStatus(e.target.checked)}
                    className="fs-5"
                />
                <small className="text-muted">
                  Enable Razorpay to allow patients to pay online
                </small>
            </div>

            <Row className="mb-3">
                <Col md={6}>
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-bold small text-muted">API Key (Key ID)</Form.Label>
                        <Form.Control 
                            type="text" 
                            value={apiKey} 
                            onChange={(e) => setApiKey(e.target.value)}
                            disabled={!razorpayStatus}
                            placeholder="rzp_test_xxxxx or rzp_live_xxxxx"
                        />
                    </Form.Group>
                </Col>
                <Col md={6}>
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-bold small text-muted">API Secret (Key Secret)</Form.Label>
                        <InputGroup>
                            <Form.Control 
                                type={showSecret ? "text" : "password"} 
                                value={apiSecret} 
                                onChange={(e) => setApiSecret(e.target.value)}
                                disabled={!razorpayStatus}
                                placeholder="Enter your Razorpay Key Secret"
                            />
                            <Button 
                                variant="outline-secondary"
                                onClick={() => setShowSecret(!showSecret)}
                                disabled={!razorpayStatus}
                            >
                                {showSecret ? <FaEyeSlash /> : <FaEye />}
                            </Button>
                        </InputGroup>
                    </Form.Group>
                </Col>
            </Row>

            <Row className="mb-4">
                <Col md={12}>
                    <Form.Group>
                        <Form.Label className="fw-bold small text-muted">Currency <span className="text-danger">*</span></Form.Label>
                        <Form.Select 
                            value={currency} 
                            onChange={(e) => setCurrency(e.target.value)}
                            disabled={!razorpayStatus}
                        >
                            <option value="INR">Indian Rupees (INR)</option>
                            <option value="USD">US Dollar (USD)</option>
                            <option value="EUR">Euro (EUR)</option>
                        </Form.Select>
                    </Form.Group>
                </Col>
            </Row>

            <div className="alert alert-info mb-3">
              <strong>Note:</strong> The Razorpay currency must match your service prices.
              Get your API keys from the <a href="https://dashboard.razorpay.com/app/keys" target="_blank" rel="noopener noreferrer">Razorpay Dashboard</a>.
            </div>

            <div className="d-flex justify-content-end mt-3">
                <Button 
                  variant="primary" 
                  onClick={handleSave} 
                  disabled={saving}
                >
                    {saving ? (
                      <>
                        <Spinner size="sm" animation="border" className="me-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <FaSave className="me-2" /> Save
                      </>
                    )}
                </Button>
            </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default PaymentSettings;

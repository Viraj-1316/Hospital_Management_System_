// src/components/ServiceFormModal.jsx
import React, { useEffect, useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import api from '../utils/api';

export default function ServiceFormModal({ show, onHide, onSaved, service }) {
  const [form, setForm] = useState({
    name: '',
    clinicName: '',
    doctor: '',
    charges: '',
    duration: '',
    category: '',
    active: true
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (service) {
      // map backend fields in case there are extra fields
      setForm({
        name: service.name || '',
        clinicName: service.clinicName || '',
        doctor: service.doctor || '',
        charges: service.charges || '',
        duration: service.duration || '',
        category: service.category || '',
        active: service.active ?? true
      });
    } else {
      setForm({
        name: '',
        clinicName: '',
        doctor: '',
        charges: '',
        duration: '',
        category: '',
        active: true
      });
    }
  }, [service, show]);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const save = async () => {
    if (!form.name.trim()) { alert('Service name is required'); return; }
    setSaving(true);
    try {
      let res;
      if (service && service._id) {
        res = await api.put(`/services/${service._id}`, form);
      } else {
        res = await api.post('/services', form);
      }
      onSaved(res.data);
    } catch (err) {
      console.error('save err', err);
      alert('Save failed (see console).');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>{service ? 'Edit Service' : 'Add Service'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-2">
            <Form.Label>Service Name</Form.Label>
            <Form.Control name="name" value={form.name} onChange={onChange} placeholder="Ex: Checkup" />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Clinic Name</Form.Label>
            <Form.Control name="clinicName" value={form.clinicName} onChange={onChange} placeholder="Ex: Valley Clinic" />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Doctor (username or id)</Form.Label>
            <Form.Control name="doctor" value={form.doctor} onChange={onChange} placeholder="Ex: doctorusername" />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Charges</Form.Label>
            <Form.Control name="charges" value={form.charges} onChange={onChange} placeholder="$100/-" />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Duration</Form.Label>
            <Form.Control name="duration" value={form.duration} onChange={onChange} placeholder="HH:mm or -" />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Category</Form.Label>
            <Form.Control name="category" value={form.category} onChange={onChange} placeholder="Ex: general dentistry" />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Check type="checkbox" label="Active" name="active" checked={!!form.active} onChange={onChange} />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={saving}>Cancel</Button>
        <Button variant="primary" onClick={save} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

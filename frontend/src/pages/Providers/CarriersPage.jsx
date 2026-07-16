import React, { useEffect, useState } from 'react';
import { MainLayout } from '../../components/shell/MainLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { useNotifications } from '../../hooks/useNotifications';
import { listCarriers, saveCarrierCredentials, deleteCarrierCredentials, testCarrierConnection } from '../../api';
import { Plus, Check, X } from 'lucide-react';

function parseErrorDetail(err) {
  try {
    const parsed = JSON.parse(err.message);
    return parsed.detail || err.message;
  } catch {
    return err.message;
  }
}

function CarrierCard({ carrier, onEdit, onTest, onDelete, testing }) {
  return (
    <Card className="group p-6 border hover:border-blue-500/50 hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fadeInUp overflow-hidden relative" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-2xl" />

      <div className="relative">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{carrier.name}</CardTitle>
            <Badge variant={carrier.status === 'Connected' ? 'success' : 'error'} size="sm" className="uppercase text-xs font-bold tracking-wide">
              {carrier.status === 'Connected' ? <Check size={14} /> : <X size={14} />}
              {carrier.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div className="p-3 rounded-lg border cursor-pointer" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)' }} onClick={() => onEdit(carrier)}>
              <p className="text-xs uppercase tracking-wider font-medium" style={{ color: 'var(--text-tertiary)' }}>Account SID</p>
              <p className="font-mono truncate mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>{carrier.account_sid || '—'}</p>
            </div>
            <div className="p-3 rounded-lg border cursor-pointer" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)' }} onClick={() => onEdit(carrier)}>
              <p className="text-xs uppercase tracking-wider font-medium" style={{ color: 'var(--text-tertiary)' }}>Phone Number</p>
              <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>{carrier.phone_number || '—'}</p>
            </div>

            <div className="flex gap-2 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <Button variant="secondary" size="sm" fullWidth onClick={() => onTest(carrier)} disabled={testing} className="shadow-md">
                {testing ? 'Testing...' : 'Test Connection'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onDelete(carrier.id)}>
                Delete
              </Button>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

export default function CarriersPage() {
  const [carriers, setCarriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCarrier, setEditingCarrier] = useState(null);
  const [testingId, setTestingId] = useState(null);
  const [formData, setFormData] = useState({
    account_sid: '',
    auth_token: '',
    phone_number: '',
  });
  const { success, error } = useNotifications();

  const loadCarriers = () => {
    setLoading(true);
    return listCarriers()
      .then((data) => setCarriers(data.carriers || []))
      .catch((err) => error(parseErrorDetail(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCarriers();
  }, []);

  const handleOpenModal = (carrier) => {
    setFormData({ account_sid: '', auth_token: '', phone_number: carrier.phone_number || '' });
    setEditingCarrier(carrier);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.account_sid || !formData.auth_token) {
      error('Please fill in Account SID and Auth Token');
      return;
    }
    saveCarrierCredentials(editingCarrier.id, formData)
      .then(() => {
        success(`${editingCarrier.name} credentials saved`);
        setShowModal(false);
        loadCarriers();
      })
      .catch((err) => error(parseErrorDetail(err)));
  };

  const handleTest = (carrier) => {
    setTestingId(carrier.id);
    testCarrierConnection(carrier.id)
      .then(() => {
        success(`Connected! ${carrier.name} connection successful.`);
        loadCarriers();
      })
      .catch((err) => error(`Connection Failed: ${parseErrorDetail(err)}`))
      .finally(() => setTestingId(null));
  };

  const handleDelete = (id) => {
    deleteCarrierCredentials(id)
      .then(() => {
        success('Carrier credentials removed');
        loadCarriers();
      })
      .catch((err) => error(parseErrorDetail(err)));
  };

  return (
    <MainLayout pageTitle="Carriers">
      <div className="space-y-8 pb-8">
        <div className="space-y-2 animate-fadeInUp">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            Carriers
          </h1>
          <p style={{ color: 'var(--text-tertiary)' }}>Configure and manage your carrier connections for outbound calling</p>
        </div>

        <div className="flex items-center justify-between animate-slideInRight" style={{ animationDelay: '100ms' }}>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            Seamlessly integrate Twilio, Plivo, Vonage, Nice CXone, and enterprise VoIP carriers
          </p>
        </div>

        {loading ? (
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading carriers...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {carriers.map((carrier, idx) => (
              <div key={carrier.id} style={{ animationDelay: `${idx * 100}ms` }}>
                <CarrierCard
                  carrier={carrier}
                  onEdit={handleOpenModal}
                  onTest={handleTest}
                  onDelete={handleDelete}
                  testing={testingId === carrier.id}
                />
              </div>
            ))}
          </div>
        )}

        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingCarrier ? `Configure ${editingCarrier.name}` : 'Configure Carrier'}
          size="md"
          footer={
            <>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSave} className="shadow-glow">
                Save
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Input
              label="Account SID"
              value={formData.account_sid}
              onChange={(e) => setFormData({ ...formData, account_sid: e.target.value })}
              placeholder="Your account SID or ID"
              required
            />
            <Input
              label="Auth Token"
              type="password"
              value={formData.auth_token}
              onChange={(e) => setFormData({ ...formData, auth_token: e.target.value })}
              placeholder="Your authentication token"
              required
            />
            <Input
              label="Phone Number"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              placeholder="+1XXXXXXXXXX"
            />
          </div>
        </Modal>
      </div>
    </MainLayout>
  );
}

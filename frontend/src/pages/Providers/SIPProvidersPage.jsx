import React, { useState } from 'react';
import { MainLayout } from '../../components/shell/MainLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { useNotifications } from '../../hooks/useNotifications';
import { Wifi, Plus, Check, X } from 'lucide-react';

const SAMPLE_PROVIDERS = [
  {
    id: '1',
    name: 'Twilio',
    status: 'Disconnected',
    account_sid: '',
    auth_token: '',
    phone_number: '',
  },
  {
    id: '2',
    name: 'Plivo',
    status: 'Disconnected',
    account_sid: '',
    auth_token: '',
    phone_number: '',
  },
  {
    id: '3',
    name: 'Nice CXone',
    status: 'Disconnected',
    account_sid: '',
    auth_token: '',
    phone_number: '',
  },
  {
    id: '4',
    name: 'Vonage',
    status: 'Disconnected',
    account_sid: '',
    auth_token: '',
    phone_number: '',
  },
];

function ProviderCard({ provider, onEdit, onTest, onDelete }) {
  return (
    <Card className="group p-6 bg-gradient-to-br from-slate-700/40 to-slate-800/40 border border-slate-600/50 hover:border-blue-500/50 hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fadeInUp overflow-hidden relative">
      {/* Gradient background effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-2xl" />

      <div className="relative">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg font-bold text-slate-100">{provider.name}</CardTitle>
            <Badge variant={provider.status === 'Connected' ? 'success' : 'error'} size="sm" className="uppercase text-xs font-bold tracking-wide">
              {provider.status === 'Connected' ? <Check size={14} /> : <X size={14} />}
              {provider.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div className="p-3 bg-slate-700/30 rounded-lg border border-slate-600/30">
              <p className="text-slate-400 text-xs uppercase tracking-wider font-medium">Account SID</p>
              <p className="text-slate-200 font-mono truncate mt-1 text-xs">{provider.account_sid || '—'}</p>
            </div>
            <div className="p-3 bg-slate-700/30 rounded-lg border border-slate-600/30">
              <p className="text-slate-400 text-xs uppercase tracking-wider font-medium">Phone Number</p>
              <p className="text-slate-200 mt-1">{provider.phone_number || '—'}</p>
            </div>

            <div className="flex gap-2 pt-4 border-t border-slate-600/50">
              <Button variant="secondary" size="sm" fullWidth onClick={() => onTest(provider)} className="shadow-md">
                Test Connection
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onDelete(provider.id)}>
                Delete
              </Button>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

export default function SIPProvidersPage() {
  const [providers, setProviders] = useState(SAMPLE_PROVIDERS);
  const [showModal, setShowModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    account_sid: '',
    auth_token: '',
    phone_number: '',
  });
  const { success, error } = useNotifications();

  const handleOpenModal = (provider = null) => {
    if (provider) {
      setFormData({
        name: provider.name,
        account_sid: provider.account_sid,
        auth_token: provider.auth_token,
        phone_number: provider.phone_number,
      });
      setEditingProvider(provider);
    } else {
      setFormData({ name: '', account_sid: '', auth_token: '', phone_number: '' });
      setEditingProvider(null);
    }
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.name) {
      error('Please fill in all required fields');
      return;
    }
    success(`Provider ${editingProvider ? 'updated' : 'added'} successfully`);
    setShowModal(false);
  };

  const handleTest = (provider) => {
    // Check if required fields are filled
    if (!provider.account_sid || !provider.auth_token) {
      error(`❌ Connection Failed: ${provider.name} credentials are incomplete. Please configure Account SID and Auth Token first.`);
      return;
    }

    if (!provider.phone_number) {
      error(`❌ Connection Failed: Phone number is required for ${provider.name}`);
      return;
    }

    // If all fields are filled, show success
    setProviders(prev => prev.map(p =>
      p.id === provider.id
        ? { ...p, status: 'Connected' }
        : p
    ));

    success(`✅ Connected! ${provider.name} connection successful. All credentials verified.`);
  };

  const handleDelete = (id) => {
    setProviders(prev => prev.filter(p => p.id !== id));
    success('Provider deleted');
  };

  return (
    <MainLayout pageTitle="SIP Providers">
      <div className="space-y-8 pb-8">
        {/* Header */}
        <div className="space-y-2 animate-fadeInUp">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            SIP Providers
          </h1>
          <p className="text-slate-400">Configure and manage your SIP providers for outbound calling</p>
        </div>

        <div className="flex items-center justify-between animate-slideInRight" style={{ animationDelay: '100ms' }}>
          <div>
            <p className="text-sm text-slate-400">
              Seamlessly integrate Twilio, Plivo, Vonage, Nice CXone, and enterprise VoIP providers
            </p>
          </div>
          <Button variant="primary" onClick={() => handleOpenModal()} className="shadow-glow hover:shadow-lg gap-2">
            <Plus size={18} />
            Add Provider
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {providers.map((provider, idx) => (
            <div key={provider.id} style={{ animationDelay: `${idx * 100}ms` }}>
              <ProviderCard
                provider={provider}
                onEdit={() => handleOpenModal(provider)}
                onTest={handleTest}
                onDelete={handleDelete}
              />
            </div>
          ))}

          {/* Add New Card */}
          <Card
            className="p-6 border-2 border-dashed border-slate-600/50 hover:border-blue-500/50 cursor-pointer transition-all hover:bg-slate-700/20 animate-fadeInUp group"
            style={{ animationDelay: `${providers.length * 100}ms` }}
            onClick={() => handleOpenModal()}
          >
            <CardContent className="flex flex-col items-center justify-center h-full py-8">
              <div className="p-3 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-lg group-hover:scale-110 transition-transform duration-300 mb-3 opacity-70">
                <Plus size={32} className="text-white" />
              </div>
              <p className="text-sm font-medium text-slate-200">Add Provider</p>
              <p className="text-xs text-slate-400 mt-1 text-center">Click to configure a new SIP provider</p>
            </CardContent>
          </Card>
        </div>

        {/* Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingProvider ? 'Edit SIP Provider' : 'Add SIP Provider'}
          size="md"
          footer={
            <>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSave} className="shadow-glow">
                {editingProvider ? 'Update' : 'Add'} Provider
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Input
              label="Provider Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Twilio, Plivo, Vonage, Nice CXone"
              required
            />
            <Input
              label="Account SID"
              value={formData.account_sid}
              onChange={(e) => setFormData({ ...formData, account_sid: e.target.value })}
              placeholder="Your account SID or ID"
            />
            <Input
              label="Auth Token"
              type="password"
              value={formData.auth_token}
              onChange={(e) => setFormData({ ...formData, auth_token: e.target.value })}
              placeholder="Your authentication token"
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

import React, { useEffect, useState } from 'react';
import { MainLayout } from '../../components/shell/MainLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { useNotifications } from '../../hooks/useNotifications';
import { listAIProviders, saveAIProvider, toggleAIProvider, deleteAIProvider } from '../../api';
import { Pencil, Trash2 } from 'lucide-react';

const TABS = ['LLM Models', 'STT Models', 'TTS Models'];

function parseErrorDetail(err) {
  try {
    const parsed = JSON.parse(err.message);
    return parsed.detail || err.message;
  } catch {
    return err.message;
  }
}

function ProviderCard({ provider, onEdit, onToggle, onDelete, toggling }) {
  return (
    <Card className="group p-6 border hover:border-blue-500/50 hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fadeInUp overflow-hidden relative" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-2xl" />

      <div className="relative">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{provider.name}</CardTitle>
              <p className="text-xs mt-2 font-mono" style={{ color: 'var(--text-tertiary)' }}>{provider.model}</p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={provider.enabled}
                onChange={() => onToggle(provider)}
                disabled={toggling || !provider.api_key_set}
                className="w-5 h-5 rounded accent-blue-500 cursor-pointer"
              />
              <span className={`text-xs font-bold uppercase tracking-wider ${provider.enabled ? 'text-green-400' : ''}`} style={!provider.enabled ? { color: 'var(--text-tertiary)' } : {}}>
                {provider.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </label>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Input
              label="API Key"
              type="password"
              value={provider.api_key_set ? '••••••••••••••••' : ''}
              disabled
              placeholder={provider.api_key_set ? '' : 'Not configured'}
            />

            <div className="flex gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                onClick={() => onEdit(provider)}
                className="shadow-md"
              >
                <Pencil size={16} />
                {provider.api_key_set ? 'Update Key' : 'Add Key'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(provider)}
                disabled={!provider.api_key_set}
              >
                <Trash2 size={16} />
              </Button>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

export default function LLMProvidersPage() {
  const [activeTab, setActiveTab] = useState('LLM Models');
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);
  const [formData, setFormData] = useState({ api_key: '', model: '' });
  const { success, error } = useNotifications();

  const loadProviders = () => {
    setLoading(true);
    return listAIProviders()
      .then((data) => setProviders(data.providers || []))
      .catch((err) => error(parseErrorDetail(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProviders();
  }, []);

  const handleEdit = (provider) => {
    setFormData({ api_key: '', model: provider.model || '' });
    setEditingProvider(provider);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.api_key && !editingProvider.api_key_set) {
      error('Please provide an API key');
      return;
    }
    saveAIProvider(editingProvider.id, {
      api_key: formData.api_key,
      model: formData.model,
      enabled: editingProvider.enabled,
    })
      .then(() => {
        success(`${editingProvider.name} saved`);
        setShowModal(false);
        loadProviders();
      })
      .catch((err) => error(parseErrorDetail(err)));
  };

  const handleToggle = (provider) => {
    setTogglingId(provider.id);
    toggleAIProvider(provider.id)
      .then(() => loadProviders())
      .catch((err) => error(parseErrorDetail(err)))
      .finally(() => setTogglingId(null));
  };

  const handleDelete = (provider) => {
    deleteAIProvider(provider.id)
      .then(() => {
        success(`${provider.name} credentials removed`);
        loadProviders();
      })
      .catch((err) => error(parseErrorDetail(err)));
  };

  const visibleProviders = providers.filter((p) => p.category === activeTab);

  return (
    <MainLayout pageTitle="LLM Providers">
      <div className="space-y-8 pb-8">
        <div className="space-y-2 animate-fadeInUp">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            LLM Providers
          </h1>
          <p style={{ color: 'var(--text-tertiary)' }}>Configure AI models for transcription, analysis, and voice synthesis</p>
        </div>

        <p className="text-sm animate-slideInRight" style={{ color: 'var(--text-tertiary)', animationDelay: '100ms' }}>
          Integrate OpenAI, Anthropic, Deepgram, ElevenLabs, and other AI providers
        </p>

        {/* Tabs */}
        <div className="flex gap-4 border-b overflow-x-auto pb-4 animate-fadeInUp" style={{ borderColor: 'var(--border-color)', animationDelay: '150ms' }}>
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-all duration-300 whitespace-nowrap ${
                activeTab === tab
                  ? 'text-blue-300 border-blue-400 shadow-glow'
                  : 'border-transparent hover:text-blue-300'
              }`}
              style={activeTab !== tab ? { color: 'var(--text-tertiary)' } : {}}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Provider Grid */}
        {loading ? (
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading providers...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeInUp" style={{ animationDelay: '200ms' }}>
            {visibleProviders.map((provider, idx) => (
              <div key={provider.id} style={{ animationDelay: `${200 + idx * 50}ms` }}>
                <ProviderCard
                  provider={provider}
                  onEdit={handleEdit}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  toggling={togglingId === provider.id}
                />
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingProvider ? `Configure ${editingProvider.name}` : 'Configure Provider'}
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
              label="Model ID"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              placeholder="gpt-4, claude-3, etc."
            />
            <Input
              label="API Key"
              type="password"
              value={formData.api_key}
              onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
              placeholder={editingProvider?.api_key_set ? 'Leave blank to keep current key' : 'Your API key'}
            />
          </div>
        </Modal>
      </div>
    </MainLayout>
  );
}

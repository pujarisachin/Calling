import React, { useState } from 'react';
import { MainLayout } from '../../components/shell/MainLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { useNotifications } from '../../hooks/useNotifications';
import { Brain, Plus, Copy, Check } from 'lucide-react';

const TABS = ['LLM Models', 'STT Models', 'TTS Models'];

const SAMPLE_LLMS = {
  'LLM Models': [
    { id: '1', name: 'OpenAI', model: 'gpt-4', configured: true },
    { id: '2', name: 'Anthropic', model: 'claude-3', configured: false },
  ],
  'STT Models': [
    { id: '3', name: 'Deepgram', model: 'nova-2', configured: true },
    { id: '4', name: 'Whisper', model: 'base', configured: false },
  ],
  'TTS Models': [
    { id: '5', name: 'ElevenLabs', model: 'multilingual-v2', configured: true },
    { id: '6', name: 'Google', model: 'neural2-en-US-C', configured: false },
  ],
};

function ProviderCard({ provider, onCopy, onToggle, onDelete }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(provider.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="group p-6 border hover:border-blue-500/50 hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fadeInUp overflow-hidden relative" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
      {/* Gradient background effect */}
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
                checked={provider.configured}
                onChange={() => onToggle(provider.id)}
                className="w-5 h-5 rounded accent-blue-500 cursor-pointer"
              />
              <span className={`text-xs font-bold uppercase tracking-wider ${provider.configured ? 'text-green-400' : ''}`} style={!provider.configured ? { color: 'var(--text-tertiary)' } : {}}>
                {provider.configured ? 'Enabled' : 'Disabled'}
              </span>
            </label>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Input
              label="API Key"
              type="password"
              value="••••••••••••••••"
              disabled
              placeholder="API key (masked)"
            />

            <div className="flex gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                onClick={handleCopy}
                className={`${copied ? 'bg-green-500/20 text-green-300' : ''} shadow-md`}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied' : 'Copy Key'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(provider.id)}
              >
                Delete
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
  const [providers, setProviders] = useState(SAMPLE_LLMS);
  const [showModal, setShowModal] = useState(false);
  const { success } = useNotifications();

  const handleToggle = (id) => {
    setProviders(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].map(p =>
        p.id === id ? { ...p, configured: !p.configured } : p
      ),
    }));
  };

  const handleDelete = (id) => {
    setProviders(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].filter(p => p.id !== id),
    }));
    success('Provider removed');
  };

  return (
    <MainLayout pageTitle="LLM Providers">
      <div className="space-y-8 pb-8">
        {/* Header */}
        <div className="space-y-2 animate-fadeInUp">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            LLM Providers
          </h1>
          <p style={{ color: 'var(--text-tertiary)' }}>Configure AI models for transcription, analysis, and voice synthesis</p>
        </div>

        <div className="flex items-center justify-between animate-slideInRight" style={{ animationDelay: '100ms' }}>
          <div>
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              Integrate OpenAI, Anthropic, Deepgram, ElevenLabs, and other AI providers
            </p>
          </div>
          <Button variant="primary" onClick={() => setShowModal(true)} className="shadow-glow hover:shadow-lg gap-2">
            <Plus size={18} />
            Add Provider
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b overflow-x-auto pb-4 animate-fadeInUp" style={{ borderColor: 'var(--border-color)', animationDelay: '150ms' }}>
          {TABS.map((tab, idx) => (
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeInUp" style={{ animationDelay: '200ms' }}>
          {providers[activeTab]?.map((provider, idx) => (
            <div key={provider.id} style={{ animationDelay: `${200 + idx * 50}ms` }}>
              <ProviderCard
                provider={provider}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            </div>
          ))}
        </div>

        {/* Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={`Add ${activeTab.replace(' Models', '')}`}
          size="md"
          footer={
            <>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => { success('Provider added'); setShowModal(false); }}>
                Add Provider
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Input
              label="Provider Name"
              placeholder={activeTab === 'LLM Models' ? 'OpenAI, Anthropic, etc.' : ''}
            />
            <Input
              label="Model ID"
              placeholder="gpt-4, claude-3, etc."
            />
            <Input
              label="API Key"
              type="password"
              placeholder="Your API key"
            />
            <Input
              label="Endpoint (Optional)"
              placeholder="Custom API endpoint"
            />
          </div>
        </Modal>
      </div>
    </MainLayout>
  );
}

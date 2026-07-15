import React, { useState } from 'react';
import { MainLayout } from '../../components/shell/MainLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { useNotifications } from '../../hooks/useNotifications';
import { User, Users, Key, Bell, CreditCard, Copy, Trash2, Plus } from 'lucide-react';

const TABS = ['Profile', 'Team', 'API Keys', 'Notifications', 'Billing'];

function ProfileTab() {
  const { success } = useNotifications();

  return (
    <div className="space-y-6 animate-fadeInUp">
      <Card className="p-6 border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
        <CardHeader>
          <CardTitle className="text-gradient">Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center gap-4 pb-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-full flex items-center justify-center text-inherit font-bold text-xl shadow-lg">
                AC
              </div>
              <div>
                <p className="font-semibold text-inherit">AI Caller</p>
                <p className="text-sm text-inherit">Platform Admin</p>
              </div>
            </div>

            <div className="space-y-4">
              <Input label="Name" value="AI Caller" />
              <Input label="Email" type="email" value="admin@phantomcaller.io" />
              <Input label="Role" disabled value="Platform Admin" />
            </div>

            <div className="p-4 border rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)' }}>
              <p className="text-sm font-bold mb-4 uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>Change Password</p>
              <div className="space-y-3">
                <Input label="Current Password" type="password" />
                <Input label="New Password" type="password" />
                <Input label="Confirm Password" type="password" />
              </div>
            </div>

            <Button variant="primary" onClick={() => { window.location.reload(); success('Profile updated') }} className="shadow-glow hover:shadow-lg w-full">
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function APIKeysTab() {
  const [keys, setKeys] = useState([
    { id: 1, name: 'Production Key', key: 'pk_live_xxxxxxxxxxxxx', created: '2024-01-10', lastUsed: '2024-01-15' },
    { id: 2, name: 'Development Key', key: 'pk_test_xxxxxxxxxxxxx', created: '2024-01-05', lastUsed: '2024-01-14' },
  ]);
  const { success } = useNotifications();

  const handleCopy = (key) => {
    navigator.clipboard.writeText(key);
    success('API key copied to clipboard');
  };

  const handleRevoke = (id) => {
    setKeys(keys.filter(k => k.id !== id));
    success('API key revoked');
  };

  return (
    <div className="space-y-6 animate-fadeInUp">
      <div className="flex justify-end">
        <Button variant="primary" className="shadow-glow gap-2">
          <Plus size={18} />
          Generate New Key
        </Button>
      </div>

      {keys.map((apiKey, idx) => (
        <Card key={apiKey.id} className="p-6 border animate-fadeInUp" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', animationDelay: `${(idx + 1) * 100}ms` }}>
          <CardHeader>
            <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <CardTitle className="text-lg" style={{ color: 'var(--text-primary)' }}>{apiKey.name}</CardTitle>
              <Badge variant="success" size="sm" className="uppercase font-bold">Active</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 pt-4">
              <div>
                <p className="text-xs text-inherit uppercase tracking-wider font-medium mb-2">API Key</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-3 border rounded text-xs font-mono" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
                    {apiKey.key}
                  </code>
                  <Button variant="ghost" size="sm" onClick={() => handleCopy(apiKey.key)} style={{ ':hover': { backgroundColor: 'var(--bg-tertiary)' } }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-tertiary)'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
                    <Copy size={16} />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)' }}>
                  <p className="text-xs uppercase tracking-wider font-medium" style={{ color: 'var(--text-tertiary)' }}>Created</p>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{apiKey.created}</p>
                </div>
                <div className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)' }}>
                  <p className="text-xs uppercase tracking-wider font-medium" style={{ color: 'var(--text-tertiary)' }}>Last Used</p>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{apiKey.lastUsed}</p>
                </div>
              </div>

              <Button variant="danger" size="sm" onClick={() => handleRevoke(apiKey.id)} className="w-full">
                <Trash2 size={16} />
                Revoke Key
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function NotificationsTab() {
  const [notifications, setNotifications] = useState({
    callComplete: true,
    summaryReady: true,
    providerError: false,
    testFailed: true,
  });

  return (
    <div className="space-y-4 animate-fadeInUp">
      {[
        { key: 'callComplete', label: 'Call Complete', desc: 'Get notified when a test call finishes' },
        { key: 'summaryReady', label: 'Summary Ready', desc: 'Get notified when the analysis is ready' },
        { key: 'providerError', label: 'Provider Error', desc: 'Get notified of SIP/LLM provider issues' },
        { key: 'testFailed', label: 'Test Failed', desc: 'Get notified when a test fails' },
      ].map((item, idx) => (
        <Card key={item.key} className="p-4 border transition-all animate-slideInLeft" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', animationDelay: `${idx * 50}ms` }}>
          <CardContent className="py-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-inherit">{item.label}</p>
                <p className="text-sm text-inherit mt-1">{item.desc}</p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={notifications[item.key]}
                  onChange={(e) => setNotifications(prev => ({ ...prev, [item.key]: e.target.checked }))}
                  className="w-5 h-5 rounded accent-blue-500 cursor-pointer"
                />
              </label>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button variant="primary" fullWidth onClick={() => alert('Preferences saved')} className="shadow-glow hover:shadow-lg mt-4">
        Save Notification Preferences
      </Button>
    </div>
  );
}

function BillingTab() {
  return (
    <div className="space-y-6 animate-fadeInUp">
      <Card className="p-6 border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
        <CardHeader>
          <CardTitle className="text-gradient">Current Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6 pt-4">
            <div className="p-4 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-xs uppercase tracking-wider font-medium" style={{ color: 'var(--text-tertiary)' }}>Plan</p>
              <p className="text-3xl font-bold text-blue-300 mt-2">Professional</p>
            </div>
            <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)' }}>
              <p className="text-xs uppercase tracking-wider font-medium" style={{ color: 'var(--text-tertiary)' }}>Monthly Cost</p>
              <p className="text-3xl font-bold mt-2" style={{ color: 'var(--text-primary)' }}>$499<span className="text-lg" style={{ color: 'var(--text-tertiary)' }}>/month</span></p>
            </div>
            <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)' }}>
              <p className="text-xs uppercase tracking-wider font-medium mb-3" style={{ color: 'var(--text-tertiary)' }}>Usage This Month</p>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>847 / 1,000 tests</span>
                  <span className="text-sm font-bold text-blue-300">84.7%</span>
                </div>
                <div className="h-3 rounded-full overflow-hidden border" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)' }}>
                  <div className="h-full w-[84.7%] bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 shadow-glow" />
                </div>
              </div>
            </div>

            <Button variant="primary" fullWidth className="shadow-glow hover:shadow-lg">
              <CreditCard size={18} />
              Upgrade Plan
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="p-6 border animate-fadeInUp" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', animationDelay: '100ms' }}>
        <CardHeader>
          <CardTitle className="text-gradient">Billing History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 pt-4">
            {[
              { date: '2024-01-15', amount: '$499.00', status: 'Paid' },
              { date: '2023-12-15', amount: '$499.00', status: 'Paid' },
              { date: '2023-11-15', amount: '$499.00', status: 'Paid' },
            ].map((invoice, idx) => (
              <div key={idx} className="flex items-center justify-between py-3 px-3 border-b last:border-0 rounded transition-colors"
                style={{ borderColor: 'var(--border-color)' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-tertiary)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{invoice.date}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Invoice</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{invoice.amount}</p>
                  <Badge variant="success" size="sm" className="mt-1 uppercase font-bold">{invoice.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TeamTab() {
  return (
    <div className="space-y-6 animate-fadeInUp">
      <Button variant="primary" className="shadow-glow hover:shadow-lg gap-2">
        <Plus size={18} />
        Invite Team Member
      </Button>

      <Card className="p-6 border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
        <CardHeader>
          <CardTitle className="text-gradient">Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 pt-4">
            {[
              { name: 'AI Caller', email: 'admin@phantomcaller.io', role: 'Owner' },
              { name: 'Test Agent', email: 'agent@phantomcaller.io', role: 'Member' },
            ].map((member, idx) => (
              <div key={idx} className="flex items-center justify-between py-4 px-3 border-b last:border-0 rounded transition-colors animate-slideInLeft"
                style={{ borderColor: 'var(--border-color)', animationDelay: `${idx * 100}ms` }}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-tertiary)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
                <div>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{member.name}</p>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{member.email}</p>
                </div>
                <Badge variant={member.role === 'Owner' ? 'primary' : 'default'} size="sm" className="uppercase font-bold">
                  {member.role}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('Profile');

  const tabComponents = {
    Profile: <ProfileTab />,
    Team: <TeamTab />,
    'API Keys': <APIKeysTab />,
    Notifications: <NotificationsTab />,
    Billing: <BillingTab />,
  };

  return (
    <MainLayout pageTitle="Settings">
      <div className="space-y-8 pb-8">
        {/* Header */}
        <div className="space-y-2 animate-fadeInUp">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            Settings
          </h1>
          <p style={{ color: 'var(--text-tertiary)' }}>Manage your account, team, and billing preferences</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-4 animate-slideInLeft border-b" style={{ borderColor: 'var(--border-color)', animationDelay: '100ms' }}>
          {TABS.map((tab, idx) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-all duration-300 ${
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

        {/* Tab Content */}
        <div>
          {tabComponents[activeTab]}
        </div>
      </div>
    </MainLayout>
  );
}

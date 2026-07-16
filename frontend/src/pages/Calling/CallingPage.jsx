import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '../../components/shell/MainLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input, Textarea, Select } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Skeleton } from '../../components/common/Skeleton';
import { useNotifications } from '../../hooks/useNotifications';
import { createTest, fetchTestResult, endCall } from '../../api';
import { Phone, Download, Clock, BarChart3, AlertCircle, CheckCircle, Globe } from 'lucide-react';

// Comprehensive language support with accents and dialects
const LANGUAGES = [
  { code: 'en-US', name: 'English (US)', accent: 'American', region: 'United States' },
  { code: 'en-GB', name: 'English (UK)', accent: 'British', region: 'United Kingdom' },
  { code: 'en-IN', name: 'English (India)', accent: 'Indian', region: 'India' },
  { code: 'en-AU', name: 'English (Australia)', accent: 'Australian', region: 'Australia' },
  { code: 'es-ES', name: 'Spanish (Spain)', accent: 'Castilian', region: 'Spain' },
  { code: 'es-MX', name: 'Spanish (Mexico)', accent: 'Mexican', region: 'Mexico' },
  { code: 'es-AR', name: 'Spanish (Argentina)', accent: 'Rioplatense', region: 'Argentina' },
  { code: 'fr-FR', name: 'French (France)', accent: 'Parisian', region: 'France' },
  { code: 'fr-CA', name: 'French (Canada)', accent: 'Québécois', region: 'Canada' },
  { code: 'de-DE', name: 'German (Germany)', accent: 'Standard German', region: 'Germany' },
  { code: 'de-AT', name: 'German (Austria)', accent: 'Austrian', region: 'Austria' },
  { code: 'it-IT', name: 'Italian (Italy)', accent: 'Standard Italian', region: 'Italy' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)', accent: 'Brazilian', region: 'Brazil' },
  { code: 'pt-PT', name: 'Portuguese (Portugal)', accent: 'European', region: 'Portugal' },
  { code: 'ja-JP', name: 'Japanese (Japan)', accent: 'Tokyo', region: 'Japan' },
  { code: 'zh-CN', name: 'Mandarin (China)', accent: 'Standard Mandarin', region: 'China' },
  { code: 'zh-TW', name: 'Mandarin (Taiwan)', accent: 'Traditional Mandarin', region: 'Taiwan' },
  { code: 'ko-KR', name: 'Korean (Korea)', accent: 'Seoul', region: 'South Korea' },
  { code: 'ru-RU', name: 'Russian (Russia)', accent: 'Moscow', region: 'Russia' },
  { code: 'ar-SA', name: 'Arabic (Saudi Arabia)', accent: 'Modern Standard Arabic', region: 'Saudi Arabia' },
  { code: 'ar-AE', name: 'Arabic (UAE)', accent: 'Gulf Arabic', region: 'United Arab Emirates' },
  { code: 'hi-IN', name: 'Hindi (India)', accent: 'Standard Hindi', region: 'India' },
  { code: 'th-TH', name: 'Thai (Thailand)', accent: 'Bangkok Thai', region: 'Thailand' },
  { code: 'nl-NL', name: 'Dutch (Netherlands)', accent: 'Standard Dutch', region: 'Netherlands' },
];

const defaultForm = {
  phone_number: '',
  test_name: '',
  test_scenario: '',
  expected_conversation_flow: '',
  success_criteria: '',
  additional_instructions: '',
  test_data: '',
  persona_instructions: '',
  agent_language: 'en-US',
  agent_accent_preference: 'neutral',
  enable_recording: false,
};

function parseCriteria(raw) {
  return raw.split('\n').map(item => item.trim()).filter(Boolean);
}

function TestForm({ onSubmit, loading }) {
  const [form, setForm] = useState(defaultForm);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      success_criteria: parseCriteria(form.success_criteria),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg mb-6">
        <p className="text-sm text-text-secondary">Configure your test parameters below and start testing your voice application</p>
      </div>

      <Input
        label="Target Phone Number"
        name="phone_number"
        value={form.phone_number}
        onChange={handleChange}
        placeholder="+1XXXXXXXXXX"
        required
      />

      <Input
        label="Test Name"
        name="test_name"
        value={form.test_name}
        onChange={handleChange}
        placeholder="e.g., Customer Service Bot - Order Status"
        required
      />

      <Textarea
        label="Test Scenario"
        name="test_scenario"
        value={form.test_scenario}
        onChange={handleChange}
        placeholder="Describe what the caller should do..."
        rows={4}
        required
      />

      <Textarea
        label="Expected Conversation Flow (Optional)"
        name="expected_conversation_flow"
        value={form.expected_conversation_flow}
        onChange={handleChange}
        placeholder="Describe the expected conversation flow..."
        rows={3}
      />

      <Textarea
        label="Success Criteria (One per line)"
        name="success_criteria"
        value={form.success_criteria}
        onChange={handleChange}
        placeholder="Bot should answer within 2 seconds&#10;Bot should provide order status&#10;Bot should offer additional help"
        rows={4}
        required
      />

      <Textarea
        label="Additional Instructions (Optional)"
        name="additional_instructions"
        value={form.additional_instructions}
        onChange={handleChange}
        placeholder="Any special instructions for the test..."
        rows={2}
      />

      <Textarea
        label="Test Data (Optional)"
        name="test_data"
        value={form.test_data}
        onChange={handleChange}
        placeholder={"Account number: 123456789&#10;Order ID: ORD-20240115-001"}
        rows={3}
      />

      <Textarea
        label="Caller Behavior (Optional)"
        name="persona_instructions"
        value={form.persona_instructions}
        onChange={handleChange}
        placeholder={"Be polite and professional&#10;Ask for account details before order status"}
        rows={3}
      />

      {/* Language Selection Section */}
      <div className="p-4 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <Globe size={18} className="text-blue-400" />
          <h3 className="font-semibold text-text-primary">Agent Language Settings</h3>
        </div>
        <p className="text-xs text-text-secondary mb-4">Select the language and accent for the AI agent to use during the call</p>

        <div className="space-y-4">
          <Select
            label="Agent Language"
            name="agent_language"
            value={form.agent_language}
            onChange={handleChange}
            required
          >
            <option value="">Select a language...</option>
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name} • {lang.accent}
              </option>
            ))}
          </Select>

          {form.agent_language && (
            <div className="p-3 bg-bg-tertiary border rounded-lg">
              <p className="text-xs text-text-secondary font-semibold uppercase mb-2">Current Selection</p>
              {(() => {
                const selectedLang = LANGUAGES.find(l => l.code === form.agent_language);
                return selectedLang ? (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-text-primary">{selectedLang.name}</p>
                    <div className="flex gap-3 text-xs text-text-secondary">
                      <span>🎤 Accent: {selectedLang.accent}</span>
                      <span>📍 Region: {selectedLang.region}</span>
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          )}

          <Select
            label="Accent Preference (Optional)"
            name="agent_accent_preference"
            value={form.agent_accent_preference}
            onChange={handleChange}
          >
            <option value="neutral">Neutral/Standard</option>
            <option value="formal">Formal/Professional</option>
            <option value="casual">Casual/Friendly</option>
            <option value="regional">Regional/Local</option>
            <option value="native">Native Speaker</option>
          </Select>
        </div>
      </div>

      <label className="flex items-center gap-3 p-4 bg-bg-tertiary border rounded-lg hover:bg-bg-tertiary transition cursor-pointer group">
        <input
          type="checkbox"
          name="enable_recording"
          checked={form.enable_recording}
          onChange={handleChange}
          className="w-5 h-5 rounded accent-blue-500 cursor-pointer"
        />
        <span className="text-sm text-text-secondary group-hover:text-text-primary transition">Record call in Twilio</span>
      </label>

      <Button type="submit" variant="primary" fullWidth disabled={loading} className="shadow-glow hover:shadow-lg mt-6">
        {loading ? 'Starting Test...' : 'Start Test'}
      </Button>
    </form>
  );
}

function CallMonitor({ testId, onTestComplete, agentLanguage }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [endingCall, setEndingCall] = useState(false);
  const { success, error } = useNotifications();

  const callStatus = result?.call?.status || 'queued';
  const isFinished = useMemo(
    () => ['completed', 'failed', 'busy', 'no-answer', 'canceled'].includes(callStatus),
    [callStatus]
  );

  // Get language display info
  const languageInfo = LANGUAGES.find(l => l.code === agentLanguage);
  const languageDisplay = languageInfo?.name || 'English (US)';

  useEffect(() => {
    let pollTimeout;
    const poll = async () => {
      try {
        const data = await fetchTestResult(testId);
        setResult(data);
        setLoading(false);

        if (isFinished) {
          onTestComplete(data);
          return;
        }

        pollTimeout = setTimeout(poll, 2000);
      } catch (err) {
        error('Failed to fetch test status: ' + err.message);
        setLoading(false);
      }
    };

    poll();
    return () => clearTimeout(pollTimeout);
  }, [testId, isFinished, onTestComplete, error]);

  const handleEndCall = async () => {
    setEndingCall(true);
    try {
      await endCall(testId);
      success('Call ended successfully');
    } catch (err) {
      error('Failed to end call: ' + err.message);
    } finally {
      setEndingCall(false);
    }
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Call Status Card */}
      <Card className="p-6 border border animate-scaleIn">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-gradient">Call Status</CardTitle>
            <div className="flex gap-2">
              <Badge variant={isFinished ? 'warning' : 'success'} className="uppercase text-xs font-bold tracking-wide">
                {callStatus.charAt(0).toUpperCase() + callStatus.slice(1)}
              </Badge>
              <Badge variant="info" className="uppercase text-xs font-bold tracking-wide flex items-center gap-1">
                <Globe size={12} />
                {languageDisplay}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="p-4 bg-bg-tertiary rounded-lg border">
              <p className="text-xs text-text-secondary uppercase tracking-wider font-medium">Call Duration</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mt-2">
                {loading ? '-' : `${result?.call?.duration_seconds || 0}s`}
              </p>
            </div>
            <div className="p-4 bg-bg-tertiary rounded-lg border">
              <p className="text-xs text-text-secondary uppercase tracking-wider font-medium">Call ID</p>
              <p className="text-sm font-mono text-text-secondary truncate mt-2">
                {loading ? <Skeleton className="h-4 w-32" /> : (result?.id || '-')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Transcript */}
      <Card className="p-6 border border animate-fadeInUp flex-1 flex flex-col min-h-0" style={{ animationDelay: '100ms' }}>
        <CardHeader>
          <CardTitle className="text-gradient flex items-center gap-2">
            <span>Live Transcript</span>
            {!isFinished && <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col min-h-0">
          <div className="bg-input-bg border rounded-lg p-4 flex-1 min-h-[22rem] overflow-y-auto space-y-3">
            {loading && (
              <>
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-2/3" />
              </>
            )}
            {!loading && (!result?.transcript || result.transcript.length === 0) ? (
              <p className="text-sm text-text-secondary text-center py-12">
                {isFinished ? 'No transcript available' : 'Waiting for speech...'}
              </p>
            ) : (
              (result?.transcript || []).map((item, idx) => {
                const isBot = /bot/i.test(item.speaker);
                return (
                  <div key={idx} className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}>
                    <div className={`text-sm p-3 rounded-lg border max-w-[80%] ${
                      isBot
                        ? 'bg-purple-500/10 border-purple-500/30'
                        : 'bg-blue-500/10 border-blue-500/30'
                    }`}>
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <span className={`font-semibold ${isBot ? 'text-purple-300' : 'text-blue-300'}`}>
                          {item.speaker}
                        </span>
                        <span className="text-xs text-text-secondary">
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <span className="text-text-secondary">{item.text}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="flex gap-2 animate-slideInUp" style={{ animationDelay: '200ms' }}>
        <Button
          variant={isFinished ? 'secondary' : 'danger'}
          size="md"
          onClick={handleEndCall}
          disabled={endingCall || isFinished}
          fullWidth
          className="shadow-lg hover:shadow-xl"
        >
          <Phone size={18} />
          {endingCall ? 'Ending...' : 'End Call'}
        </Button>
      </div>
    </div>
  );
}

function ResultsPanel({ result }) {
  if (!result?.analysis) {
    return (
      <Card className="p-6 border border">
        <CardContent className="py-12 text-center">
          <p className="text-text-secondary">Analysis not yet available</p>
        </CardContent>
      </Card>
    );
  }

  const analysis = result.analysis;

  return (
    <div className="space-y-4">
      {/* Overall Result */}
      <Card className="p-6 border border animate-fadeInUp">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-gradient">
            <span>Overall Result</span>
            <Badge variant={analysis.overall_result === 'PASS' ? 'success' : 'error'} className="uppercase">
              {analysis.overall_result}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-text-secondary leading-relaxed">{analysis.summary}</p>
        </CardContent>
      </Card>

      {/* Score */}
      <Card className="p-6 border border animate-fadeInUp" style={{ animationDelay: '100ms' }}>
        <CardHeader>
          <CardTitle className="text-gradient">Test Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  stroke="#334155"
                  strokeWidth="8"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  stroke="url(#scoreGradient)"
                  strokeWidth="8"
                  strokeDasharray={`${90 * Math.PI * (analysis.score / 100)} ${90 * Math.PI}`}
                  strokeLinecap="round"
                  style={{ filter: 'drop-shadow(0 0 10px rgba(75, 110, 245, 0.4))' }}
                />
                <defs>
                  <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="100%" stopColor="#4B6EF5" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                  {analysis.score}
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-text-secondary uppercase tracking-wider font-medium">Confidence</p>
                <p className="text-2xl font-bold text-blue-300 mt-1">{Math.round(analysis.confidence * 100)}%</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Criteria Evaluation */}
      {analysis.criteria_evaluation && analysis.criteria_evaluation.length > 0 && (
        <Card className="p-6 border border animate-fadeInUp" style={{ animationDelay: '200ms' }}>
          <CardHeader>
            <CardTitle className="text-gradient">Success Criteria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.criteria_evaluation.map((item, idx) => (
                <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg border ${
                  item.status === 'PASS'
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-red-500/10 border-red-500/30'
                }`}>
                  {item.status === 'PASS' ? (
                    <CheckCircle size={20} className="text-green-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary">{item.criterion}</p>
                    <p className="text-xs text-text-secondary mt-1">{item.notes}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Issues */}
      {analysis.issues && analysis.issues.length > 0 && (
        <Card className="p-6 border border animate-fadeInUp" style={{ animationDelay: '300ms' }}>
          <CardHeader>
            <CardTitle className="text-gradient">Issues Found</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.issues.map((issue, idx) => (
                <div key={idx} className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-xs font-bold text-red-400 uppercase tracking-wider">{issue.severity} • {issue.category}</p>
                  <p className="text-sm text-text-secondary mt-2">{issue.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Download Report */}
      <Button variant="secondary" fullWidth className="shadow-lg hover:shadow-xl">
        <Download size={18} />
        Download Report (PDF)
      </Button>
    </div>
  );
}

export default function CallingPage() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentTestId, setCurrentTestId] = useState(testId || null);
  const [result, setResult] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const { success, error } = useNotifications();

  const handleCreateTest = async (payload) => {
    setLoading(true);
    try {
      // Store selected language for display during call
      setSelectedLanguage(payload.agent_language || 'en-US');

      const created = await createTest(payload);
      setCurrentTestId(created.test_id);
      setShowResults(false);
      navigate(`/calling/${created.test_id}`);
      success(`Test created successfully! Agent will speak: ${LANGUAGES.find(l => l.code === payload.agent_language)?.name || 'English (US)'}`);
    } catch (err) {
      error('Failed to create test: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTestComplete = (data) => {
    setResult(data);
    setShowResults(true);
  };

  return (
    <MainLayout pageTitle="Calling">
      <div className="pb-8">
        {/* Header */}
        <div className="space-y-2 mb-8 animate-fadeInUp">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            Voice Testing
          </h1>
          <p className="text-text-secondary">Configure and run AI-powered voice tests in real-time</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel: Form or Results */}
          <div>
            {!showResults ? (
              <Card className="p-6 border border animate-fadeInUp" style={{ animationDelay: '100ms' }}>
                <CardHeader>
                  <CardTitle className="text-gradient">Create New Test</CardTitle>
                </CardHeader>
                <CardContent>
                  <TestForm onSubmit={handleCreateTest} loading={loading} />
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4 animate-fadeInUp" style={{ animationDelay: '100ms' }}>
                <ResultsPanel result={result} />
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => {
                    setShowResults(false);
                    setCurrentTestId(null);
                    navigate('/calling');
                  }}
                  className="shadow-lg"
                >
                  Create New Test
                </Button>
              </div>
            )}
          </div>

          {/* Right Panel: Monitor or Empty */}
          <div className="h-full">
            {currentTestId && !showResults ? (
              <CallMonitor testId={currentTestId} onTestComplete={handleTestComplete} agentLanguage={selectedLanguage} />
            ) : (
              <Card className="h-full flex items-center justify-center p-6 border border animate-scaleIn" style={{ animationDelay: '200ms' }}>
                <CardContent className="text-center">
                  <div className="p-4 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-xl w-fit mx-auto mb-4 opacity-80">
                    <Phone size={48} className="text-inherit" />
                  </div>
                  <p className="text-text-secondary font-medium">Create a test to begin monitoring</p>
                  <p className="text-inherit text-sm mt-2">Your live call transcripts will appear here</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

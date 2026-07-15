import React, { useState } from 'react';
import { MainLayout } from '../../components/shell/MainLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Download, TrendingUp, Zap, Play, Pause, Volume2, Clock, MessageSquare } from 'lucide-react';

const PAST_CONVERSATIONS = [
  {
    id: '1',
    name: 'Customer Service Bot - Order Status',
    date: '2024-01-15',
    time: '10:00 AM',
    duration: '3:45',
    sentiment: 'Positive',
    score: 95,
    language: 'English',
  },
  {
    id: '2',
    name: 'IVR System - Billing Inquiry',
    date: '2024-01-14',
    time: '2:30 PM',
    duration: '2:15',
    sentiment: 'Neutral',
    score: 88,
    language: 'English',
  },
  {
    id: '3',
    name: 'AI Assistant - Product Recommendation',
    date: '2024-01-13',
    time: '4:15 PM',
    duration: '5:20',
    sentiment: 'Positive',
    score: 92,
    language: 'Spanish',
  },
  {
    id: '4',
    name: 'Support Bot - Technical Issue',
    date: '2024-01-12',
    time: '11:45 AM',
    duration: '4:50',
    sentiment: 'Negative',
    score: 76,
    language: 'English',
  },
  {
    id: '5',
    name: 'Multi-language Test - French',
    date: '2024-01-11',
    time: '3:20 PM',
    duration: '3:30',
    sentiment: 'Positive',
    score: 91,
    language: 'French',
  },
];

export default function ConversationIntelligencePage() {
  const [activeTestId, setActiveTestId] = useState('1');
  const [isPlaying, setIsPlaying] = useState(false);

  const sampleData = {
    overall_sentiment: 'Positive',
    sentiment_score: 78,
    key_topics: ['Order Status', 'Shipping', 'Return Policy', 'Account Verification'],
    intent_detected: 'Customer Service - Order Inquiry',
    summary: 'The caller successfully inquired about their order status. The system provided accurate information about the shipment status and estimated delivery date. The interaction was professional and helpful.',
    confidence: 0.94,
    transcript: [
      { speaker: 'Caller', text: 'Hi, I need to check on my order status.', timestamp: '2024-01-15T10:00:00Z' },
      { speaker: 'Bot', text: 'Welcome to our customer service. I can help you with that. What is your order number?', timestamp: '2024-01-15T10:00:05Z' },
      { speaker: 'Caller', text: 'It is ORD-20240115-001', timestamp: '2024-01-15T10:00:10Z' },
      { speaker: 'Bot', text: 'Thank you. Your order is currently being shipped and should arrive within 2-3 business days. Is there anything else?', timestamp: '2024-01-15T10:00:15Z' },
    ]
  };

  const currentConversation = PAST_CONVERSATIONS.find(c => c.id === activeTestId);

  return (
    <MainLayout pageTitle="Conversation Intelligence">
      <div className="pb-8">
        {/* Header */}
        <div className="space-y-2 mb-8 animate-fadeInUp">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            Conversation Intelligence
          </h1>
          <p className="text-inherit">Advanced analytics, sentiment analysis & conversation history</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar: Past Conversations */}
          <div className="lg:col-span-1 animate-fadeInUp" style={{ animationDelay: '50ms' }}>
            <Card className="p-0 border border overflow-hidden h-full">
              <div className="p-4 border-b border-color bg-input-bg">
                <h3 className="font-semibold text-inherit flex items-center gap-2">
                  <MessageSquare size={18} />
                  Past Conversations
                </h3>
                <p className="text-xs text-inherit mt-1">Select to view analytics</p>
              </div>
              <div className="overflow-y-auto max-h-[600px]">
                {PAST_CONVERSATIONS.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setActiveTestId(conv.id)}
                    className={`w-full text-left p-3 border-b border-slate-700/30 transition-colors duration-200 ${
                      activeTestId === conv.id
                        ? 'bg-blue-500/20 border-l-2 border-l-blue-500'
                        : 'hover:bg-bg-tertiary'
                    }`}
                  >
                    <p className="text-sm font-medium text-inherit line-clamp-2">{conv.name}</p>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2 text-xs text-inherit">
                        <Clock size={12} />
                        {conv.date} • {conv.time}
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant={conv.sentiment === 'Positive' ? 'success' : conv.sentiment === 'Negative' ? 'error' : 'default'} size="sm">
                          {conv.sentiment}
                        </Badge>
                        <span className="text-xs font-semibold text-blue-400">{conv.score}%</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Main Content: Transcript + Recording */}
          <div className="lg:col-span-2 space-y-6 animate-fadeInUp" style={{ animationDelay: '100ms' }}>
            {/* Recording Player */}
            <Card className="p-6 border border">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Volume2 size={20} />
                    Call Recording
                  </span>
                  <span className="text-xs text-inherit font-normal">
                    {currentConversation?.duration}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-input-bg rounded-lg border">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="flex-shrink-0 p-3 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-full hover:scale-110 transition-transform"
                    >
                      {isPlaying ? (
                        <Pause size={20} className="text-inherit" />
                      ) : (
                        <Play size={20} className="text-inherit ml-0.5" />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 w-1/3 shadow-glow" />
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-inherit">
                        <span>1:45</span>
                        <span>{currentConversation?.duration}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-inherit text-center">
                    🎧 Click play to listen to the recording or download for offline review
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Transcript */}
            <Card className="p-6 border border">
              <CardHeader>
                <CardTitle className="text-gradient">Call Transcript</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {sampleData.transcript.map((item, idx) => (
                    <div key={idx} className={`p-4 rounded-lg border animate-slideInLeft ${
                      item.speaker === 'Caller'
                        ? 'bg-blue-500/10 border-blue-500/30'
                        : 'bg-purple-500/10 border-purple-500/30'
                    }`} style={{ animationDelay: `${idx * 50}ms` }}>
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant={item.speaker === 'Caller' ? 'primary' : 'default'} size="sm" className="uppercase font-bold">
                          {item.speaker}
                        </Badge>
                        <span className="text-xs text-inherit">
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-inherit">{item.text}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel: Analysis */}
          <div className="lg:col-span-1 space-y-4 animate-fadeInUp" style={{ animationDelay: '150ms' }}>
            {/* Sentiment */}
            <Card className="p-6 border border">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-gradient">
                  <span>Overall Sentiment</span>
                  <Badge variant="success" className="uppercase font-bold">{sampleData.overall_sentiment}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <div className="relative h-16 bg-bg-tertiary rounded-lg overflow-hidden border">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-500 shadow-glow"
                        style={{ width: `${sampleData.sentiment_score}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">{sampleData.sentiment_score}%</p>
                </div>
              </CardContent>
            </Card>

            {/* Key Topics */}
            <Card className="p-6 border border">
              <CardHeader>
                <CardTitle className="text-gradient">Key Topics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {sampleData.key_topics.map((topic, idx) => (
                    <Badge key={topic} variant="primary" size="md" className="animate-scaleIn" style={{ animationDelay: `${200 + idx * 50}ms` }}>
                      {topic}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Intent */}
            <Card className="p-6 border border">
              <CardHeader>
                <CardTitle className="text-gradient">Intent Detected</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-inherit font-medium">{sampleData.intent_detected}</p>
                <p className="text-xs text-inherit mt-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-400 rounded-full" />
                  Confidence: {Math.round(sampleData.confidence * 100)}%
                </p>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card className="p-6 border border">
              <CardHeader>
                <CardTitle className="text-gradient">Call Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-inherit leading-relaxed">{sampleData.summary}</p>
              </CardContent>
            </Card>

            {/* Download */}
            <Button variant="secondary" fullWidth className="shadow-lg hover:shadow-xl">
              <Download size={18} />
              Download Full Report (PDF)
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import { MainLayout } from '../../components/shell/MainLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { listTests, fetchTestResult, getTestRecordingUrl } from '../../api';
import { Download, Play, Pause, Volume2, Clock, MessageSquare } from 'lucide-react';

function sentimentBadgeVariant(sentiment) {
  if (sentiment === 'Positive') return 'success';
  if (sentiment === 'Negative') return 'error';
  return 'default';
}

function formatDuration(seconds) {
  if (seconds === null || seconds === undefined) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

function formatDate(isoString) {
  const d = new Date(isoString);
  return {
    date: d.toLocaleDateString(),
    time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}

export default function ConversationIntelligencePage() {
  const [conversations, setConversations] = useState([]);
  const [activeTestId, setActiveTestId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [listLoading, setListLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setListLoading(true);
    listTests({ limit: 50 })
      .then((data) => {
        if (cancelled) return;
        setConversations(data.items || []);
        if (data.items && data.items.length > 0) {
          setActiveTestId(data.items[0].id);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load conversations');
      })
      .finally(() => {
        if (!cancelled) setListLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!activeTestId) return;
    let cancelled = false;
    setDetailLoading(true);
    setIsPlaying(false);
    fetchTestResult(activeTestId)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load conversation details');
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTestId]);

  const currentConversation = conversations.find((c) => c.id === activeTestId);
  const analysis = detail?.analysis;
  const hasRecording = Boolean(detail?.call?.has_recording);

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  return (
    <MainLayout pageTitle="Conversation Intelligence">
      <div className="pb-8">
        <div className="space-y-2 mb-8 animate-fadeInUp">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            Conversation Intelligence
          </h1>
          <p className="text-inherit">Advanced analytics, sentiment analysis & conversation history</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg border border-red-500/30 bg-red-500/10 text-sm text-inherit">
            {error}
          </div>
        )}

        {!listLoading && conversations.length === 0 ? (
          <Card className="p-12 border border text-center">
            <p className="text-inherit">No completed tests yet. Run a test from the Calling page to see analytics here.</p>
          </Card>
        ) : (
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
                  {listLoading && (
                    <div className="p-4 text-sm text-inherit">Loading conversations...</div>
                  )}
                  {conversations.map((conv) => {
                    const { date, time } = formatDate(conv.created_at);
                    return (
                      <button
                        key={conv.id}
                        onClick={() => setActiveTestId(conv.id)}
                        className={`w-full text-left p-3 border-b border-slate-700/30 transition-colors duration-200 ${
                          activeTestId === conv.id
                            ? 'bg-blue-500/20 border-l-2 border-l-blue-500'
                            : 'hover:bg-bg-tertiary'
                        }`}
                      >
                        <p className="text-sm font-medium text-inherit line-clamp-2">{conv.test_name}</p>
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center gap-2 text-xs text-inherit">
                            <Clock size={12} />
                            {date} • {time}
                          </div>
                          <div className="flex items-center justify-between">
                            <Badge variant={sentimentBadgeVariant(conv.overall_sentiment)} size="sm">
                              {conv.overall_sentiment || 'Unknown'}
                            </Badge>
                            <span className="text-xs font-semibold text-blue-400">
                              {conv.score !== null && conv.score !== undefined ? `${conv.score}%` : '--'}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* Main Content: Transcript + Recording */}
            <div className="lg:col-span-2 space-y-6 animate-fadeInUp" style={{ animationDelay: '100ms' }}>
              <Card className="p-6 border border">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Volume2 size={20} />
                      Call Recording
                    </span>
                    <span className="text-xs text-inherit font-normal">
                      {formatDuration(currentConversation?.duration_seconds)}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {hasRecording ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-4 bg-input-bg rounded-lg border">
                        <button
                          onClick={togglePlayback}
                          className="flex-shrink-0 p-3 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-full hover:scale-110 transition-transform"
                        >
                          {isPlaying ? (
                            <Pause size={20} className="text-inherit" />
                          ) : (
                            <Play size={20} className="text-inherit ml-0.5" />
                          )}
                        </button>
                        <audio
                          ref={audioRef}
                          src={getTestRecordingUrl(activeTestId)}
                          onPlay={() => setIsPlaying(true)}
                          onPause={() => setIsPlaying(false)}
                          onEnded={() => setIsPlaying(false)}
                          className="flex-1"
                          controls
                        />
                      </div>
                      <p className="text-xs text-inherit text-center">
                        🎧 Click play to listen to the recording or download for offline review
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-inherit text-center py-6">
                      No recording available for this call. Enable recording when creating the test to capture audio.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="p-6 border border">
                <CardHeader>
                  <CardTitle className="text-gradient">Call Transcript</CardTitle>
                </CardHeader>
                <CardContent>
                  {detailLoading ? (
                    <p className="text-sm text-inherit">Loading transcript...</p>
                  ) : detail?.transcript && detail.transcript.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {detail.transcript.map((item, idx) => {
                        const isBot = /bot/i.test(item.speaker);
                        return (
                          <div
                            key={idx}
                            className={`p-4 rounded-lg border animate-slideInLeft ${
                              isBot ? 'bg-purple-500/10 border-purple-500/30' : 'bg-blue-500/10 border-blue-500/30'
                            }`}
                            style={{ animationDelay: `${idx * 50}ms` }}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <Badge variant={isBot ? 'default' : 'primary'} size="sm" className="uppercase font-bold">
                                {item.speaker}
                              </Badge>
                              <span className="text-xs text-inherit">
                                {new Date(item.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-sm text-inherit">{item.text}</p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-inherit">No transcript captured for this call.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Panel: Analysis */}
            <div className="lg:col-span-1 space-y-4 animate-fadeInUp" style={{ animationDelay: '150ms' }}>
              <Card className="p-6 border border">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-gradient">
                    <span>Overall Sentiment</span>
                    <Badge variant={sentimentBadgeVariant(analysis?.overall_sentiment)} className="uppercase font-bold">
                      {analysis?.overall_sentiment || 'N/A'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-4">
                    <div className="flex-1">
                      <div className="relative h-16 bg-bg-tertiary rounded-lg overflow-hidden border">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-500 shadow-glow"
                          style={{ width: `${analysis?.sentiment_score ?? 0}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                      {analysis?.sentiment_score ?? '--'}%
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="p-6 border border">
                <CardHeader>
                  <CardTitle className="text-gradient">Key Topics</CardTitle>
                </CardHeader>
                <CardContent>
                  {analysis?.key_topics && analysis.key_topics.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {analysis.key_topics.map((topic, idx) => (
                        <Badge
                          key={topic}
                          variant="primary"
                          size="md"
                          className="animate-scaleIn"
                          style={{ animationDelay: `${200 + idx * 50}ms` }}
                        >
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-inherit">No topics detected.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="p-6 border border">
                <CardHeader>
                  <CardTitle className="text-gradient">Intent Detected</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-inherit font-medium">{analysis?.intent || 'Unknown'}</p>
                  <p className="text-xs text-inherit mt-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-400 rounded-full" />
                    Confidence: {analysis?.confidence !== undefined ? Math.round(analysis.confidence * 100) : '--'}%
                  </p>
                </CardContent>
              </Card>

              <Card className="p-6 border border">
                <CardHeader>
                  <CardTitle className="text-gradient">Call Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-inherit leading-relaxed">
                    {analysis?.summary || 'No summary available yet.'}
                  </p>
                </CardContent>
              </Card>

              <Button
                variant="secondary"
                fullWidth
                className="shadow-lg hover:shadow-xl"
                disabled={!hasRecording}
                onClick={() => window.open(getTestRecordingUrl(activeTestId), '_blank')}
              >
                <Download size={18} />
                Download Recording
              </Button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Phone, Brain, Mic, BarChart3, Bell, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Logo } from '../components/icons/Logo';
import storyImage from '../components/icons/PhantonCaller Story.png';

const FEATURES = [
  {
    icon: Phone,
    title: 'Agent-to-Agent Calls',
    description: 'Deploy AI agents that test voice interactions autonomously with perfect accuracy.',
  },
  {
    icon: Zap,
    title: 'Multi-Provider SIP',
    description: 'Seamless integration with Twilio, Plivo, Vonage, and enterprise VoIP providers.',
  },
  {
    icon: Brain,
    title: 'LLM-Powered Intelligence',
    description: 'AI-driven analysis with sentiment detection, intent recognition, and quality scoring.',
  },
  {
    icon: Mic,
    title: 'Real-Time Transcription',
    description: 'Crystal-clear speech-to-text with automatic speaker identification and timestamps.',
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Comprehensive reports with deep insights, trends, and actionable recommendations.',
  },
  {
    icon: Bell,
    title: 'Smart Notifications',
    description: 'Instant alerts and real-time updates on test completion and critical events.',
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen text-inherit overflow-hidden" style={{ backgroundImage: 'linear-gradient(135deg, #0F172A 0%, #1A254A 50%, #0F172A 100%)' }}>
      {/* Animated background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
          style={{
            top: '20%',
            left: '10%',
            animation: 'float 20s ease-in-out infinite',
          }}
        />
        <div
          className="absolute w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
          style={{
            top: '50%',
            right: '10%',
            animation: 'float 15s ease-in-out infinite 2s',
          }}
        />
        <div
          className="absolute w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
          style={{
            bottom: '20%',
            left: '50%',
            animation: 'float 25s ease-in-out infinite 4s',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 backdrop-blur-md border-b z-40" style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', borderColor: 'var(--border-color)' }}>
          <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3 group cursor-pointer hover:opacity-80 transition" onClick={() => navigate('/')}>
              <Logo size={40} />
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                  PhantomCaller
                </h1>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Enterprise Voice Testing</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <a href="#features" className="hover:text-inherit transition duration-300" style={{ color: 'var(--text-secondary)' }}>Features</a>
              <a href="#benefits" className="hover:text-inherit transition duration-300" style={{ color: 'var(--text-secondary)' }}>Benefits</a>
              <a href="#docs" className="hover:text-inherit transition duration-300" style={{ color: 'var(--text-secondary)' }}>How It Works</a>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="gap-2"
              >
                Get Started <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="pt-32 pb-20 px-8 text-center min-h-screen flex flex-col items-center justify-center">
          <div className="max-w-4xl mx-auto space-y-8 animate-fadeInUp">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-sm font-medium">
              <Zap size={14} />
              Introducing PhantomCaller Platform
            </div>

            {/* Main Headline */}
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight text-inherit">
                AI-Powered
              </h1>
              <h1 className="text-6xl lg:text-7xl font-bold leading-tight gradient-text px-2">
                <span className="block">Voice</span>
                <span className="block">Testing at Scale</span>
              </h1>
              <p className="text-2xl" style={{ color: 'var(--text-secondary)' }}>Before your customers call, we do.</p>
            </div>

            {/* Subheading */}
            <p className="text-xl max-w-2xl mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Deploy AI agents to test voice bots at enterprise scale. Real conversations, real insights, zero manual testing. Your QA team's new superpower.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/dashboard')}
                className="gap-2 px-8 shadow-glow hover:shadow-lg"
              >
                Start Free Trial <ArrowRight size={20} />
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate('/docs')}
                className="px-8"
              >
                View Documentation
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-16 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <div className="space-y-2 animate-slideInLeft" style={{ animationDelay: '200ms' }}>
                <p className="text-3xl font-bold text-cyan-400">10K+</p>
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Tests Run Monthly</p>
              </div>
              <div className="space-y-2 animate-slideInLeft" style={{ animationDelay: '400ms' }}>
                <p className="text-3xl font-bold text-blue-400">94%</p>
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Average Accuracy</p>
              </div>
              <div className="space-y-2 animate-slideInLeft" style={{ animationDelay: '600ms' }}>
                <p className="text-3xl font-bold text-purple-400">50ms</p>
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Response Time</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 px-8" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 animate-fadeInUp">
              <h2 className="text-4xl lg:text-5xl font-bold mb-4">
                Enterprise-Grade Features
              </h2>
              <p className="text-xl" style={{ color: 'var(--text-secondary)' }}>
                Everything you need to test voice applications at scale
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {FEATURES.map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="group p-8 rounded-2xl border hover:border-blue-500/50 shadow-hover animate-fadeInUp transition-all duration-500"
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      borderColor: 'var(--border-color)',
                      animationDelay: `${idx * 100}ms`,
                    }}
                  >
                    <div className="p-3 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 w-fit rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Icon size={24} className="text-inherit" />
                    </div>
                    <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{feature.title}</h3>
                    <p style={{ color: 'var(--text-tertiary)' }}>{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ROI & Savings Section */}
        <section id="benefits" className="py-20 px-8" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16 animate-fadeInUp">
              <h2 className="text-4xl lg:text-5xl font-bold mb-4">
                Real Results. Measurable Impact.
              </h2>
              <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
                See how PhantomCaller transforms your testing efficiency
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: 'Time Saved',
                  value: '80%',
                  description: 'Reduce manual testing time from days to hours with autonomous AI-powered voice testing'
                },
                {
                  title: 'Cost Reduction',
                  value: '75%',
                  description: 'Eliminate manual QA costs while improving test coverage and accuracy'
                },
                {
                  title: 'Issue Detection',
                  value: '24/7',
                  description: 'Continuously test across 10+ languages and detect edge cases humans miss'
                },
              ].map((stat, idx) => (
                <div
                  key={stat.title}
                  className="p-8 rounded-2xl border hover:border-blue-500/50 transition-all duration-300 animate-fadeInUp"
                  style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', animationDelay: `${idx * 100}ms` }}
                >
                  <p className="text-sm font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-tertiary)' }}>{stat.title}</p>
                  <p className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
                    {stat.value}
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{stat.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Documentation Section */}
        <section id="docs" className="py-20 px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16 animate-fadeInUp">
              <h2 className="text-4xl lg:text-5xl font-bold mb-4">
                How It Works
              </h2>
              <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
                Understand the PhantomCaller advantage
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  step: '1',
                  title: 'Deploy AI Agents',
                  description: 'Create and configure AI voice agents that mimic real customer behavior and edge cases',
                  metrics: 'Setup Time: ~5 minutes per agent'
                },
                {
                  step: '2',
                  title: 'Run Autonomous Tests',
                  description: 'Agents call your voice bot 24/7, testing thousands of scenarios automatically',
                  metrics: 'Run 100 tests: ~15 minutes'
                },
                {
                  step: '3',
                  title: 'Analyze Results',
                  description: 'Get detailed transcripts, sentiment analysis, and issue detection in real-time',
                  metrics: 'Analysis Time: Instant'
                },
                {
                  step: '4',
                  title: 'Improve Quality',
                  description: 'Fix issues before your customers discover them with actionable insights',
                  metrics: 'Issue Detection Rate: 98%'
                },
              ].map((item, idx) => (
                <div
                  key={item.step}
                  className="p-8 rounded-2xl border hover:border-cyan-500/50 transition-all duration-300 animate-fadeInUp"
                  style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', animationDelay: `${idx * 100}ms` }}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-12 w-12 rounded-md bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 text-inherit font-bold text-lg">
                        {item.step}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{item.title}</h3>
                      <p className="text-sm mb-3" style={{ color: 'var(--text-tertiary)' }}>{item.description}</p>
                      <div className="pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
                        <p className="text-xs text-cyan-400 font-semibold">{item.metrics}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Product Story Section */}
        <section className="py-16 px-8" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 animate-fadeInUp">
              <h2 className="text-4xl lg:text-5xl font-bold mb-4">The PhantomCaller Advantage</h2>
              <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>See how we revolutionize voice bot testing</p>
            </div>
            <img
              src={storyImage}
              alt="PhantomCaller Story - Before & After"
              className="w-full rounded-2xl shadow-2xl border animate-fadeInUp"
              style={{ borderColor: 'var(--border-color)', animationDelay: '100ms' }}
            />
          </div>
        </section>

        {/* CTA Footer */}
        <section className="py-20 px-8 bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 text-inherit">
          <div className="max-w-3xl mx-auto text-center animate-fadeInUp">
            <h2 className="text-4xl font-bold mb-6">Ready to Transform Testing?</h2>
            <p className="text-lg mb-8" style={{ color: 'var(--text-secondary)' }}>
              Join enterprise teams automating voice testing at scale.
            </p>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/dashboard')}
              className="gap-2"
            >
              Start Your Free Trial <ArrowRight size={20} />
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-8 border-t text-center text-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--text-tertiary)' }}>
          <p>&copy; 2024 PhantomCaller. All rights reserved.</p>
          <p className="mt-2">Autonomous Voice Testing, Redefined.</p>
        </footer>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { MainLayout } from '../../components/shell/MainLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { ChevronDown, ChevronUp, TrendingUp, Clock, DollarSign, Zap, BarChart3 } from 'lucide-react';

const ROI_METRICS = [
  {
    metric: 'Time Saved Per 100 Tests',
    old: '40 hours',
    new: '8 hours',
    saved: '80%',
    description: 'Manual testing requires human agents. AI testing runs autonomously.'
  },
  {
    metric: 'Monthly Cost (Assuming 1000 tests)',
    old: '$8,000',
    new: '$2,000',
    saved: '75%',
    description: 'QA salaries vs subscription cost. Eliminate manual testing overhead.'
  },
  {
    metric: 'Test Coverage',
    old: '40 scenarios',
    new: '500+ scenarios',
    saved: '+1150%',
    description: 'AI agents test edge cases humans miss. 24/7 continuous testing.'
  },
  {
    metric: 'Issue Detection Rate',
    old: '60%',
    new: '98%',
    saved: '+63%',
    description: 'Systematic testing catches more issues before production.'
  },
];

const TIMING_EXAMPLES = [
  {
    scenario: 'Setup New Test Agent',
    time: '5-10 minutes',
    description: 'Configure AI agent behavior and test parameters',
    icon: Zap
  },
  {
    scenario: 'Run 100 Concurrent Tests',
    time: '12-15 minutes',
    description: 'Deploy 100 AI agents testing simultaneously',
    icon: Clock
  },
  {
    scenario: 'Get Full Analysis Report',
    time: 'Instant',
    description: 'Real-time transcription, sentiment analysis, and insights',
    icon: BarChart3
  },
  {
    scenario: 'Identify Critical Issues',
    time: '5 minutes',
    description: 'AI-powered anomaly detection on results',
    icon: TrendingUp
  },
];

const COST_CALCULATOR = {
  scenarios: [
    {
      name: 'Small Team',
      tests_per_month: 500,
      manual_hours: 200,
      manual_cost: 4000,
      phantom_cost: 1000,
      savings: 3000,
      payback_months: 0.5
    },
    {
      name: 'Medium Team',
      tests_per_month: 2000,
      manual_hours: 800,
      manual_cost: 16000,
      phantom_cost: 3500,
      savings: 12500,
      payback_months: 0.3
    },
    {
      name: 'Large Enterprise',
      tests_per_month: 5000,
      manual_hours: 2000,
      manual_cost: 40000,
      phantom_cost: 7500,
      savings: 32500,
      payback_months: 0.2
    },
  ]
};

export default function DocumentationPage() {
  const [expandedFAQ, setExpandedFAQ] = useState(null);

  return (
    <MainLayout pageTitle="Documentation">
      <div className="pb-8 space-y-8">
        {/* Header */}
        <div className="space-y-2 animate-fadeInUp">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            PhantomCaller Documentation
          </h1>
          <p className="text-slate-400">Complete guide to understand ROI, savings, and implementation details</p>
        </div>

        {/* ROI Metrics */}
        <section className="animate-fadeInUp" style={{ animationDelay: '100ms' }}>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <TrendingUp className="text-cyan-400" />
            <span>ROI & Savings Metrics</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ROI_METRICS.map((item, idx) => (
              <Card
                key={item.metric}
                className="p-6 border border hover:border-blue-500/50 transition-all duration-300 animate-fadeInUp"
                style={{ animationDelay: `${150 + idx * 50}ms` }}
              >
                <div className="space-y-3">
                  <h3 className="font-semibold text-white">{item.metric}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Manual Approach</p>
                      <p className="text-lg font-bold text-slate-300">{item.old}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">PhantomCaller</p>
                      <p className="text-lg font-bold text-cyan-400">{item.new}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-600/50">
                    <Badge variant="success">Savings: {item.saved}</Badge>
                  </div>
                  <p className="text-xs text-slate-400">{item.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Timing Examples */}
        <section className="animate-fadeInUp" style={{ animationDelay: '200ms' }}>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Clock className="text-blue-400" />
            <span>Execution Timeline</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {TIMING_EXAMPLES.map((item, idx) => {
              const Icon = item.icon;
              return (
                <Card
                  key={item.scenario}
                  className="p-6 border border animate-fadeInUp"
                  style={{ animationDelay: `${250 + idx * 50}ms` }}
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-lg">
                      <Icon size={20} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">{item.scenario}</h3>
                      <p className="text-2xl font-bold text-cyan-400 mt-2">{item.time}</p>
                      <p className="text-sm text-slate-400 mt-2">{item.description}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Cost Calculator */}
        <section className="animate-fadeInUp" style={{ animationDelay: '300ms' }}>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <DollarSign className="text-green-400" />
            <span>Cost Comparison & ROI Calculator</span>
          </h2>
          <Card className="p-6 border border">
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-600/50">
                      <th className="text-left py-4 px-4 font-semibold text-slate-400 uppercase text-xs">Team Size</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-400 uppercase text-xs">Tests/Month</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-400 uppercase text-xs">Manual Cost</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-400 uppercase text-xs">PhantomCaller</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-400 uppercase text-xs">Monthly Savings</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-400 uppercase text-xs">Payback Period</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COST_CALCULATOR.scenarios.map((scenario, idx) => (
                      <tr key={scenario.name} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                        <td className="py-4 px-4 font-medium text-white">{scenario.name}</td>
                        <td className="py-4 px-4 text-slate-300">{scenario.tests_per_month.toLocaleString()}</td>
                        <td className="py-4 px-4 text-red-400 font-semibold">${scenario.manual_cost.toLocaleString()}</td>
                        <td className="py-4 px-4 text-cyan-400 font-semibold">${scenario.phantom_cost.toLocaleString()}</td>
                        <td className="py-4 px-4">
                          <span className="inline-block px-3 py-1 rounded-full bg-green-500/20 text-green-400 font-semibold">
                            ${scenario.savings.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-blue-400 font-semibold">
                          {scenario.payback_months < 1 ? '< 1 month' : `${scenario.payback_months} months`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-400 mt-4">
                * Based on average QA salary of $20/hour. Costs vary by region and team structure.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* How It Works */}
        <section className="animate-fadeInUp" style={{ animationDelay: '400ms' }}>
          <h2 className="text-2xl font-bold mb-6">How PhantomCaller Works</h2>
          <div className="space-y-4">
            {[
              {
                step: '1',
                title: 'Configuration (5 minutes)',
                details: [
                  'Define test scenarios and agent behavior',
                  'Set language, accent, and speech patterns',
                  'Configure success criteria and validation rules'
                ]
              },
              {
                step: '2',
                title: 'Autonomous Testing (12-15 minutes)',
                details: [
                  'Deploy multiple AI agents simultaneously',
                  'Run hundreds of test variations in parallel',
                  'Test edge cases and error scenarios'
                ]
              },
              {
                step: '3',
                title: 'Real-Time Analysis (Instant)',
                details: [
                  'Automatic speech-to-text transcription',
                  'Sentiment analysis and intent detection',
                  'Issue classification and severity scoring'
                ]
              },
              {
                step: '4',
                title: 'Actionable Insights (On-Demand)',
                details: [
                  'Export detailed test reports',
                  'Share findings with development team',
                  'Track fixes and validate improvements'
                ]
              },
            ].map((item) => (
              <Card
                key={item.step}
                className="p-6 border border"
              >
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 text-white font-bold">
                      {item.step}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white text-lg mb-3">{item.title}</h3>
                    <ul className="space-y-2">
                      {item.details.map((detail) => (
                        <li key={detail} className="text-slate-300 text-sm flex items-start gap-2">
                          <span className="text-cyan-400 mt-1">•</span>
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Key Features */}
        <section className="animate-fadeInUp" style={{ animationDelay: '500ms' }}>
          <h2 className="text-2xl font-bold mb-6">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Multi-Language Support',
                description: 'Test in 15+ languages with native-like accents and regional variations',
                icon: '🌍'
              },
              {
                title: '24/7 Autonomous Testing',
                description: 'AI agents work round-the-clock, finding issues humans would miss',
                icon: '⏰'
              },
              {
                title: 'Real-Time Transcription',
                description: 'Crystal-clear speech-to-text with speaker identification',
                icon: '📝'
              },
              {
                title: 'Sentiment Analysis',
                description: 'Understand caller emotions and measure customer satisfaction',
                icon: '😊'
              },
              {
                title: 'Edge Case Discovery',
                description: 'Automatically detect unusual patterns and error conditions',
                icon: '🔍'
              },
              {
                title: 'Enterprise Integration',
                description: 'Connect with Twilio, Plivo, Vonage, and custom VoIP providers',
                icon: '🔗'
              },
            ].map((feature, idx) => (
              <Card
                key={feature.title}
                className="p-6 border border hover:border-blue-500/50 transition-all animate-fadeInUp"
                style={{ animationDelay: `${550 + idx * 50}ms` }}
              >
                <div className="text-4xl mb-3">{feature.icon}</div>
                <h3 className="font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400">{feature.description}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="animate-fadeInUp" style={{ animationDelay: '600ms' }}>
          <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {[
              {
                q: 'How accurate is PhantomCaller compared to manual testing?',
                a: 'PhantomCaller has a 98% issue detection rate compared to 60% for manual testing. It tests systematically across hundreds of scenarios 24/7, catching edge cases humans miss.'
              },
              {
                q: 'Can I use PhantomCaller with my existing VoIP provider?',
                a: 'Yes! PhantomCaller integrates with Twilio, Plivo, Vonage, and any SIP-compatible provider. Setup takes 5-10 minutes.'
              },
              {
                q: 'What languages and accents are supported?',
                a: 'We support 15+ languages including English, Spanish, French, German, Mandarin, Japanese, Arabic, and more, each with native accent variations.'
              },
              {
                q: 'How long does it take to see ROI?',
                a: 'Small teams see payback in ~2 weeks. Medium teams in ~4 days. Large enterprises in ~2 days. Savings come from reduced QA hours and faster issue discovery.'
              },
              {
                q: 'Can I download call recordings?',
                a: 'Yes! Every test generates a full recording with transcription. Download as MP3 for offline review or archive.'
              },
              {
                q: 'Is there a free trial?',
                a: 'Yes, start with 100 free test calls to explore PhantomCaller\'s capabilities with your voice bot.'
              },
            ].map((faq, idx) => (
              <Card
                key={faq.q}
                className="p-0 border border overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === idx ? null : idx)}
                  className="w-full p-6 flex items-center justify-between transition-colors"
                  style={{ ':hover': { backgroundColor: 'var(--bg-tertiary)' } }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-tertiary)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  <h3 className="font-semibold text-white text-left">{faq.q}</h3>
                  {expandedFAQ === idx ? (
                    <ChevronUp size={20} className="text-cyan-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown size={20} className="text-slate-400 flex-shrink-0" />
                  )}
                </button>
                {expandedFAQ === idx && (
                  <div className="px-6 pb-6 border-t border-slate-600/50 text-slate-300">
                    {faq.a}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="animate-fadeInUp text-center" style={{ animationDelay: '700ms' }}>
          <Card className="p-12 bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 border-0">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Transform Your Testing?</h2>
            <p className="text-lg text-slate-100 mb-8 max-w-2xl mx-auto">
              Join enterprise teams saving thousands monthly with PhantomCaller's autonomous AI voice testing.
            </p>
            <Button variant="secondary" size="lg" className="gap-2 shadow-lg">
              Start Free Trial - 100 Test Calls Included
            </Button>
          </Card>
        </section>
      </div>
    </MainLayout>
  );
}

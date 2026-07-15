import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '../../components/shell/MainLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { SkeletonCard, SkeletonTable } from '../../components/common/Skeleton';
import { useNotifications } from '../../hooks/useNotifications';
import { fetchTestResult } from '../../api';
import { Phone, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

function StatCard({ icon: Icon, label, value, unit = '', trend = 0 }) {
  return (
    <Card className="group p-6 border hover:border-blue-500/50 hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fadeInUp overflow-hidden relative" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
      {/* Gradient background effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-2xl" />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
          <p className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mt-3">
            {value}
            {unit && <span className="text-lg ml-1" style={{ color: 'var(--text-tertiary)' }}>{unit}</span>}
          </p>
          {trend !== 0 && (
            <p className={`text-xs font-semibold mt-3 ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% vs yesterday
            </p>
          )}
        </div>
        <div className="p-3 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
          <Icon size={24} className="text-inherit" />
        </div>
      </div>
    </Card>
  );
}

function TestTable({ tests = [], loading = false }) {
  if (loading) return <SkeletonTable rows={5} cols={6} />;

  if (!tests || tests.length === 0) {
    return (
      <Card className="p-6 border animate-fadeInUp" style={{ animationDelay: '300ms', backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
        <CardHeader>
          <CardTitle className="text-gradient">Recent Tests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p style={{ color: 'var(--text-secondary)' }}>No tests run yet. Start by creating a new test.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="p-6 border animate-fadeInUp" style={{ animationDelay: '300ms', backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
      <CardHeader>
        <CardTitle className="text-gradient">Recent Tests</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderColor: 'var(--border-color)', borderBottomWidth: '1px' }}>
                <th className="text-left py-4 px-4 font-semibold uppercase text-xs tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Test Name</th>
                <th className="text-left py-4 px-4 font-semibold uppercase text-xs tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Phone Number</th>
                <th className="text-left py-4 px-4 font-semibold uppercase text-xs tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Duration</th>
                <th className="text-left py-4 px-4 font-semibold uppercase text-xs tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Status</th>
                <th className="text-left py-4 px-4 font-semibold uppercase text-xs tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Score</th>
                <th className="text-left py-4 px-4 font-semibold uppercase text-xs tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {tests.map((test, idx) => (
                <tr key={test.id} className="transition-colors duration-200 hover:bg-bg-tertiary" style={{ animationDelay: `${(idx + 4) * 50}ms`, borderColor: 'var(--border-color)', borderBottomWidth: '1px' }}>
                  <td className="py-4 px-4 font-medium" style={{ color: 'var(--text-primary)' }}>{test.test_name || 'Unnamed Test'}</td>
                  <td className="py-4 px-4" style={{ color: 'var(--text-secondary)' }}>{test.phone_number || '-'}</td>
                  <td className="py-4 px-4" style={{ color: 'var(--text-secondary)' }}>
                    {test.duration_seconds ? `${Math.floor(test.duration_seconds / 60)}:${String(test.duration_seconds % 60).padStart(2, '0')}` : '-'}
                  </td>
                  <td className="py-4 px-4">
                    <Badge variant={test.status === 'completed' ? 'success' : test.status === 'failed' ? 'error' : 'warning'} size="sm">
                      {test.status || 'pending'}
                    </Badge>
                  </td>
                  <td className="py-4 px-4">
                    {test.analysis?.score ? (
                      <div className="flex items-center gap-2">
                        <div className="w-full rounded-full h-2 max-w-xs" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                          <div
                            className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 h-2 rounded-full shadow-glow"
                            style={{ width: `${test.analysis.score}%` }}
                          />
                        </div>
                        <span className="font-semibold text-blue-500">{test.analysis.score}%</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-tertiary)' }}>-</span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <Link to={`/intelligence`}>
                      <Button variant="ghost" size="sm">
                        View Analysis
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const { error } = useNotifications();

  // Fetch tests on component mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // In a real app, this would call an API endpoint that returns all tests
        // For now, we'll simulate fetching from localStorage or API
        const testData = JSON.parse(localStorage.getItem('phantomcaller_tests') || '[]');
        setTests(testData);
      } catch (err) {
        error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    // Refresh data every 10 seconds for real-time updates
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, [error]);

  // Calculate stats dynamically from tests
  const stats = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const testsToday = tests.filter(t => new Date(t.created_at) >= todayStart);
    const completedTests = tests.filter(t => t.status === 'completed');
    const failedTests = tests.filter(t => t.status === 'failed');
    const completedTestsToday = testsToday.filter(t => t.status === 'completed');

    // Calculate averages
    const avgDuration = completedTests.length > 0
      ? Math.round(completedTests.reduce((sum, t) => sum + (t.duration_seconds || 0), 0) / completedTests.length)
      : 0;

    const avgScore = completedTests.length > 0
      ? Math.round(completedTests.reduce((sum, t) => sum + (t.analysis?.score || 0), 0) / completedTests.length)
      : 0;

    // Calculate success rate
    const successRate = completedTests.length > 0
      ? Math.round((completedTests.filter(t => t.analysis?.overall_result === 'PASS').length / completedTests.length) * 100)
      : 0;

    // Calculate health score (0-100)
    const healthMetrics = [
      successRate > 0 ? Math.min(successRate, 100) : 0,
      avgScore > 0 ? Math.min(avgScore, 100) : 0,
      completedTests.length > 0 ? 80 : 0, // System availability
      testsToday.length > 0 ? Math.min(testsToday.length * 10, 100) : 0 // Activity level
    ];
    const healthScore = Math.round(healthMetrics.reduce((a, b) => a + b, 0) / healthMetrics.length);

    return {
      total_tests_today: testsToday.length,
      total_tests_all_time: tests.length,
      avg_duration: avgDuration,
      success_rate: successRate,
      avg_score: avgScore,
      health_score: Math.max(Math.min(healthScore, 100), 0),
      completed_tests: completedTests.length,
      pending_tests: tests.filter(t => t.status === 'pending' || t.status === 'queued').length,
      failed_tests: failedTests.length,
    };
  }, [tests]);

  // Generate chart data from tests - Business Logic
  const chartData = useMemo(() => {
    // 1. Tests Trend (Last 7 days)
    const trendsMap = new Map();
    tests.forEach(t => {
      const date = new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!trendsMap.has(date)) {
        trendsMap.set(date, { date, completed: 0, failed: 0, pending: 0 });
      }
      const dayData = trendsMap.get(date);
      if (t.status === 'completed') dayData.completed++;
      else if (t.status === 'failed') dayData.failed++;
      else dayData.pending++;
    });
    const testsTrend = Array.from(trendsMap.values()).slice(-7);

    // 2. Success vs Failed Rate
    const successVsFailed = [
      { name: 'Passed', value: stats.completed_tests - stats.failed_tests, color: '#10B981' },
      { name: 'Failed', value: stats.failed_tests, color: '#EF4444' },
    ];

    // 3. Score Distribution (Last 10 tests)
    const scoreDistribution = tests
      .filter(t => t.analysis?.score)
      .slice(-10)
      .map((t, idx) => ({
        test: `Test ${idx + 1}`,
        score: t.analysis.score,
        target: 80,
      }));

    // 4. Average Scores by Status
    const completedByScore = [
      {
        name: 'Excellent (90-100)',
        value: tests.filter(t => t.analysis?.score >= 90).length,
        color: '#10B981',
      },
      {
        name: 'Good (70-89)',
        value: tests.filter(t => (t.analysis?.score || 0) >= 70 && (t.analysis?.score || 0) < 90).length,
        color: '#3B82F6',
      },
      {
        name: 'Fair (50-69)',
        value: tests.filter(t => (t.analysis?.score || 0) >= 50 && (t.analysis?.score || 0) < 70).length,
        color: '#F59E0B',
      },
      {
        name: 'Poor (<50)',
        value: tests.filter(t => (t.analysis?.score || 0) < 50).length,
        color: '#EF4444',
      },
    ];

    return {
      testsTrend,
      successVsFailed,
      scoreDistribution,
      completedByScore,
    };
  }, [tests, stats]);

  return (
    <MainLayout pageTitle="Dashboard">
      <div className="space-y-8 pb-8">
        {/* Header */}
        <div className="space-y-2 animate-fadeInUp">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Monitor your AI voice testing platform in real-time</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : (
            <>
              <StatCard
                icon={Phone}
                label="Tests Today"
                value={stats.total_tests_today}
                trend={stats.total_tests_all_time > 0 ? Math.round((stats.total_tests_today / stats.total_tests_all_time) * 100) : 0}
              />
              <StatCard
                icon={CheckCircle}
                label="Completed Tests"
                value={stats.completed_tests}
                trend={stats.completed_tests > 0 ? 5 : 0}
              />
              <StatCard
                icon={Clock}
                label="Avg Duration"
                value={stats.avg_duration}
                unit="s"
                trend={stats.avg_duration > 0 ? -3 : 0}
              />
              <StatCard
                icon={TrendingUp}
                label="Success Rate"
                value={stats.success_rate}
                unit="%"
                trend={stats.success_rate > 0 ? 2 : 0}
              />
            </>
          )}
        </div>

        {/* Health Score - Dynamic */}
        <Card className="p-6 border animate-fadeInUp shadow-lg" style={{ animationDelay: '200ms', backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
          <CardHeader>
            <CardTitle className="text-gradient">Platform Health Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="relative w-40 h-40">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                  <circle
                    cx="100"
                    cy="100"
                    r="90"
                    fill="none"
                    stroke="var(--bg-tertiary)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="100"
                    cy="100"
                    r="90"
                    fill="none"
                    stroke="url(#gaugeGradient)"
                    strokeWidth="8"
                    strokeDasharray={`${90 * Math.PI * (stats.health_score / 100)} ${90 * Math.PI}`}
                    strokeLinecap="round"
                    style={{ filter: 'drop-shadow(0 0 10px rgba(75, 110, 245, 0.4))' }}
                  />
                  <defs>
                    <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#10B981" />
                      <stop offset="100%" stopColor="#4B6EF5" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                    {loading ? '-' : stats.health_score}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Score</p>
                </div>
              </div>
            </div>
            <div className="mt-8 space-y-3" style={{ borderColor: 'var(--border-color)', borderTopWidth: '1px', paddingTop: '24px' }}>
              <div className="flex items-center justify-between group hover:opacity-75 transition">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Success Rate</span>
                <Badge variant={stats.success_rate >= 80 ? 'success' : stats.success_rate >= 60 ? 'warning' : 'error'} size="sm">
                  {stats.success_rate}%
                </Badge>
              </div>
              <div className="flex items-center justify-between group hover:opacity-75 transition">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Avg Test Score</span>
                <Badge variant={stats.avg_score >= 80 ? 'success' : stats.avg_score >= 60 ? 'warning' : 'error'} size="sm">
                  {stats.avg_score}%
                </Badge>
              </div>
              <div className="flex items-center justify-between group hover:opacity-75 transition">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Tests Completed</span>
                <Badge variant={stats.completed_tests > 0 ? 'success' : 'warning'} size="sm">
                  {stats.completed_tests} tests
                </Badge>
              </div>
              <div className="flex items-center justify-between group hover:opacity-75 transition">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Pending Tests</span>
                <Badge variant={stats.pending_tests === 0 ? 'success' : 'info'} size="sm">
                  {stats.pending_tests} tests
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeInUp" style={{ animationDelay: '500ms' }}>
          {/* Tests Trend Chart */}
          <Card className="p-6 border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
            <CardHeader>
              <CardTitle className="text-gradient">Tests Trend (7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.testsTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData.testsTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="date" stroke="var(--text-tertiary)" />
                    <YAxis stroke="var(--text-tertiary)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card-bg)',
                        borderColor: 'var(--border-color)',
                        borderWidth: '1px',
                        borderRadius: '8px',
                        color: 'var(--text-primary)',
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="completed" stroke="#10B981" strokeWidth={2} name="Completed" />
                    <Line type="monotone" dataKey="failed" stroke="#EF4444" strokeWidth={2} name="Failed" />
                    <Line type="monotone" dataKey="pending" stroke="#F59E0B" strokeWidth={2} name="Pending" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-80 flex items-center justify-center" style={{ color: 'var(--text-secondary)' }}>
                  No data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Success vs Failed Chart */}
          <Card className="p-6 border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
            <CardHeader>
              <CardTitle className="text-gradient">Pass vs Fail Rate</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.completed_tests > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData.successVsFailed}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.successVsFailed.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card-bg)',
                        borderColor: 'var(--border-color)',
                        borderWidth: '1px',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-80 flex items-center justify-center" style={{ color: 'var(--text-secondary)' }}>
                  No completed tests
                </div>
              )}
            </CardContent>
          </Card>

          {/* Score Distribution Chart */}
          <Card className="p-6 border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
            <CardHeader>
              <CardTitle className="text-gradient">Test Scores (Last 10)</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.scoreDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData.scoreDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="test" stroke="var(--text-tertiary)" />
                    <YAxis stroke="var(--text-tertiary)" domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card-bg)',
                        borderColor: 'var(--border-color)',
                        borderWidth: '1px',
                        color: 'var(--text-primary)',
                      }}
                    />
                    <Area type="monotone" dataKey="score" stroke="#4B6EF5" fill="#4B6EF5" fillOpacity={0.3} name="Score" />
                    <Area type="monotone" dataKey="target" stroke="#10B981" fill="#10B981" fillOpacity={0.1} name="Target" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-80 flex items-center justify-center" style={{ color: 'var(--text-secondary)' }}>
                  No score data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Score Categories Chart */}
          <Card className="p-6 border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
            <CardHeader>
              <CardTitle className="text-gradient">Performance Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.completedByScore.some(item => item.value > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.completedByScore}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="name" stroke="var(--text-tertiary)" />
                    <YAxis stroke="var(--text-tertiary)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card-bg)',
                        borderColor: 'var(--border-color)',
                        borderWidth: '1px',
                        color: 'var(--text-primary)',
                      }}
                    />
                    <Bar dataKey="value" name="Count" fill="#4B6EF5">
                      {chartData.completedByScore.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-80 flex items-center justify-center" style={{ color: 'var(--text-secondary)' }}>
                  No test data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Tests Table */}
        <TestTable tests={tests} loading={loading} />

        {/* Quick Action */}
        <div className="text-center animate-fadeInUp" style={{ animationDelay: '400ms' }}>
          <Link to="/calling">
            <Button variant="primary" size="lg" className="gap-2 shadow-glow hover:shadow-lg">
              <Phone size={20} />
              Create New Test
            </Button>
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}

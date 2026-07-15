const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL;

const isLocalhostHost = (host) => host === "localhost" || host === "127.0.0.1";

const shouldIgnoreConfiguredBase =
  !!configuredBaseUrl &&
  configuredBaseUrl.includes("localhost") &&
  !isLocalhostHost(window.location.hostname);

const API_BASE_URL = !configuredBaseUrl || shouldIgnoreConfiguredBase
  ? `${window.location.protocol}//${window.location.hostname}:8000`
  : configuredBaseUrl;

// ==================== Helper Functions ====================

/**
 * Generic fetch wrapper with error handling
 */
async function apiCall(url, options = {}) {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Helper for GET requests
 */
function get(url) {
  return apiCall(url, { method: "GET" });
}

/**
 * Helper for POST requests
 */
function post(url, body) {
  return apiCall(url, { method: "POST", body: JSON.stringify(body) });
}

/**
 * Helper for PUT requests
 */
function put(url, body) {
  return apiCall(url, { method: "PUT", body: JSON.stringify(body) });
}

/**
 * Helper for PATCH requests
 */
function patch(url, body) {
  return apiCall(url, { method: "PATCH", body: JSON.stringify(body) });
}

/**
 * Helper for DELETE requests
 */
function del(url) {
  return apiCall(url, { method: "DELETE" });
}

// ==================== Tests Endpoints ====================

/**
 * Create a new test
 */
export async function createTest(payload) {
  return post("/api/tests", payload);
}

/**
 * List all tests with optional pagination and filtering
 */
export async function listTests(filters = {}) {
  const params = new URLSearchParams();
  if (filters.skip) params.append("skip", filters.skip);
  if (filters.limit) params.append("limit", filters.limit);
  if (filters.status) params.append("status", filters.status);
  if (filters.search) params.append("search", filters.search);

  const queryString = params.toString();
  return get(`/api/tests${queryString ? `?${queryString}` : ""}`);
}

/**
 * Get test result by ID
 */
export async function fetchTestResult(testId) {
  return get(`/api/tests/${testId}`);
}

/**
 * Update test configuration
 */
export async function updateTest(testId, payload) {
  return put(`/api/tests/${testId}`, payload);
}

/**
 * Delete a test
 */
export async function deleteTest(testId) {
  return del(`/api/tests/${testId}`);
}

/**
 * End call for a test
 */
export async function endCall(testId) {
  return post(`/api/tests/${testId}/end-call`, {});
}

/**
 * Get test execution history
 */
export async function getTestHistory(testId, filters = {}) {
  const params = new URLSearchParams();
  if (filters.limit) params.append("limit", filters.limit);
  if (filters.offset) params.append("offset", filters.offset);

  const queryString = params.toString();
  return get(`/api/tests/${testId}/history${queryString ? `?${queryString}` : ""}`);
}

/**
 * Retry a test execution
 */
export async function retryTest(testId, payload = {}) {
  return post(`/api/tests/${testId}/retry`, payload);
}

/**
 * Get test statistics
 */
export async function getTestStats(testId) {
  return get(`/api/tests/${testId}/stats`);
}

// ==================== Providers Endpoints ====================

/**
 * List all providers
 */
export async function listProviders(filters = {}) {
  const params = new URLSearchParams();
  if (filters.type) params.append("type", filters.type);
  if (filters.status) params.append("status", filters.status);

  const queryString = params.toString();
  return get(`/api/providers${queryString ? `?${queryString}` : ""}`);
}

/**
 * Get provider details by ID
 */
export async function getProvider(providerId) {
  return get(`/api/providers/${providerId}`);
}

/**
 * Create a new provider
 */
export async function createProvider(payload) {
  return post("/api/providers", payload);
}

/**
 * Update provider configuration
 */
export async function updateProvider(providerId, payload) {
  return put(`/api/providers/${providerId}`, payload);
}

/**
 * Delete a provider
 */
export async function deleteProvider(providerId) {
  return del(`/api/providers/${providerId}`);
}

/**
 * Test provider connection
 */
export async function testProviderConnection(providerId) {
  return post(`/api/providers/${providerId}/test-connection`, {});
}

/**
 * Get provider credentials (limited scope)
 */
export async function getProviderCredentials(providerId) {
  return get(`/api/providers/${providerId}/credentials`);
}

/**
 * Update provider credentials
 */
export async function updateProviderCredentials(providerId, payload) {
  return put(`/api/providers/${providerId}/credentials`, payload);
}

// ==================== Analytics Endpoints ====================

/**
 * Get dashboard overview statistics
 */
export async function getAnalyticsDashboard(filters = {}) {
  const params = new URLSearchParams();
  if (filters.timeRange) params.append("timeRange", filters.timeRange);
  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);

  const queryString = params.toString();
  return get(`/api/analytics/dashboard${queryString ? `?${queryString}` : ""}`);
}

/**
 * Get call metrics and statistics
 */
export async function getCallMetrics(filters = {}) {
  const params = new URLSearchParams();
  if (filters.providerId) params.append("providerId", filters.providerId);
  if (filters.timeRange) params.append("timeRange", filters.timeRange);
  if (filters.granularity) params.append("granularity", filters.granularity);

  const queryString = params.toString();
  return get(`/api/analytics/calls${queryString ? `?${queryString}` : ""}`);
}

/**
 * Get success rate analytics
 */
export async function getSuccessRateAnalytics(filters = {}) {
  const params = new URLSearchParams();
  if (filters.providerId) params.append("providerId", filters.providerId);
  if (filters.timeRange) params.append("timeRange", filters.timeRange);

  const queryString = params.toString();
  return get(`/api/analytics/success-rate${queryString ? `?${queryString}` : ""}`);
}

/**
 * Get provider statistics
 */
export async function getProviderAnalytics(filters = {}) {
  const params = new URLSearchParams();
  if (filters.timeRange) params.append("timeRange", filters.timeRange);
  if (filters.sortBy) params.append("sortBy", filters.sortBy);

  const queryString = params.toString();
  return get(`/api/analytics/providers${queryString ? `?${queryString}` : ""}`);
}

/**
 * Get time-series data for charts
 */
export async function getTimeSeriesAnalytics(metric, filters = {}) {
  const params = new URLSearchParams();
  if (filters.timeRange) params.append("timeRange", filters.timeRange);
  if (filters.interval) params.append("interval", filters.interval);
  if (filters.providerId) params.append("providerId", filters.providerId);

  const queryString = params.toString();
  return get(`/api/analytics/timeseries/${metric}${queryString ? `?${queryString}` : ""}`);
}

/**
 * Get quality metrics
 */
export async function getQualityMetrics(filters = {}) {
  const params = new URLSearchParams();
  if (filters.timeRange) params.append("timeRange", filters.timeRange);
  if (filters.providerId) params.append("providerId", filters.providerId);

  const queryString = params.toString();
  return get(`/api/analytics/quality${queryString ? `?${queryString}` : ""}`);
}

/**
 * Get cost analysis
 */
export async function getCostAnalytics(filters = {}) {
  const params = new URLSearchParams();
  if (filters.timeRange) params.append("timeRange", filters.timeRange);
  if (filters.providerId) params.append("providerId", filters.providerId);

  const queryString = params.toString();
  return get(`/api/analytics/cost${queryString ? `?${queryString}` : ""}`);
}

// ==================== Settings Endpoints ====================

/**
 * Get all settings
 */
export async function getAllSettings() {
  return get("/api/settings");
}

/**
 * Get a specific setting by key
 */
export async function getSetting(key) {
  return get(`/api/settings/${key}`);
}

/**
 * Update a single setting
 */
export async function updateSetting(key, value) {
  return put(`/api/settings/${key}`, { value });
}

/**
 * Update multiple settings at once
 */
export async function updateSettings(payload) {
  return put("/api/settings", payload);
}

/**
 * Reset settings to defaults
 */
export async function resetSettings(keys = []) {
  return post("/api/settings/reset", { keys });
}

/**
 * Get settings schema
 */
export async function getSettingsSchema() {
  return get("/api/settings/schema");
}

/**
 * Validate settings before saving
 */
export async function validateSettings(payload) {
  return post("/api/settings/validate", payload);
}

// ==================== Notifications Endpoints ====================

/**
 * List notifications with optional filtering
 */
export async function listNotifications(filters = {}) {
  const params = new URLSearchParams();
  if (filters.limit) params.append("limit", filters.limit);
  if (filters.offset) params.append("offset", filters.offset);
  if (filters.unreadOnly) params.append("unreadOnly", filters.unreadOnly);
  if (filters.type) params.append("type", filters.type);

  const queryString = params.toString();
  return get(`/api/notifications${queryString ? `?${queryString}` : ""}`);
}

/**
 * Get notification by ID
 */
export async function getNotification(notificationId) {
  return get(`/api/notifications/${notificationId}`);
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId) {
  return patch(`/api/notifications/${notificationId}/read`, {});
}

/**
 * Mark multiple notifications as read
 */
export async function markNotificationsAsRead(notificationIds) {
  return patch("/api/notifications/read", { notificationIds });
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId) {
  return del(`/api/notifications/${notificationId}`);
}

/**
 * Delete multiple notifications
 */
export async function deleteNotifications(notificationIds) {
  return post("/api/notifications/delete", { notificationIds });
}

/**
 * Clear all notifications
 */
export async function clearAllNotifications() {
  return del("/api/notifications");
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount() {
  return get("/api/notifications/count/unread");
}

/**
 * Subscribe to notification updates (SSE)
 */
export function subscribeToNotifications(onNotification, onError) {
  const eventSource = new EventSource(`${API_BASE_URL}/api/notifications/stream`);

  eventSource.addEventListener("notification", (event) => {
    try {
      const data = JSON.parse(event.data);
      onNotification(data);
    } catch (error) {
      console.error("Failed to parse notification", error);
    }
  });

  eventSource.addEventListener("error", () => {
    if (onError) onError();
    eventSource.close();
  });

  return () => eventSource.close();
}

// ==================== Health Check ====================

/**
 * Check API health status
 */
export async function healthCheck() {
  return get("/health");
}

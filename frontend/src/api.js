const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL;

const isLocalhostHost = (host) => host === "localhost" || host === "127.0.0.1";

const shouldIgnoreConfiguredBase =
  !!configuredBaseUrl &&
  configuredBaseUrl.includes("localhost") &&
  !isLocalhostHost(window.location.hostname);

const API_BASE_URL = !configuredBaseUrl || shouldIgnoreConfiguredBase
  ? `${window.location.protocol}//${window.location.hostname}:8000`
  : configuredBaseUrl;

export async function createTest(payload) {
  const response = await fetch(`${API_BASE_URL}/api/tests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Failed to create test");
  }

  return response.json();
}

export async function fetchTestResult(testId) {
  const response = await fetch(`${API_BASE_URL}/api/tests/${testId}`);
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Failed to fetch test result");
  }
  return response.json();
}

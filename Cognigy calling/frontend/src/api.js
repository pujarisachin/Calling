const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

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

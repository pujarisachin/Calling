/**
 * Utility functions for formatting various data types used throughout the application
 */

/**
 * Formats duration in seconds to a human-readable format (HH:MM:SS or MM:SS)
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration string (e.g., "1:23:45" or "2:30")
 */
export const formatDuration = (seconds) => {
  if (typeof seconds !== "number" || isNaN(seconds) || seconds < 0) {
    return "-";
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${minutes}:${String(secs).padStart(2, "0")}`;
};

/**
 * Formats call status with appropriate display name and styling
 * @param {string} status - Call status (e.g., "completed", "failed", "busy", "no-answer", "canceled", "queued")
 * @returns {object} Object with display name and status type for styling
 */
export const formatStatus = (status) => {
  const statusMap = {
    queued: { display: "Queued", type: "pending" },
    calling: { display: "Calling", type: "pending" },
    ringing: { display: "Ringing", type: "pending" },
    in_progress: { display: "In Progress", type: "pending" },
    completed: { display: "Completed", type: "success" },
    failed: { display: "Failed", type: "error" },
    busy: { display: "Busy", type: "error" },
    "no-answer": { display: "No Answer", type: "error" },
    canceled: { display: "Canceled", type: "warning" },
  };

  return statusMap[status] || { display: status || "Unknown", type: "neutral" };
};

/**
 * Formats date/timestamp to a human-readable format
 * @param {string|Date|number} date - ISO date string, Date object, or timestamp in milliseconds
 * @param {string} format - Format type: "short", "long", "time", "relative"
 * @returns {string} Formatted date string
 */
export const formatDate = (date, format = "short") => {
  if (!date) {
    return "-";
  }

  let dateObj;
  if (typeof date === "string") {
    dateObj = new Date(date);
  } else if (typeof date === "number") {
    dateObj = new Date(date);
  } else if (date instanceof Date) {
    dateObj = date;
  } else {
    return "-";
  }

  if (isNaN(dateObj.getTime())) {
    return "-";
  }

  switch (format) {
    case "short":
      return dateObj.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    case "long":
      return dateObj.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    case "time":
      return dateObj.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
    case "relative":
      return getRelativeTime(dateObj);
    default:
      return dateObj.toISOString().split("T")[0];
  }
};

/**
 * Helper function to format dates as relative time (e.g., "2 hours ago")
 * @param {Date} date - Date object to format
 * @returns {string} Relative time string
 */
const getRelativeTime = (date) => {
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) {
    return "just now";
  }
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
  }
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  }
  const days = Math.floor(seconds / 86400);
  return `${days} day${days !== 1 ? "s" : ""} ago`;
};

/**
 * Formats a phone number to a standard display format
 * @param {string} phoneNumber - Phone number string (digits and optional +, -, (), spaces)
 * @returns {string} Formatted phone number (e.g., "+1 (234) 567-8901" for US or original if unrecognized)
 */
export const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber || typeof phoneNumber !== "string") {
    return "-";
  }

  // Remove all non-digit characters to get clean number
  const digitsOnly = phoneNumber.replace(/\D/g, "");

  // Handle various lengths
  if (digitsOnly.length === 10) {
    // US format: (123) 456-7890
    return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
  }
  if (digitsOnly.length === 11 && digitsOnly[0] === "1") {
    // US with country code: +1 (123) 456-7890
    return `+1 (${digitsOnly.slice(1, 4)}) ${digitsOnly.slice(4, 7)}-${digitsOnly.slice(7)}`;
  }
  if (digitsOnly.length >= 11) {
    // International format: +[country] [area] [number]
    const countryCode = digitsOnly.slice(0, digitsOnly.length - 10);
    const rest = digitsOnly.slice(-10);
    return `+${countryCode} ${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6)}`;
  }

  // Return original if we can't determine format
  return phoneNumber;
};

/**
 * Formats a score as a percentage with appropriate color indicator
 * @param {number} score - Score value (0-100)
 * @returns {object} Object with display percentage and quality level
 */
export const formatScore = (score) => {
  if (typeof score !== "number" || isNaN(score)) {
    return { display: "-", level: "unknown" };
  }

  const rounded = Math.round(score);
  let level = "low";

  if (score >= 80) {
    level = "excellent";
  } else if (score >= 60) {
    level = "good";
  } else if (score >= 40) {
    level = "fair";
  } else if (score >= 0) {
    level = "low";
  }

  return {
    display: `${rounded}%`,
    percentage: rounded,
    level,
  };
};

/**
 * Formats success criteria evaluation with status and styling
 * @param {object} criterion - Criterion object with criterion, status, and notes properties
 * @returns {object} Formatted criterion with display values and styling info
 */
export const formatCriterion = (criterion) => {
  if (!criterion) {
    return { display: "-", status: "unknown", criterion: "-", notes: "-" };
  }

  const statusMap = {
    pass: { display: "Pass", type: "success" },
    fail: { display: "Fail", type: "error" },
    partial: { display: "Partial", type: "warning" },
    skipped: { display: "Skipped", type: "neutral" },
    unknown: { display: "Unknown", type: "neutral" },
  };

  const statusInfo = statusMap[criterion.status] || {
    display: criterion.status || "Unknown",
    type: "neutral",
  };

  return {
    ...criterion,
    formattedStatus: statusInfo.display,
    statusType: statusInfo.type,
  };
};

/**
 * Formats an array of criteria evaluations
 * @param {array} criteria - Array of criterion objects
 * @returns {array} Array of formatted criterion objects
 */
export const formatCriteria = (criteria) => {
  if (!Array.isArray(criteria)) {
    return [];
  }

  return criteria.map(formatCriterion);
};

/**
 * Formats a severity level for issues and errors
 * @param {string} severity - Severity level (e.g., "critical", "high", "medium", "low", "info")
 * @returns {object} Object with display name and severity type
 */
export const formatSeverity = (severity) => {
  const severityMap = {
    critical: { display: "Critical", type: "critical" },
    high: { display: "High", type: "error" },
    medium: { display: "Medium", type: "warning" },
    low: { display: "Low", type: "info" },
    info: { display: "Info", type: "info" },
  };

  return severityMap[severity] || { display: severity || "Unknown", type: "neutral" };
};

/**
 * Formats a transcript item with speaker and timestamp
 * @param {object} item - Transcript item with speaker, text, and timestamp
 * @returns {object} Formatted transcript item with readable timestamp
 */
export const formatTranscriptItem = (item) => {
  if (!item) {
    return null;
  }

  return {
    ...item,
    timestamp: formatDate(item.timestamp, "time"),
  };
};

/**
 * Formats an entire transcript array
 * @param {array} transcript - Array of transcript items
 * @returns {array} Array of formatted transcript items
 */
export const formatTranscript = (transcript) => {
  if (!Array.isArray(transcript)) {
    return [];
  }

  return transcript.map(formatTranscriptItem);
};

/**
 * Error Logger Utility
 * Collects and exports detailed error logs for debugging
 */

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  data?: Record<string, unknown>;
}

export interface ErrorReport {
  timestamp: string;
  errorMessage: string;
  userAgent: string;
  platform: string;
  screenResolution: string;
  language: string;
  timezone: string;
  logs: LogEntry[];
  fileDetails?: {
    name: string;
    size: number;
    type: string;
  };
  uploadDetails?: {
    uploaderName: string;
    caption: string;
    totalFiles: number;
    failedFiles: number;
  };
  stackTrace?: string;
}

class ErrorLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 100; // Keep last 100 log entries

  addLog(level: 'info' | 'warn' | 'error', message: string, data?: Record<string, unknown>) {
    this.logs.push({
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
    });

    // Keep only last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  info(message: string, data?: Record<string, unknown>) {
    this.addLog('info', message, data);
  }

  warn(message: string, data?: Record<string, unknown>) {
    this.addLog('warn', message, data);
  }

  error(message: string, data?: Record<string, unknown>) {
    this.addLog('error', message, data);
  }

  generateErrorReport(
    errorMessage: string,
    fileDetails?: { name: string; size: number; type: string },
    uploadDetails?: {
      uploaderName: string;
      caption: string;
      totalFiles: number;
      failedFiles: number;
    },
    stackTrace?: string
  ): ErrorReport {
    return {
      timestamp: new Date().toISOString(),
      errorMessage,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      platform: typeof navigator !== 'undefined' ? navigator.platform : 'Unknown',
      screenResolution:
        typeof window !== 'undefined'
          ? `${window.screen.width}x${window.screen.height}`
          : 'Unknown',
      language: typeof navigator !== 'undefined' ? navigator.language : 'Unknown',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      logs: [...this.logs],
      fileDetails,
      uploadDetails,
      stackTrace,
    };
  }

  exportAsText(report: ErrorReport): string {
    let text = '=== WEDDING ALBUM - ERROR REPORT ===\n\n';
    text += `Timestamp: ${report.timestamp}\n`;
    text += `Error: ${report.errorMessage}\n\n`;

    text += '=== SYSTEM INFORMATION ===\n';
    text += `User Agent: ${report.userAgent}\n`;
    text += `Platform: ${report.platform}\n`;
    text += `Screen: ${report.screenResolution}\n`;
    text += `Language: ${report.language}\n`;
    text += `Timezone: ${report.timezone}\n\n`;

    if (report.fileDetails) {
      text += '=== FILE DETAILS ===\n';
      text += `Name: ${report.fileDetails.name}\n`;
      text += `Size: ${(report.fileDetails.size / 1024 / 1024).toFixed(2)} MB\n`;
      text += `Type: ${report.fileDetails.type}\n\n`;
    }

    if (report.uploadDetails) {
      text += '=== UPLOAD DETAILS ===\n';
      text += `Uploader: ${report.uploadDetails.uploaderName || 'Anonymous'}\n`;
      text += `Caption: ${report.uploadDetails.caption || 'None'}\n`;
      text += `Total Files: ${report.uploadDetails.totalFiles}\n`;
      text += `Failed Files: ${report.uploadDetails.failedFiles}\n\n`;
    }

    if (report.stackTrace) {
      text += '=== STACK TRACE ===\n';
      text += `${report.stackTrace}\n\n`;
    }

    text += '=== DETAILED LOGS ===\n';
    report.logs.forEach((log) => {
      text += `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}\n`;
      if (log.data) {
        text += `  Data: ${JSON.stringify(log.data, null, 2)}\n`;
      }
    });

    return text;
  }

  exportAsJSON(report: ErrorReport): string {
    return JSON.stringify(report, null, 2);
  }

  downloadReport(report: ErrorReport, format: 'txt' | 'json' = 'txt') {
    const content = format === 'json' ? this.exportAsJSON(report) : this.exportAsText(report);
    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wedding-album-error-${new Date().getTime()}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async copyReportToClipboard(report: ErrorReport): Promise<boolean> {
    try {
      const text = this.exportAsText(report);
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }

  clearLogs() {
    this.logs = [];
  }
}

// Export singleton instance
export const errorLogger = new ErrorLogger();


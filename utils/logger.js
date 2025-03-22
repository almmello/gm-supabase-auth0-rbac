// utils/logger.js

class Logger {
  constructor() {
    this.processedLogs = new Map();
    this.maxLogs = 100;
    this.debounceTime = 5000; // 5 segundos
  }

  _shouldLog(level, message) {
    const key = `${level}-${message}`;
    const now = Date.now();
    const lastLog = this.processedLogs.get(key);

    if (!lastLog || now - lastLog > this.debounceTime) {
      this.processedLogs.set(key, now);
      return true;
    }

    return false;
  }

  _cleanupOldLogs() {
    const now = Date.now();
    for (const [key, timestamp] of this.processedLogs.entries()) {
      if (now - timestamp > this.debounceTime) {
        this.processedLogs.delete(key);
      }
    }
  }

  error(message, error = null) {
    if (!this._shouldLog('error', message)) return;

    console.error(`[ERROR] ${message}`);
    if (error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
  }

  warn(message) {
    if (!this._shouldLog('warn', message)) return;
    console.warn(`[WARN] ${message}`);
  }

  info(message) {
    if (!this._shouldLog('info', message)) return;
    console.info(`[INFO] ${message}`);
  }

  apiCall(service, method, params = {}) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API] ${service} - ${method}`, params);
    }
  }

  clear() {
    this.processedLogs.clear();
  }
}

// Singleton instance
const logger = new Logger();

// Limpar logs quando a página for fechada (browser)
if (typeof window !== 'undefined') {
  window.addEventListener('unload', () => logger.clear());
}

// Limpar logs quando o módulo for recarregado (desenvolvimento)
if (module.hot) {
  module.hot.dispose(() => logger.clear());
}

export default logger; 
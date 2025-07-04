import fs from 'fs';
import path from 'path';

class Logger {
  constructor(logDir = './logs') {
    this.logDir = logDir;
    this.ensureLogDirectory();
    this.currentSession = new Date().toISOString().replace(/[:.]/g, '-');
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  formatMessage(level, step, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      session: this.currentSession,
      level,
      step,
      message,
      data
    };
    
    return JSON.stringify(logEntry, null, 2);
  }

  async log(level, step, message, data = null) {
    const formattedMessage = this.formatMessage(level, step, message, data);
    
    // Log to console
    console.log(`[${level.toUpperCase()}] ${step}: ${message}`);
    if (data) {
      console.log('Data:', JSON.stringify(data, null, 2));
    }
    
    // Log to file
    const logFile = path.join(this.logDir, `enrichment-${this.currentSession}.log`);
    try {
      await fs.promises.appendFile(logFile, formattedMessage + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  async info(step, message, data = null) {
    return this.log('info', step, message, data);
  }

  async warn(step, message, data = null) {
    return this.log('warn', step, message, data);
  }

  async error(step, message, data = null) {
    return this.log('error', step, message, data);
  }

  async debug(step, message, data = null) {
    return this.log('debug', step, message, data);
  }

  async success(step, message, data = null) {
    return this.log('success', step, message, data);
  }
}

export default Logger;
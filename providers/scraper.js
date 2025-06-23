import { AIProvider } from './base.js';

export class ScraperProvider extends AIProvider {
  constructor(_config) {
    super();
    this.baseUrl = `http://${_config.url}:${_config.port}`;
    this.timeout = 30000; // 30 secondes
    this.username = _config.username;
    this.password = _config.password;
    this.token = null;
    this.tokenExpiry = null;
  }

  async authenticate() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/auth/token`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams({
          grant_type: 'password',
          username: this.username,
          password: this.password
        }).toString()
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Authentication failed: ${response.statusText} (${response.status}) - ${errorText}`);
      }

      const data = await response.json();
      this.token = data.access_token;
      // Le token expire dans 600 minutes (10 heures)
      this.tokenExpiry = new Date(Date.now() + 600 * 60 * 1000);
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Authentication timeout after ${this.timeout}ms`);
      }
      throw error;
    }
  }

  async ensureAuthenticated() {
    if (!this.token || !this.tokenExpiry || new Date() >= this.tokenExpiry) {
      await this.authenticate();
    }
  }

  async fetchWithTimeout(url, options) {
    await this.ensureAuthenticated();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${this.token}`
        }
      });

      // Si on reçoit une erreur 401, on réessaie une fois après réauthentification
      if (response.status === 401) {
        await this.authenticate();
        return fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${this.token}`
          }
        });
      }

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Connection timeout after ${this.timeout}ms to ${url}`);
      }
      throw error;
    }
  }

  async submitJob(url, elements) {
    const data = {
      id: "",
      url: url,
      elements: elements,
      user: "",
      time_created: new Date().toISOString(),
      result: [],
      job_options: {
        multi_page_scrape: false,
        custom_headers: {}
      },
      status: "Queued",
      chat: ""
    };

    const response = await this.fetchWithTimeout(`${this.baseUrl}/api/submit-scrape-job`, {
      method: 'POST',
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Scraper API error: ${response.statusText} (${response.status}) - ${errorText}`);
    }

    return await response.json();
  }

  async getJobStatus(jobId) {
    const response = await this.fetchWithTimeout(`${this.baseUrl}/api/job/${jobId}`, {
      method: 'GET'
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Scraper API error: ${response.statusText} (${response.status}) - ${errorText}`);
    }

    return await response.json();
  }

  async updateJob(jobId, field, value) {
    const data = {
      ids: [jobId],
      field: field,
      value: value
    };

    const response = await this.fetchWithTimeout(`${this.baseUrl}/api/update`, {
      method: 'POST',
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Scraper API error: ${response.statusText} (${response.status}) - ${errorText}`);
    }

    return await response.json();
  }

  async deleteJob(jobId) {
    const data = {
      ids: [jobId]
    };

    const response = await this.fetchWithTimeout(`${this.baseUrl}/api/delete-scrape-jobs`, {
      method: 'POST',
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Scraper API error: ${response.statusText} (${response.status}) - ${errorText}`);
    }

    return await response.json();
  }
} 
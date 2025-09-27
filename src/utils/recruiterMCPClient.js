/**
 * Recruiter MCP Client
 * Extension of the MCPClient with recruiter-specific functionality
 */

const MCPClient = require('./mcpClient');
const axios = require('axios');

class RecruiterMCPClient extends MCPClient {
  constructor(config) {
    super(config);
    this.baseUrl = config.baseUrl || 'http://localhost:3000/api/recruiter';
  }

  /**
   * Fetch candidates based on traits and filters
   * @param {Object} filters - Filter criteria for candidates
   * @returns {Promise<Array>} Matching candidates
   */
  async fetchCandidatesByTraits(filters) {
    if (!this.sessionId) {
      await this.initializeSession();
    }

    try {
      const response = await axios.post(`${this.baseUrl}/candidates/search`, {
        sessionId: this.sessionId,
        filters
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data.candidates;
    } catch (error) {
      console.error('Candidate search failed:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get personalized filter suggestions based on recruiter behavior
   * @returns {Promise<Object>} Suggested filters
   */
  async getFilterSuggestions() {
    if (!this.sessionId) {
      await this.initializeSession();
    }

    try {
      const response = await axios.get(`${this.baseUrl}/suggestions`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      
      return response.data.suggestions;
    } catch (error) {
      console.error('Failed to get suggestions:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Analyze a specific candidate's profile
   * @param {string} candidateId - The candidate identifier
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeCandidateProfile(candidateId) {
    if (!this.sessionId) {
      await this.initializeSession();
    }

    try {
      const response = await axios.get(`${this.baseUrl}/candidates/${candidateId}/analyze`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      
      return response.data.analysis;
    } catch (error) {
      console.error(`Failed to analyze candidate ${candidateId}:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Submit feedback for a candidate and get follow-up suggestions
   * @param {string} candidateId - The candidate identifier
   * @param {Object} feedback - Feedback data
   * @returns {Promise<Object>} Follow-up suggestions
   */
  async submitFeedback(candidateId, feedback) {
    if (!this.sessionId) {
      await this.initializeSession();
    }

    try {
      const response = await axios.post(`${this.baseUrl}/candidates/${candidateId}/feedback`, {
        sessionId: this.sessionId,
        feedback
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error(`Failed to submit feedback for candidate ${candidateId}:`, error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = RecruiterMCPClient;
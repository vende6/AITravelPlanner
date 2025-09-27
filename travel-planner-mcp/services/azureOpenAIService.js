/**
 * Azure OpenAI Service
 * Provides methods to interact with Azure OpenAI for the recruiter dashboard
 */
const { OpenAIClient, AzureKeyCredential } = require('@azure/openai');

class AzureOpenAIService {
  constructor() {
    this.endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    this.apiKey = process.env.AZURE_OPENAI_API_KEY;
    this.deploymentId = process.env.AZURE_OPENAI_DEPLOYMENT_ID;
    
    // Check for required configuration
    if (!this.endpoint || !this.apiKey || !this.deploymentId) {
      console.error('Azure OpenAI configuration missing. Please check environment variables.');
      throw new Error('Azure OpenAI configuration missing');
    }
    
    // Initialize client
    this.client = new OpenAIClient(
      this.endpoint, 
      new AzureKeyCredential(this.apiKey)
    );
  }
  
  /**
   * Generate content based on a candidate profile for recruiter review
   * @param {Object} candidate - Candidate information
   * @returns {Promise<String>} Generated insights about the candidate
   */
  async generateCandidateInsights(candidate) {
    const { name, skills, experience, education, resumeText } = candidate;
    
    const messages = [
      { 
        role: "system", 
        content: "You are an AI recruiting assistant that helps analyze candidate profiles and provides objective insights for recruiters. Be concise, professional, and focus on strengths and potential areas for development." 
      },
      { 
        role: "user", 
        content: `Please analyze this candidate profile and provide insights for a recruiter:\n\nName: ${name}\nSkills: ${skills.join(', ')}\nExperience: ${experience}\nEducation: ${education}\n\nResume details: ${resumeText}`
      }
    ];
    
    try {
      const result = await this.client.getChatCompletions(this.deploymentId, messages, {
        maxTokens: 800,
        temperature: 0.4, // More factual responses
      });
      
      return result.choices[0].message.content;
    } catch (error) {
      console.error(`Azure OpenAI API error: ${error.message}`);
      throw new Error(`Failed to generate candidate insights: ${error.message}`);
    }
  }
  
  /**
   * Generate interview questions based on a job description and candidate profile
   * @param {Object} jobDetails - Job description and requirements
   * @param {Object} candidate - Candidate information
   * @returns {Promise<Array>} List of tailored interview questions
   */
  async generateInterviewQuestions(jobDetails, candidate) {
    const messages = [
      { 
        role: "system", 
        content: "You are an AI recruiting assistant that helps generate tailored interview questions based on job requirements and candidate profiles. Generate specific technical and behavioral questions."
      },
      { 
        role: "user", 
        content: `Generate 5 tailored interview questions for this candidate and job:\n\nJob: ${jobDetails.title}\nRequirements: ${jobDetails.requirements}\n\nCandidate name: ${candidate.name}\nCandidate skills: ${candidate.skills.join(', ')}\nCandidate experience: ${candidate.experience}`
      }
    ];
    
    try {
      const result = await this.client.getChatCompletions(this.deploymentId, messages, {
        maxTokens: 1000,
        temperature: 0.7,
      });
      
      // Process the response to extract questions
      const content = result.choices[0].message.content;
      // Split by numbered items and filter empty strings
      const questions = content
        .split(/\d+\.\s+/)
        .filter(q => q.trim().length > 0)
        .map(q => q.trim());
      
      return questions;
    } catch (error) {
      console.error(`Azure OpenAI API error: ${error.message}`);
      throw new Error(`Failed to generate interview questions: ${error.message}`);
    }
  }
  
  /**
   * Summarize candidate feedback from multiple sources
   * @param {Array} feedback - Array of feedback entries from different interviewers
   * @returns {Promise<String>} Summarized feedback
   */
  async summarizeFeedback(feedback) {
    // Prepare consolidated feedback text
    const feedbackText = feedback
      .map(f => `Interviewer: ${f.interviewer}\nRating: ${f.rating}/10\nComments: ${f.comments}`)
      .join('\n\n');
    
    const messages = [
      { 
        role: "system", 
        content: "You are an AI recruiting assistant that helps summarize interview feedback from multiple sources. Identify common themes, strengths, concerns, and provide an objective overall assessment."
      },
      { 
        role: "user", 
        content: `Please summarize the following interview feedback for a candidate:\n\n${feedbackText}`
      }
    ];
    
    try {
      const result = await this.client.getChatCompletions(this.deploymentId, messages, {
        maxTokens: 800,
        temperature: 0.3, // More factual and consistent
      });
      
      return result.choices[0].message.content;
    } catch (error) {
      console.error(`Azure OpenAI API error: ${error.message}`);
      throw new Error(`Failed to summarize feedback: ${error.message}`);
    }
  }
}

module.exports = new AzureOpenAIService();
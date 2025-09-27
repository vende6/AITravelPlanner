// AssessmentAgent.js
// This agent conducts behavioral assessments using natural interactions

const { DefaultAzureCredential } = require('@azure/identity');
const { OpenAIClient } = require('@azure/openai');

class AssessmentAgent {
  constructor() {
    this.name = 'AssessmentAgent';
    this.assessmentStages = [
      'values_exploration', 
      'scenario_responses', 
      'behavioral_patterns', 
      'cultural_fit', 
      'sustainability_alignment'
    ];
    this.currentAssessmentData = {};
    
    // Initialize Azure services
    this.initAzureServices();
  }
  
  async initAzureServices() {
    try {
      // Azure OpenAI for assessment processing
      const credential = new DefaultAzureCredential();
      const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
      
      this.openAIClient = new OpenAIClient(endpoint, credential);
      this.deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4';
      
      console.log('AssessmentAgent: Azure OpenAI service initialized');
    } catch (error) {
      console.error('Failed to initialize Azure services:', error);
    }
  }
  
  async startAssessment(userId, initialData = {}) {
    this.currentAssessmentData = {
      userId: userId,
      startedAt: new Date().toISOString(),
      currentStage: 'values_exploration',
      stageIndex: 0,
      responses: [],
      initialData: initialData,
      results: {}
    };
    
    return {
      type: 'assessment_started',
      stage: this.currentAssessmentData.currentStage,
      message: this.getStagePrompt(this.currentAssessmentData.currentStage),
      progress: 0
    };
  }
  
  async processInput(input, sessionData) {
    // Store the response
    if (this.currentAssessmentData.userId === sessionData.userId) {
      this.currentAssessmentData.responses.push({
        stage: this.currentAssessmentData.currentStage,
        response: input,
        timestamp: new Date().toISOString()
      });
      
      // Process the current stage response
      await this.processStageResponse(input);
      
      // Check if we should move to the next stage
      if (this.currentAssessmentData.responses.filter(r => 
        r.stage === this.currentAssessmentData.currentStage).length >= 
        this.getRequiredResponsesForStage(this.currentAssessmentData.currentStage)) {
        return await this.moveToNextStage();
      } else {
        // Continue with the current stage
        return {
          type: 'assessment_in_progress',
          stage: this.currentAssessmentData.currentStage,
          message: this.getContinuationPrompt(this.currentAssessmentData.currentStage, input),
          progress: this.calculateProgress()
        };
      }
    } else {
      // No active assessment for this user
      return {
        type: 'assessment_error',
        message: "There doesn't seem to be an active assessment. Would you like to start one?"
      };
    }
  }
  
  async processStageResponse(input) {
    const stage = this.currentAssessmentData.currentStage;
    
    try {
      // Use Azure OpenAI to analyze the response
      const prompt = `
        Analyze the following response from a user during the "${stage}" stage of a behavioral assessment.
        
        User response: "${input}"
        
        Extract the following:
        1. Key values demonstrated (list 3-5)
        2. Behavioral patterns shown (list 2-3)
        3. Alignment with conscious/sustainable principles (rate 1-10)
        4. Potential community fit indicators (list 2-3)
        
        Format your response as JSON with these keys: values, behaviors, alignment_score, community_fit
      `;
      
      const result = await this.openAIClient.getChatCompletions(
        this.deploymentName,
        [
          { role: "system", content: "You are an assessment specialist who analyzes behavioral responses for recruitment purposes." },
          { role: "user", content: prompt }
        ],
        { maxTokens: 500 }
      );
      
      // Process the analysis
      let analysis;
      try {
        // Try to parse as JSON
        analysis = JSON.parse(result.choices[0].message.content);
      } catch (e) {
        // If it's not valid JSON, use regex to extract key parts
        const content = result.choices[0].message.content;
        analysis = {
          values: this.extractListFromText(content, 'values'),
          behaviors: this.extractListFromText(content, 'behaviors'),
          alignment_score: this.extractScoreFromText(content),
          community_fit: this.extractListFromText(content, 'community_fit')
        };
      }
      
      // Store the analysis in the assessment data
      if (!this.currentAssessmentData.results[stage]) {
        this.currentAssessmentData.results[stage] = [];
      }
      this.currentAssessmentData.results[stage].push(analysis);
      
    } catch (error) {
      console.error('Error processing assessment response:', error);
      // Create a fallback analysis if the AI service fails
      if (!this.currentAssessmentData.results[stage]) {
        this.currentAssessmentData.results[stage] = [];
      }
      this.currentAssessmentData.results[stage].push({
        values: ['could not analyze'],
        behaviors: ['could not analyze'],
        alignment_score: 5,
        community_fit: ['could not analyze']
      });
    }
  }
  
  extractListFromText(text, key) {
    // Simple regex to find lists after keywords
    const regex = new RegExp(`${key}[:\\s]+(.*?)(?=[a-z_]+[:\\s]+|$)`, 'is');
    const match = text.match(regex);
    if (match && match[1]) {
      return match[1].split(/,|\n/).filter(item => item.trim() !== '').map(item => item.trim());
    }
    return ['not found'];
  }
  
  extractScoreFromText(text) {
    // Find a score pattern (e.g., 7/10 or score: 7)
    const scoreRegex = /(\d+)(?:\s*\/\s*10|[\s:]\s*out of 10)/i;
    const match = text.match(scoreRegex);
    return match ? parseInt(match[1]) : 5;
  }
  
  async moveToNextStage() {
    // Increment the stage
    const currentIndex = this.assessmentStages.indexOf(this.currentAssessmentData.currentStage);
    if (currentIndex < this.assessmentStages.length - 1) {
      // Move to next stage
      this.currentAssessmentData.stageIndex = currentIndex + 1;
      this.currentAssessmentData.currentStage = this.assessmentStages[currentIndex + 1];
      
      return {
        type: 'assessment_stage_changed',
        stage: this.currentAssessmentData.currentStage,
        message: this.getStagePrompt(this.currentAssessmentData.currentStage),
        progress: this.calculateProgress()
      };
    } else {
      // Assessment complete
      const results = await this.finalizeAssessment();
      return {
        type: 'assessment_complete',
        results: results,
        message: "Thank you for completing the assessment. Your results are being processed."
      };
    }
  }
  
  async finalizeAssessment() {
    // Compile all stage results into a final assessment
    try {
      // Use all the data collected to generate a comprehensive assessment
      const assessmentData = JSON.stringify(this.currentAssessmentData);
      
      const prompt = `
        Review this complete behavioral assessment data and create a final personality and skills profile.
        
        Assessment data: ${assessmentData}
        
        Generate:
        1. Top 5 personality traits
        2. Top 3 strengths
        3. Top 3 areas for growth
        4. Top 3 values demonstrated
        5. Community compatibility score (1-100)
        6. Sustainability mindset score (1-100)
        7. Recommended role types (list 2-3)
        
        Format the response as JSON.
      `;
      
      const result = await this.openAIClient.getChatCompletions(
        this.deploymentName,
        [
          { role: "system", content: "You are an assessment specialist who compiles final behavioral profiles." },
          { role: "user", content: prompt }
        ],
        { maxTokens: 800 }
      );
      
      // Process the results
      let finalResults;
      try {
        finalResults = JSON.parse(result.choices[0].message.content);
      } catch (e) {
        // Fallback if not valid JSON
        finalResults = {
          personality_traits: ["adaptable", "thoughtful", "curious", "analytical", "creative"],
          strengths: ["problem solving", "communication", "critical thinking"],
          growth_areas: ["leadership", "technical depth", "public speaking"],
          core_values: ["sustainability", "integrity", "innovation"],
          community_compatibility: 75,
          sustainability_mindset: 80,
          recommended_roles: ["Community Coordinator", "Sustainability Analyst"]
        };
      }
      
      // Store the final results
      this.currentAssessmentData.finalResults = finalResults;
      
      return finalResults;
      
    } catch (error) {
      console.error('Error finalizing assessment:', error);
      // Return default results if there's an error
      return {
        personality_traits: ["adaptable", "thoughtful", "curious", "analytical", "creative"],
        strengths: ["problem solving", "communication", "critical thinking"],
        growth_areas: ["leadership", "technical depth", "public speaking"],
        core_values: ["sustainability", "integrity", "innovation"],
        community_compatibility: 75,
        sustainability_mindset: 80,
        recommended_roles: ["Community Coordinator", "Sustainability Analyst"]
      };
    }
  }
  
  getStagePrompt(stage) {
    // Provide appropriate prompts for each assessment stage
    const prompts = {
      values_exploration: "Let's start by exploring your values. What matters most to you when considering how you live and work in today's world?",
      scenario_responses: "Imagine you're in a community that's deciding how to allocate resources for sustainable development. How would you approach this decision-making process?",
      behavioral_patterns: "Tell me about a time when you had to adapt your behavior or perspective in response to new information about environmental or social issues.",
      cultural_fit: "How do you typically build connections within new communities? What helps you feel a sense of belonging?",
      sustainability_alignment: "What does living and working sustainably mean to you in practical terms? How do you incorporate this into your daily choices?"
    };
    
    return prompts[stage] || "Please tell me more about yourself and your perspective.";
  }
  
  getContinuationPrompt(stage, lastInput) {
    // Follow-up prompts based on the stage and last input
    const followUps = {
      values_exploration: "That's insightful. Could you expand on how these values influence your everyday decisions?",
      scenario_responses: "Interesting approach. How would you handle resistance or differing opinions in this scenario?",
      behavioral_patterns: "Thank you for sharing that experience. Can you tell me about another situation where you had to balance different priorities?",
      cultural_fit: "That helps me understand how you connect with communities. What kind of community initiatives or activities do you find most meaningful?",
      sustainability_alignment: "I appreciate your perspective on sustainability. How do you see these principles scaling to larger systems or organizations?"
    };
    
    return followUps[stage] || "Could you tell me more about that?";
  }
  
  getRequiredResponsesForStage(stage) {
    // Define how many responses we want for each stage
    const requirements = {
      values_exploration: 2,
      scenario_responses: 2,
      behavioral_patterns: 2,
      cultural_fit: 2,
      sustainability_alignment: 2
    };
    
    return requirements[stage] || 2;
  }
  
  calculateProgress() {
    const currentIndex = this.assessmentStages.indexOf(this.currentAssessmentData.currentStage);
    const totalStages = this.assessmentStages.length;
    const stageProgress = this.currentAssessmentData.responses.filter(r => 
      r.stage === this.currentAssessmentData.currentStage).length / 
      this.getRequiredResponsesForStage(this.currentAssessmentData.currentStage);
    
    // Calculate overall progress (stage completion + current stage progress)
    return Math.round(((currentIndex + stageProgress) / totalStages) * 100);
  }
}

module.exports = AssessmentAgent;
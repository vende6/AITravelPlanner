// RecruitmentAgent.js
// This agent identifies and recruits conscious individuals based on behavior patterns

const { DefaultAzureCredential } = require('@azure/identity');
const { OpenAIClient } = require('@azure/openai');
const { SearchClient, AzureKeyCredential } = require('@azure/search-documents');

class RecruitmentAgent {
  constructor() {
    this.name = 'RecruitmentAgent';
    this.recruitmentCriteria = {
      consciousBehaviors: [
        'environmental awareness',
        'community engagement',
        'cultural appreciation',
        'sustainable lifestyle choices',
        'mindfulness practices'
      ],
      skillsValued: [
        'systems thinking',
        'emotional intelligence',
        'adaptation capability',
        'cross-cultural communication',
        'technological fluency'
      ]
    };
    
    // Initialize Azure services
    this.initAzureServices();
  }
  
  async initAzureServices() {
    try {
      // Azure OpenAI for recruitment assessments
      const credential = new DefaultAzureCredential();
      const openAIEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
      
      this.openAIClient = new OpenAIClient(openAIEndpoint, credential);
      this.deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4';
      
      // Azure AI Search for matching candidates to opportunities
      const searchEndpoint = process.env.AZURE_SEARCH_ENDPOINT;
      const searchKey = process.env.AZURE_SEARCH_KEY;
      const searchIndexName = process.env.AZURE_SEARCH_INDEX_NAME || 'recruitment-opportunities';
      
      this.searchClient = new SearchClient(
        searchEndpoint,
        searchIndexName,
        new AzureKeyCredential(searchKey)
      );
      
      console.log('RecruitmentAgent: Azure services initialized');
    } catch (error) {
      console.error('Failed to initialize Azure services:', error);
    }
  }
  
  async processInput(input, sessionData) {
    // Analyze input for recruitment-related queries
    const purposeAnalysis = await this.analyzePurpose(input);
    
    if (purposeAnalysis.isRecruitmentQuery) {
      // If this is about finding opportunities, search for matches
      if (purposeAnalysis.isOpportunitySearch) {
        return await this.findMatchingOpportunities(sessionData);
      } 
      // If this is about assessments or recruitment process
      else {
        return await this.generateRecruitmentResponse(input, sessionData);
      }
    } else {
      // For general inquiries about the program
      return this.getGeneralProgramInfo();
    }
  }
  
  async analyzePurpose(input) {
    try {
      // Use Azure OpenAI to determine the purpose of the user's query
      const prompt = `
        Analyze the following user input to determine if it's related to recruitment, and what specific aspect:
        
        User input: "${input}"
        
        Determine:
        1. Is this a recruitment-related query? (Yes/No)
        2. Is the user looking for specific opportunities? (Yes/No)
        3. What is the main focus of their question? (e.g., assessment process, qualifications, timeline, etc.)
      `;
      
      const result = await this.openAIClient.getChatCompletions(
        this.deploymentName,
        [
          { role: "system", content: "You analyze user queries to determine their intent related to recruitment." },
          { role: "user", content: prompt }
        ],
        { maxTokens: 200 }
      );
      
      const analysis = result.choices[0].message.content;
      
      // Parse the analysis to determine key factors
      const isRecruitmentQuery = analysis.toLowerCase().includes('yes') && 
                                !analysis.toLowerCase().includes('no, this is not a recruitment-related query');
                                
      const isOpportunitySearch = analysis.toLowerCase().includes('looking for specific opportunities: yes');
      
      return {
        isRecruitmentQuery,
        isOpportunitySearch,
        analysis
      };
    } catch (error) {
      console.error('Error analyzing query purpose:', error);
      return {
        isRecruitmentQuery: false,
        isOpportunitySearch: false,
        analysis: "Error analyzing query"
      };
    }
  }
  
  async findMatchingOpportunities(sessionData) {
    // Use user's assessment results to find matching opportunities
    const userTraits = sessionData.assessmentResults.personality || [];
    const userSkills = sessionData.assessmentResults.skills || [];
    
    try {
      // In a real implementation, this would search Azure AI Search for matches
      // For now, we'll return some sample opportunities
      return {
        type: 'recruitment_opportunities',
        message: "Based on your profile, here are some opportunities that may interest you:",
        opportunities: [
          {
            title: "Eco-Innovation Ambassador",
            organization: "GreenTech Solutions",
            description: "Collaborate with sustainable startups to implement new environmental technologies.",
            match: "85% match with your conscious tech profile",
            location: sessionData.location || "Remote"
          },
          {
            title: "Community Resilience Coordinator",
            organization: "Global Sustainability Network",
            description: "Coordinate local initiatives that build community resilience against climate change.",
            match: "78% match with your community engagement traits",
            location: sessionData.location || "Multiple Locations"
          }
        ],
        traits_matched: userTraits.slice(0, 3),
        skills_matched: userSkills.slice(0, 3)
      };
    } catch (error) {
      console.error('Error finding matching opportunities:', error);
      return {
        type: 'recruitment_error',
        message: "I encountered an issue while searching for opportunities. Please try again later."
      };
    }
  }
  
  async generateRecruitmentResponse(input, sessionData) {
    try {
      // Use Azure OpenAI to generate a response about recruitment
      const prompt = `
        As a recruitment agent for a conscious organization, respond to the following query:
        
        "${input}"
        
        Consider these principles in your response:
        - We value conscious behaviors like: ${this.recruitmentCriteria.consciousBehaviors.join(', ')}
        - We seek skills such as: ${this.recruitmentCriteria.skillsValued.join(', ')}
        - Our process involves behavioral assessments rather than traditional interviews
        - We match people based on their authentic self rather than resume credentials
        
        Provide a helpful, engaging response that embodies our values.
      `;
      
      const result = await this.openAIClient.getChatCompletions(
        this.deploymentName,
        [
          { role: "system", content: "You are a recruitment specialist for a conscious organization that values authentic self-expression and sustainable living." },
          { role: "user", content: prompt }
        ],
        { maxTokens: 350 }
      );
      
      return {
        type: 'recruitment_info',
        content: result.choices[0].message.content,
        relevant_criteria: this.getRelevantCriteria(input)
      };
    } catch (error) {
      console.error('Error generating recruitment response:', error);
      return {
        type: 'recruitment_info',
        content: "I'd be happy to tell you about our unique recruitment approach that focuses on conscious behaviors and authentic self-expression. Our process involves behavioral assessments rather than traditional interviews, and we match people based on their genuine traits rather than just credentials.",
      };
    }
  }
  
  getRelevantCriteria(input) {
    // Determine which criteria are most relevant to the user's query
    // This would use more sophisticated analysis in a real implementation
    const inputLower = input.toLowerCase();
    
    const relevantBehaviors = this.recruitmentCriteria.consciousBehaviors.filter(
      behavior => inputLower.includes(behavior.toLowerCase())
    );
    
    const relevantSkills = this.recruitmentCriteria.skillsValued.filter(
      skill => inputLower.includes(skill.toLowerCase().replace(' ', '')) || 
              inputLower.includes(skill.toLowerCase())
    );
    
    return {
      behaviors: relevantBehaviors.length > 0 ? relevantBehaviors : this.recruitmentCriteria.consciousBehaviors.slice(0, 2),
      skills: relevantSkills.length > 0 ? relevantSkills : this.recruitmentCriteria.skillsValued.slice(0, 2)
    };
  }
  
  getGeneralProgramInfo() {
    return {
      type: 'general_info',
      content: `Our onboarding program identifies and recruits conscious individuals who align with our values of sustainability, community engagement, and mindful innovation. We use a unique approach that combines behavioral assessments, city exploration, and community building through shared experiences and stories.`,
      key_values: [
        'Authentic self-expression',
        'Sustainable lifestyle',
        'Community engagement',
        'Conscious technology use'
      ]
    };
  }
}

module.exports = RecruitmentAgent;
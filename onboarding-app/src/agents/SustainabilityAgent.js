// SustainabilityAgent.js
// This agent helps users assess and improve their environmental impact

const { DefaultAzureCredential } = require('@azure/identity');
const { OpenAIClient } = require('@azure/openai');
const { SearchClient, AzureKeyCredential } = require('@azure/search-documents');

class SustainabilityAgent {
  constructor() {
    this.name = 'SustainabilityAgent';
    this.sustainabilityCategories = [
      'transportation', 
      'energy_usage', 
      'food_consumption', 
      'waste_management', 
      'water_usage',
      'purchasing_habits'
    ];
    this.userSustainabilityProfile = {};
    
    // Initialize Azure services
    this.initAzureServices();
  }
  
  async initAzureServices() {
    try {
      // Azure OpenAI for sustainability analysis
      const credential = new DefaultAzureCredential();
      const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
      
      this.openAIClient = new OpenAIClient(endpoint, credential);
      this.deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4';
      
      // Azure AI Search for sustainability resources
      this.searchClient = new SearchClient(
        process.env.AZURE_SEARCH_ENDPOINT,
        process.env.AZURE_SEARCH_INDEX_NAME,
        new AzureKeyCredential(process.env.AZURE_SEARCH_API_KEY)
      );
      
      console.log('SustainabilityAgent: Azure services initialized');
    } catch (error) {
      console.error('Failed to initialize Azure services:', error);
    }
  }
  
  async createUserSustainabilityProfile(userId, initialSurveyData) {
    this.userSustainabilityProfile = {
      userId,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      initialSurvey: initialSurveyData,
      categories: {},
      overallScore: 0,
      recommendationHistory: [],
      improvementGoals: []
    };
    
    // Process initial survey data to populate category scores
    for (const category of this.sustainabilityCategories) {
      this.userSustainabilityProfile.categories[category] = {
        score: this.calculateInitialScore(category, initialSurveyData),
        assessedAt: new Date().toISOString(),
        detailedData: {},
        recommendations: []
      };
    }
    
    // Calculate overall sustainability score
    this.userSustainabilityProfile.overallScore = this.calculateOverallScore();
    
    return {
      type: 'sustainability_profile_created',
      profile: this.getSafeProfileCopy(),
      message: "Your sustainability profile has been created. Would you like to see your initial assessment?"
    };
  }
  
  calculateInitialScore(category, surveyData) {
    // Map survey questions to categories and calculate initial scores
    const categoryQuestions = {
      transportation: ['transport_primary_mode', 'commute_distance', 'flights_per_year'],
      energy_usage: ['home_energy_source', 'heating_cooling_habits', 'appliance_efficiency'],
      food_consumption: ['diet_type', 'local_food_percentage', 'food_waste_frequency'],
      waste_management: ['recycling_habits', 'composting', 'single_use_plastics'],
      water_usage: ['shower_length', 'water_saving_devices', 'lawn_watering_frequency'],
      purchasing_habits: ['new_vs_used', 'product_lifespan_consideration', 'packaging_consideration']
    };
    
    // Get relevant questions for this category
    const relevantQuestions = categoryQuestions[category] || [];
    
    // Count how many questions have sustainable answers
    let sustainableAnswers = 0;
    let totalQuestions = relevantQuestions.length;
    
    for (const question of relevantQuestions) {
      if (surveyData[question]) {
        const answer = surveyData[question];
        
        // Simple scoring logic - can be expanded for more sophisticated assessment
        if (category === 'transportation') {
          if (question === 'transport_primary_mode' && ['walking', 'cycling', 'public_transit'].includes(answer)) sustainableAnswers++;
          if (question === 'commute_distance' && parseInt(answer) < 10) sustainableAnswers++;
          if (question === 'flights_per_year' && parseInt(answer) <= 2) sustainableAnswers++;
        }
        
        else if (category === 'energy_usage') {
          if (question === 'home_energy_source' && ['solar', 'wind', 'renewable_mix'].includes(answer)) sustainableAnswers++;
          if (question === 'heating_cooling_habits' && ['moderate', 'minimal'].includes(answer)) sustainableAnswers++;
          if (question === 'appliance_efficiency' && ['highly_efficient', 'energy_star'].includes(answer)) sustainableAnswers++;
        }
        
        else if (category === 'food_consumption') {
          if (question === 'diet_type' && ['vegetarian', 'vegan', 'plant_based', 'reducetarian'].includes(answer)) sustainableAnswers++;
          if (question === 'local_food_percentage' && parseInt(answer) >= 50) sustainableAnswers++;
          if (question === 'food_waste_frequency' && ['rarely', 'never'].includes(answer)) sustainableAnswers++;
        }
        
        else if (category === 'waste_management') {
          if (question === 'recycling_habits' && ['always', 'mostly'].includes(answer)) sustainableAnswers++;
          if (question === 'composting' && ['yes', 'sometimes'].includes(answer)) sustainableAnswers++;
          if (question === 'single_use_plastics' && ['avoid', 'minimal'].includes(answer)) sustainableAnswers++;
        }
        
        else if (category === 'water_usage') {
          if (question === 'shower_length' && parseInt(answer) <= 5) sustainableAnswers++;
          if (question === 'water_saving_devices' && answer === 'yes') sustainableAnswers++;
          if (question === 'lawn_watering_frequency' && ['never', 'drought_only', 'rainwater'].includes(answer)) sustainableAnswers++;
        }
        
        else if (category === 'purchasing_habits') {
          if (question === 'new_vs_used' && ['mostly_used', 'balance', 'repair_first'].includes(answer)) sustainableAnswers++;
          if (question === 'product_lifespan_consideration' && ['always', 'usually'].includes(answer)) sustainableAnswers++;
          if (question === 'packaging_consideration' && ['zero_waste', 'minimal_packaging'].includes(answer)) sustainableAnswers++;
        }
      }
    }
    
    // Calculate score as percentage
    const scorePercentage = totalQuestions > 0 ? (sustainableAnswers / totalQuestions) * 100 : 50;
    return Math.round(scorePercentage);
  }
  
  calculateOverallScore() {
    // Calculate the overall sustainability score based on category scores
    let totalScore = 0;
    let categoryCount = 0;
    
    for (const category of Object.keys(this.userSustainabilityProfile.categories)) {
      totalScore += this.userSustainabilityProfile.categories[category].score;
      categoryCount++;
    }
    
    return categoryCount > 0 ? Math.round(totalScore / categoryCount) : 0;
  }
  
  getSafeProfileCopy() {
    // Return a copy of the profile without sensitive data
    const profileCopy = JSON.parse(JSON.stringify(this.userSustainabilityProfile));
    
    // Remove any potentially sensitive information
    delete profileCopy.detailedAnalysis;
    
    return profileCopy;
  }
  
  async getProfileSummary() {
    // Generate a summary of the user's sustainability profile
    try {
      const profile = this.getSafeProfileCopy();
      
      const prompt = `
        Create a friendly, encouraging sustainability profile summary based on this data:
        ${JSON.stringify(profile)}
        
        Include:
        1. A personalized greeting
        2. Their overall sustainability score explained in positive terms
        3. Their strongest sustainability category
        4. Their area with the most potential for improvement
        5. One simple tip for improvement
        
        Keep it concise, positive and motivational.
      `;
      
      const result = await this.openAIClient.getChatCompletions(
        this.deploymentName,
        [
          { role: "system", content: "You are a supportive sustainability coach who helps people improve their environmental impact." },
          { role: "user", content: prompt }
        ],
        { maxTokens: 400 }
      );
      
      return {
        type: 'sustainability_summary',
        summary: result.choices[0].message.content,
        profile: profile
      };
      
    } catch (error) {
      console.error('Error generating sustainability profile summary:', error);
      return {
        type: 'sustainability_summary',
        summary: `Here's your sustainability profile! Your overall score is ${this.userSustainabilityProfile.overallScore}/100. Let's work together to improve your environmental impact.`,
        profile: this.getSafeProfileCopy()
      };
    }
  }
  
  async getRecommendationsForCategory(category) {
    // Get personalized recommendations for a specific sustainability category
    try {
      if (!this.userSustainabilityProfile.categories[category]) {
        return {
          type: 'error',
          message: 'Category not found in your sustainability profile.'
        };
      }
      
      const categoryData = this.userSustainabilityProfile.categories[category];
      const score = categoryData.score;
      
      // Get recommendations from Azure AI Search
      const searchResults = await this.searchClient.search(category, {
        select: ["id", "title", "description", "difficulty", "impact", "category"],
        filter: `category eq '${category}' and targetScoreRange ge ${Math.max(0, score - 20)} and targetScoreRange le ${Math.min(100, score + 20)}`,
        top: 5
      });
      
      const recommendations = [];
      for await (const result of searchResults.results) {
        recommendations.push(result.document);
      }
      
      // If we don't have enough recommendations from search, generate some
      if (recommendations.length < 3) {
        const additionalRecs = await this.generateRecommendations(category, score);
        recommendations.push(...additionalRecs);
      }
      
      // Store the recommendations in the profile
      this.userSustainabilityProfile.categories[category].recommendations = recommendations;
      this.userSustainabilityProfile.lastUpdated = new Date().toISOString();
      
      return {
        type: 'sustainability_recommendations',
        category: category,
        recommendations: recommendations,
        currentScore: score
      };
      
    } catch (error) {
      console.error(`Error getting recommendations for ${category}:`, error);
      
      // Fallback to generated recommendations
      const recommendations = await this.generateRecommendations(category, this.userSustainabilityProfile.categories[category]?.score || 50);
      
      return {
        type: 'sustainability_recommendations',
        category: category,
        recommendations: recommendations,
        currentScore: this.userSustainabilityProfile.categories[category]?.score || 50,
        note: 'Generated recommendations due to service error'
      };
    }
  }
  
  async generateRecommendations(category, score) {
    // Generate recommendations using Azure OpenAI when search fails
    try {
      const difficultyLevel = score < 30 ? 'beginner' : (score < 70 ? 'intermediate' : 'advanced');
      
      const prompt = `
        Generate 3 practical sustainability recommendations for the "${category}" category.
        The user's current sustainability score in this area is ${score}/100.
        Recommendations should be appropriate for someone at the ${difficultyLevel} level.
        
        For each recommendation, include:
        - A clear title (1-5 words)
        - A brief description (1-2 sentences)
        - Difficulty level (easy, medium, hard)
        - Environmental impact (low, medium, high)
        
        Format as a JSON array with objects containing: title, description, difficulty, impact, category
      `;
      
      const result = await this.openAIClient.getChatCompletions(
        this.deploymentName,
        [
          { role: "system", content: "You are a sustainability expert who provides practical, actionable recommendations." },
          { role: "user", content: prompt }
        ],
        { maxTokens: 800 }
      );
      
      let recommendations;
      try {
        recommendations = JSON.parse(result.choices[0].message.content);
      } catch (e) {
        // Fallback if parsing fails
        recommendations = [
          {
            title: `Improve your ${category}`,
            description: `A simple way to be more sustainable in your ${category.replace('_', ' ')}.`,
            difficulty: "easy",
            impact: "medium",
            category: category
          }
        ];
      }
      
      return recommendations;
      
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return [
        {
          title: `Improve your ${category}`,
          description: `A simple way to be more sustainable in your ${category.replace('_', ' ')}.`,
          difficulty: "easy",
          impact: "medium",
          category: category
        }
      ];
    }
  }
  
  async updateCategoryWithNewData(category, newData) {
    // Update a category with new information from the user
    if (!this.userSustainabilityProfile.categories[category]) {
      return {
        type: 'error',
        message: 'Category not found in your sustainability profile.'
      };
    }
    
    // Merge new data with existing detailed data
    this.userSustainabilityProfile.categories[category].detailedData = {
      ...this.userSustainabilityProfile.categories[category].detailedData,
      ...newData
    };
    
    // Recalculate the category score based on the new data
    const newScore = await this.calculateUpdatedScore(category, newData);
    
    // Update the category score
    this.userSustainabilityProfile.categories[category].score = newScore;
    this.userSustainabilityProfile.categories[category].assessedAt = new Date().toISOString();
    
    // Recalculate overall score
    this.userSustainabilityProfile.overallScore = this.calculateOverallScore();
    this.userSustainabilityProfile.lastUpdated = new Date().toISOString();
    
    return {
      type: 'category_updated',
      category: category,
      newScore: newScore,
      overallScore: this.userSustainabilityProfile.overallScore,
      message: `Your ${category.replace('_', ' ')} information has been updated! Your new score in this category is ${newScore}/100.`
    };
  }
  
  async calculateUpdatedScore(category, newData) {
    // Calculate updated score based on detailed sustainability information
    try {
      // Use existing score as baseline
      let baseScore = this.userSustainabilityProfile.categories[category].score;
      
      // Construct a prompt to analyze the new data
      const prompt = `
        The user has a current sustainability score of ${baseScore}/100 in the ${category} category.
        Please analyze this new information and determine if their score should change:
        
        ${JSON.stringify(newData)}
        
        Based on this information, what should their new score be (1-100)?
        Consider how sustainable their reported behaviors are compared to average.
        Respond with ONLY a number between 1-100.
      `;
      
      const result = await this.openAIClient.getChatCompletions(
        this.deploymentName,
        [
          { role: "system", content: "You are a sustainability assessment expert. Be fair but rigorous in evaluating sustainability behaviors." },
          { role: "user", content: prompt }
        ],
        { maxTokens: 100 }
      );
      
      // Extract score from response
      const scoreText = result.choices[0].message.content.trim();
      const scoreMatch = scoreText.match(/\d+/);
      if (scoreMatch) {
        const newScore = parseInt(scoreMatch[0]);
        if (newScore >= 1 && newScore <= 100) {
          return newScore;
        }
      }
      
      // If we can't parse a valid score, return the original
      return baseScore;
      
    } catch (error) {
      console.error('Error calculating updated score:', error);
      // Return existing score as fallback
      return this.userSustainabilityProfile.categories[category].score;
    }
  }
  
  async addImprovementGoal(category, goalDescription, targetDate) {
    // Add a new sustainability improvement goal
    const goal = {
      id: Date.now().toString(),
      category,
      description: goalDescription,
      createdAt: new Date().toISOString(),
      targetDate: targetDate || null,
      status: 'active',
      progress: 0,
      checkIns: []
    };
    
    this.userSustainabilityProfile.improvementGoals.push(goal);
    this.userSustainabilityProfile.lastUpdated = new Date().toISOString();
    
    return {
      type: 'goal_created',
      goal: goal,
      message: `Your sustainability goal has been added! We'll help you track your progress.`
    };
  }
  
  async updateGoalProgress(goalId, progressUpdate) {
    // Update progress on an existing goal
    const goalIndex = this.userSustainabilityProfile.improvementGoals.findIndex(g => g.id === goalId);
    
    if (goalIndex === -1) {
      return {
        type: 'error',
        message: 'Goal not found in your sustainability profile.'
      };
    }
    
    // Add a check-in record
    const checkIn = {
      date: new Date().toISOString(),
      progressValue: progressUpdate.progress,
      notes: progressUpdate.notes || ''
    };
    
    this.userSustainabilityProfile.improvementGoals[goalIndex].checkIns.push(checkIn);
    this.userSustainabilityProfile.improvementGoals[goalIndex].progress = progressUpdate.progress;
    
    // Update goal status if needed
    if (progressUpdate.progress >= 100) {
      this.userSustainabilityProfile.improvementGoals[goalIndex].status = 'completed';
    } else if (progressUpdate.progress > 0) {
      this.userSustainabilityProfile.improvementGoals[goalIndex].status = 'in_progress';
    }
    
    this.userSustainabilityProfile.lastUpdated = new Date().toISOString();
    
    return {
      type: 'goal_updated',
      goal: this.userSustainabilityProfile.improvementGoals[goalIndex],
      message: progressUpdate.progress >= 100 
        ? 'Congratulations! You\'ve completed your sustainability goal!' 
        : `Goal progress updated to ${progressUpdate.progress}%. Keep up the good work!`
    };
  }
  
  async getSustainabilityResources(topic, userLocation = null) {
    // Get sustainability resources and information based on a topic
    try {
      // Search for resources based on the topic
      const searchQuery = userLocation ? `${topic} ${userLocation}` : topic;
      
      const searchResults = await this.searchClient.search(searchQuery, {
        select: ["id", "title", "description", "resourceType", "url", "location", "tags"],
        filter: userLocation ? `location eq null or location eq '${userLocation}'` : undefined,
        top: 5
      });
      
      const resources = [];
      for await (const result of searchResults.results) {
        resources.push(result.document);
      }
      
      // If we don't have enough resources, generate some
      if (resources.length < 3) {
        const additionalResources = await this.generateResources(topic, userLocation);
        resources.push(...additionalResources);
      }
      
      return {
        type: 'sustainability_resources',
        topic: topic,
        location: userLocation,
        resources: resources
      };
      
    } catch (error) {
      console.error(`Error getting sustainability resources:`, error);
      
      // Fallback to generated resources
      const resources = await this.generateResources(topic, userLocation);
      
      return {
        type: 'sustainability_resources',
        topic: topic,
        location: userLocation,
        resources: resources,
        note: 'Generated resources due to service error'
      };
    }
  }
  
  async generateResources(topic, location = null) {
    // Generate resource recommendations using Azure OpenAI
    try {
      const locationSpecific = location ? `relevant to ${location}` : 'generally applicable';
      
      const prompt = `
        Generate 3 high-quality sustainability resources about "${topic}" that are ${locationSpecific}.
        
        For each resource, include:
        - A descriptive title
        - A brief description (1-2 sentences)
        - Resource type (website, app, book, organization, tool)
        - A plausible URL
        - Relevant tags (3-5 keywords)
        
        Format as a JSON array with objects containing: title, description, resourceType, url, location, tags
      `;
      
      const result = await this.openAIClient.getChatCompletions(
        this.deploymentName,
        [
          { role: "system", content: "You are a sustainability researcher who curates high-quality educational resources." },
          { role: "user", content: prompt }
        ],
        { maxTokens: 800 }
      );
      
      let resources;
      try {
        resources = JSON.parse(result.choices[0].message.content);
        // Add location if provided
        if (location) {
          resources.forEach(resource => {
            resource.location = location;
          });
        }
      } catch (e) {
        // Fallback if parsing fails
        resources = [
          {
            title: `${topic} Resource Guide`,
            description: `A helpful resource about ${topic} for sustainability-minded individuals.`,
            resourceType: "website",
            url: `https://sustainabilityresource.org/${topic.toLowerCase().replace(/\s+/g, '-')}`,
            location: location,
            tags: ["sustainability", topic.toLowerCase(), "resources"]
          }
        ];
      }
      
      return resources;
      
    } catch (error) {
      console.error('Error generating resources:', error);
      return [
        {
          title: `${topic} Resource Guide`,
          description: `A helpful resource about ${topic} for sustainability-minded individuals.`,
          resourceType: "website",
          url: `https://sustainabilityresource.org/${topic.toLowerCase().replace(/\s+/g, '-')}`,
          location: location,
          tags: ["sustainability", topic.toLowerCase(), "resources"]
        }
      ];
    }
  }
  
  async processMessage(message, userData) {
    // Process general sustainability-related messages
    try {
      const userProfile = this.userSustainabilityProfile;
      
      // Create a context string that includes relevant user data
      let context = `User sustainability profile: Overall score ${userProfile.overallScore || 'unknown'}/100.`;
      
      if (userProfile.categories) {
        Object.entries(userProfile.categories).forEach(([category, data]) => {
          context += ` ${category.replace('_', ' ')}: ${data.score}/100.`;
        });
      }
      
      // Add goals if available
      if (userProfile.improvementGoals && userProfile.improvementGoals.length > 0) {
        context += " Current goals: " + userProfile.improvementGoals
          .filter(g => g.status === 'active' || g.status === 'in_progress')
          .map(g => g.description)
          .join(", ");
      }
      
      const prompt = `
        Context about the user: ${context}
        
        User message: "${message}"
        
        Respond to this message as a supportive sustainability coach. Be helpful, encouraging, and practical.
        If they're asking about sustainability topics, provide accurate information.
        If they're seeking advice, give actionable suggestions tailored to their profile.
        If they're reporting progress, be encouraging.
        Keep your response concise (3-5 sentences).
      `;
      
      const result = await this.openAIClient.getChatCompletions(
        this.deploymentName,
        [
          { role: "system", content: "You are a supportive sustainability coach who helps people improve their environmental impact. Your responses are friendly, practical, and encouraging." },
          { role: "user", content: prompt }
        ],
        { maxTokens: 300 }
      );
      
      return {
        type: 'message_response',
        response: result.choices[0].message.content
      };
      
    } catch (error) {
      console.error('Error processing message:', error);
      return {
        type: 'message_response',
        response: "I'm here to help with your sustainability journey! Let me know if you'd like to set a specific goal, learn about sustainable practices, or get personalized recommendations."
      };
    }
  }
}

module.exports = SustainabilityAgent;
/**
 * Trait Agent
 * Specialized agent for analyzing candidate traits and skills
 */

const BaseAgent = require('./BaseAgent');

class TraitAgent extends BaseAgent {
  constructor(config = {}) {
    super(config);
    
    this.tools = [
      {
        type: "function",
        function: {
          name: "search_candidates_by_traits",
          description: "Search for candidates with specific traits or skills",
          parameters: {
            type: "object",
            properties: {
              traits: {
                type: "array",
                description: "List of traits or skills to search for",
                items: {
                  type: "string"
                }
              },
              location: {
                type: "string",
                description: "Optional location filter for candidates"
              },
              experienceLevel: {
                type: "string",
                description: "Optional experience level filter (Junior, Mid, Senior)",
                enum: ["Junior", "Mid", "Senior", "Any"]
              },
              limit: {
                type: "integer",
                description: "Maximum number of candidates to return"
              }
            },
            required: ["traits"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "analyze_candidate_traits",
          description: "Analyze the traits and skills of a specific candidate",
          parameters: {
            type: "object",
            properties: {
              candidateId: {
                type: "string",
                description: "Unique identifier for the candidate"
              },
              focusAreas: {
                type: "array",
                description: "Optional list of trait areas to focus on in analysis",
                items: {
                  type: "string"
                }
              }
            },
            required: ["candidateId"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "compare_candidates",
          description: "Compare traits between multiple candidates",
          parameters: {
            type: "object",
            properties: {
              candidateIds: {
                type: "array",
                description: "List of candidate IDs to compare",
                items: {
                  type: "string"
                }
              },
              traits: {
                type: "array",
                description: "Optional specific traits to compare",
                items: {
                  type: "string"
                }
              }
            },
            required: ["candidateIds"]
          }
        }
      }
    ];
    
    this.systemPrompt = `You are a specialized candidate trait analysis agent.
Your goal is to help recruiters identify candidates with specific traits and skills, and provide detailed analysis of candidate profiles.
Use the search_candidates_by_traits tool to find candidates with specific traits, and the analyze_candidate_traits tool to get deeper insights into specific candidates.
When analyzing candidates, consider:
1. Both explicit skills and traits mentioned in their profile
2. Implicit traits that can be inferred from their experience and accomplishments
3. The strength of evidence for each trait
4. How traits might translate to job performance in different roles
Always provide balanced analysis that highlights both strengths and potential areas for development.
Answer only trait-related questions. For other recruitment questions, inform users that you specialize in candidate trait analysis.`;
  }

  /**
   * Processes a user query related to candidate traits
   * @param {string} query - User's trait-related query
   * @param {Object} context - Current context with candidate information
   * @param {MCPProtocolHandler} protocolHandler - MCP protocol handler
   * @returns {Promise<Object>} Processing result
   */
  async process(query, context, protocolHandler) {
    try {
      // Use MCP to process the trait query with appropriate tools
      const response = await protocolHandler.processMessage(
        query,
        'traitAgent',
        this.tools
      );
      
      // Check if there are any tool calls in the response
      const toolCalls = protocolHandler.extractToolCalls(response);
      
      let candidates = [];
      let analysisResult = null;
      let comparisonResult = null;
      
      // Execute any tool calls
      if (toolCalls && toolCalls.length > 0) {
        for (const toolCall of toolCalls) {
          const args = JSON.parse(toolCall.function.arguments);
          
          if (toolCall.function.name === 'search_candidates_by_traits') {
            // Search candidates with specific traits
            const searchResults = await this.search_candidates_by_traits(args);
            candidates = searchResults.candidates || [];
          } else if (toolCall.function.name === 'analyze_candidate_traits') {
            // Analyze specific candidate traits
            analysisResult = await this.analyze_candidate_traits(args);
          } else if (toolCall.function.name === 'compare_candidates') {
            // Compare candidates on specific traits
            comparisonResult = await this.compare_candidates(args);
          }
        }
      }
      
      // Generate appropriate summary based on which data was retrieved
      let summary = '';
      let data = null;
      
      if (candidates.length > 0) {
        summary = this.generateCandidateSummary(candidates);
        data = { candidates };
      } else if (analysisResult) {
        summary = this.generateAnalysisSummary(analysisResult);
        data = { analysis: analysisResult };
      } else if (comparisonResult) {
        summary = this.generateComparisonSummary(comparisonResult);
        data = { comparison: comparisonResult };
      } else {
        // No tool calls were made, use AI response directly
        summary = response.content;
      }
      
      return {
        summary,
        data
      };
    } catch (error) {
      console.error('Error in trait agent processing:', error);
      return {
        summary: `Error analyzing candidate traits: ${error.message}`,
        data: null
      };
    }
  }

  /**
   * Search for candidates with specific traits
   * @param {Object} params - Search parameters
   * @returns {Promise<Object>} Search results
   */
  async search_candidates_by_traits(params) {
    try {
      console.log(`Searching candidates with traits: ${params.traits.join(', ')}`);
      
      // In a real implementation, this would query your candidate database
      // For demo purposes, we'll return mock candidate data
      const mockCandidates = [
        {
          id: 'C001',
          name: 'Alex Explorer',
          traits: ['empathetic', 'creative', 'adaptable'],
          location: 'Berlin',
          experienceLevel: 'Senior',
          summary: 'Product designer with 8 years of experience focused on sustainability.',
          ecoScore: 87,
          recentReel: 'eco-journey-2024.mp4'
        },
        {
          id: 'C002',
          name: 'Jamie Trailblazer',
          traits: ['analytical', 'detail-oriented', 'organized'],
          location: 'London',
          experienceLevel: 'Mid',
          summary: 'Data analyst specializing in consumer behavior patterns.',
          ecoScore: 72,
          recentReel: 'data-insights-2025.mp4'
        },
        {
          id: 'C003',
          name: 'Riley Innovator',
          traits: ['creative', 'resilient', 'collaborative'],
          location: 'Stockholm',
          experienceLevel: 'Senior',
          summary: 'UX researcher with focus on accessibility solutions.',
          ecoScore: 91,
          recentReel: 'accessibility-innovations.mp4'
        }
      ];
      
      // Filter candidates based on traits
      let filteredCandidates = [...mockCandidates];
      
      // Filter by traits
      if (params.traits && params.traits.length > 0) {
        filteredCandidates = filteredCandidates.filter(candidate => 
          params.traits.some(trait => 
            candidate.traits.includes(trait.toLowerCase())
          )
        );
      }
      
      // Filter by location if provided
      if (params.location) {
        filteredCandidates = filteredCandidates.filter(
          candidate => candidate.location.toLowerCase() === params.location.toLowerCase()
        );
      }
      
      // Filter by experience level if provided
      if (params.experienceLevel && params.experienceLevel !== 'Any') {
        filteredCandidates = filteredCandidates.filter(
          candidate => candidate.experienceLevel === params.experienceLevel
        );
      }
      
      // Apply limit if provided
      if (params.limit && filteredCandidates.length > params.limit) {
        filteredCandidates = filteredCandidates.slice(0, params.limit);
      }
      
      return {
        candidates: filteredCandidates,
        totalFound: filteredCandidates.length
      };
    } catch (error) {
      console.error('Error searching candidates by traits:', error);
      throw error;
    }
  }

  /**
   * Analyze traits of a specific candidate
   * @param {Object} params - Analysis parameters
   * @returns {Promise<Object>} Analysis results
   */
  async analyze_candidate_traits(params) {
    try {
      console.log(`Analyzing traits for candidate ${params.candidateId}`);
      
      // In a real implementation, this would retrieve detailed candidate data
      const mockAnalysis = {
        candidateId: params.candidateId,
        name: params.candidateId === 'C001' ? 'Alex Explorer' : 
              params.candidateId === 'C002' ? 'Jamie Trailblazer' : 'Riley Innovator',
        traitScores: {
          empathy: params.candidateId === 'C001' ? 92 : 68,
          creativity: params.candidateId === 'C001' ? 85 : 
                      params.candidateId === 'C003' ? 94 : 72,
          resilience: params.candidateId === 'C003' ? 89 : 75,
          analytical: params.candidateId === 'C002' ? 91 : 67,
          leadership: params.candidateId === 'C001' ? 82 : 
                      params.candidateId === 'C002' ? 64 : 78
        },
        traitEvidence: {
          empathy: params.candidateId === 'C001' ? 
            ['Led community-focused design workshops', 'User testimonials highlight understanding of needs'] : 
            ['Shows consideration in feedback responses'],
          creativity: params.candidateId === 'C001' ? 
            ['Innovative eco-friendly design solutions', 'Cross-disciplinary approach to problems'] :
            params.candidateId === 'C003' ? 
            ['Developed novel accessibility frameworks', 'Pioneered inclusive design methodologies'] :
            ['Applied visualization techniques to complex data']
        },
        developmentAreas: params.candidateId === 'C001' ? 
          ['Could strengthen technical implementation knowledge'] :
          params.candidateId === 'C002' ? 
          ['May benefit from more collaborative project experience'] :
          ['Could develop strategic business perspective'],
        roleCompatibility: {
          'Project Manager': params.candidateId === 'C002' ? 87 : 72,
          'Design Lead': params.candidateId === 'C001' ? 91 : 
                         params.candidateId === 'C003' ? 88 : 65,
          'Research Specialist': params.candidateId === 'C003' ? 94 : 80
        }
      };
      
      // Filter analysis to focus areas if provided
      if (params.focusAreas && params.focusAreas.length > 0) {
        const filteredTraitScores = {};
        const filteredTraitEvidence = {};
        const lowercaseFocusAreas = params.focusAreas.map(area => area.toLowerCase());
        
        // Only include trait scores that match focus areas
        Object.keys(mockAnalysis.traitScores).forEach(trait => {
          if (lowercaseFocusAreas.includes(trait.toLowerCase())) {
            filteredTraitScores[trait] = mockAnalysis.traitScores[trait];
          }
        });
        
        // Only include trait evidence that match focus areas
        Object.keys(mockAnalysis.traitEvidence).forEach(trait => {
          if (lowercaseFocusAreas.includes(trait.toLowerCase())) {
            filteredTraitEvidence[trait] = mockAnalysis.traitEvidence[trait];
          }
        });
        
        mockAnalysis.traitScores = filteredTraitScores;
        mockAnalysis.traitEvidence = filteredTraitEvidence;
      }
      
      return mockAnalysis;
    } catch (error) {
      console.error(`Error analyzing candidate ${params.candidateId}:`, error);
      throw error;
    }
  }

  /**
   * Compare traits between multiple candidates
   * @param {Object} params - Comparison parameters
   * @returns {Promise<Object>} Comparison results
   */
  async compare_candidates(params) {
    try {
      console.log(`Comparing candidates: ${params.candidateIds.join(', ')}`);
      
      // Get trait analysis for each candidate
      const candidateAnalyses = await Promise.all(
        params.candidateIds.map(async (candidateId) => {
          return this.analyze_candidate_traits({ candidateId });
        })
      );
      
      // Compile comparison data
      const comparison = {
        candidates: candidateAnalyses.map(analysis => ({
          id: analysis.candidateId,
          name: analysis.name
        })),
        traitComparisons: {}
      };
      
      // If specific traits were requested, only compare those
      const traitsToCompare = params.traits || Object.keys(candidateAnalyses[0].traitScores);
      
      // Build comparison for each trait
      traitsToCompare.forEach(trait => {
        comparison.traitComparisons[trait] = candidateAnalyses.map(analysis => ({
          candidateId: analysis.candidateId,
          name: analysis.name,
          score: analysis.traitScores[trait] || 0,
          evidence: analysis.traitEvidence[trait] || []
        })).sort((a, b) => b.score - a.score); // Sort by score descending
      });
      
      return comparison;
    } catch (error) {
      console.error('Error comparing candidates:', error);
      throw error;
    }
  }

  /**
   * Generate a summary for candidate search results
   * @param {Array} candidates - Candidate search results
   * @returns {string} Summary text
   */
  generateCandidateSummary(candidates) {
    if (candidates.length === 0) {
      return "No candidates found matching your criteria.";
    }
    
    // Group candidates by common traits
    const traitGroups = {};
    candidates.forEach(candidate => {
      candidate.traits.forEach(trait => {
        if (!traitGroups[trait]) {
          traitGroups[trait] = [];
        }
        traitGroups[trait].push(candidate.name);
      });
    });
    
    // Find most common traits
    const sortedTraits = Object.entries(traitGroups)
      .sort(([, candidatesA], [, candidatesB]) => candidatesB.length - candidatesA.length)
      .slice(0, 3);
    
    let summary = `Found ${candidates.length} candidate${candidates.length !== 1 ? 's' : ''} `;
    
    // Mention locations if varied
    const locations = [...new Set(candidates.map(c => c.location))];
    if (locations.length === 1) {
      summary += `from ${locations[0]} `;
    } else if (locations.length <= 3) {
      summary += `from ${locations.slice(0, -1).join(', ')} and ${locations[locations.length - 1]} `;
    }
    
    summary += `with the requested traits. `;
    
    // Add most common trait breakdown
    if (sortedTraits.length > 0) {
      summary += `Notably, ${sortedTraits[0][1].length} candidates demonstrate strong ${sortedTraits[0][0]} skills.`;
    }
    
    return summary;
  }

  /**
   * Generate a summary for candidate analysis
   * @param {Object} analysis - Candidate analysis
   * @returns {string} Summary text
   */
  generateAnalysisSummary(analysis) {
    // Find top traits
    const topTraits = Object.entries(analysis.traitScores)
      .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
      .slice(0, 2);
    
    // Find areas for improvement
    const bottomTraits = Object.entries(analysis.traitScores)
      .sort(([, scoreA], [, scoreB]) => scoreA - scoreB)
      .slice(0, 1);
    
    // Find top role match
    const topRole = Object.entries(analysis.roleCompatibility)
      .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
      .slice(0, 1);
    
    let summary = `Analysis of ${analysis.name} shows exceptional strength in `;
    summary += `${topTraits.map(([trait, score]) => `${trait} (${score})`).join(' and ')}. `;
    
    if (bottomTraits.length > 0) {
      summary += `There's opportunity for development in ${bottomTraits[0][0]}. `;
    }
    
    if (topRole.length > 0) {
      summary += `Highest compatibility is with ${topRole[0][0]} role (${topRole[0][1]}% match).`;
    }
    
    return summary;
  }

  /**
   * Generate a summary for candidate comparison
   * @param {Object} comparison - Candidate comparison
   * @returns {string} Summary text
   */
  generateComparisonSummary(comparison) {
    const candidateCount = comparison.candidates.length;
    const traitCount = Object.keys(comparison.traitComparisons).length;
    
    let summary = `Comparison of ${candidateCount} candidates across ${traitCount} traits shows `;
    
    // Identify standout candidates for each trait
    const standouts = {};
    Object.entries(comparison.traitComparisons).forEach(([trait, candidates]) => {
      if (candidates.length > 0 && candidates[0].score >= 85) {
        const topCandidate = candidates[0];
        if (!standouts[topCandidate.name]) {
          standouts[topCandidate.name] = [];
        }
        standouts[topCandidate.name].push(trait);
      }
    });
    
    // Highlight standout candidates
    const standoutEntries = Object.entries(standouts);
    if (standoutEntries.length > 0) {
      summary += standoutEntries
        .map(([name, traits]) => `${name} excelling in ${traits.join(', ')}`)
        .join('; ');
      summary += '.';
    } else {
      summary += 'a balanced distribution of strengths with no clear standouts.';
    }
    
    return summary;
  }
}

module.exports = TraitAgent;
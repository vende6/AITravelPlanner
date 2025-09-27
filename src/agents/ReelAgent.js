/**
 * Reel Agent
 * Specialized agent for analyzing candidate video reels and journeys
 */

const BaseAgent = require('./BaseAgent');

class ReelAgent extends BaseAgent {
  constructor(config = {}) {
    super(config);
    
    this.tools = [
      {
        type: "function",
        function: {
          name: "search_reels",
          description: "Search for candidate reels based on criteria",
          parameters: {
            type: "object",
            properties: {
              themes: {
                type: "array",
                description: "List of themes or topics to search for in reels",
                items: {
                  type: "string"
                }
              },
              traits: {
                type: "array",
                description: "List of traits demonstrated in the reels",
                items: {
                  type: "string"
                }
              },
              duration: {
                type: "string",
                description: "Duration filter for reels (Short: <2min, Medium: 2-5min, Long: >5min)",
                enum: ["Short", "Medium", "Long", "Any"]
              },
              limit: {
                type: "integer",
                description: "Maximum number of reels to return"
              }
            },
            required: ["themes"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "analyze_reel",
          description: "Analyze a specific candidate's reel in detail",
          parameters: {
            type: "object",
            properties: {
              reelId: {
                type: "string",
                description: "Unique identifier for the reel"
              },
              focusAreas: {
                type: "array",
                description: "Optional specific areas to analyze (e.g., 'communication', 'storytelling')",
                items: {
                  type: "string"
                }
              }
            },
            required: ["reelId"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "summarize_candidate_journey",
          description: "Generate a summary of a candidate's professional journey from their reels",
          parameters: {
            type: "object",
            properties: {
              candidateId: {
                type: "string",
                description: "Unique identifier for the candidate"
              },
              journeyType: {
                type: "string",
                description: "Type of journey to summarize",
                enum: ["Career", "Eco", "Learning", "Project", "Full"]
              }
            },
            required: ["candidateId"]
          }
        }
      }
    ];
    
    this.systemPrompt = `You are a specialized candidate reel analysis agent.
Your goal is to help recruiters extract insights from candidate video reels and understand their professional journeys.
Use the search_reels tool to find reels on specific topics, analyze_reel for detailed analysis of specific videos, and summarize_candidate_journey to understand a candidate's professional path.
When analyzing reels, look for:
1. Communication style and clarity
2. Demonstrated technical and soft skills
3. Storytelling ability and authenticity
4. Evidence of values alignment with sustainable practices
5. Leadership and collaborative capabilities
Provide balanced analysis that acknowledges both strengths and areas for development.
Answer only questions related to candidate reels and journeys. For other recruitment questions, inform users you specialize in reel analysis.`;
  }

  /**
   * Processes a user query related to candidate reels
   * @param {string} query - User's reel-related query
   * @param {Object} context - Current context with candidate information
   * @param {MCPProtocolHandler} protocolHandler - MCP protocol handler
   * @returns {Promise<Object>} Processing result
   */
  async process(query, context, protocolHandler) {
    try {
      // Use MCP to process the reel query with appropriate tools
      const response = await protocolHandler.processMessage(
        query,
        'reelAgent',
        this.tools
      );
      
      // Check if there are any tool calls in the response
      const toolCalls = protocolHandler.extractToolCalls(response);
      
      let reels = [];
      let reelAnalysis = null;
      let journeySummary = null;
      
      // Execute any tool calls
      if (toolCalls && toolCalls.length > 0) {
        for (const toolCall of toolCalls) {
          const args = JSON.parse(toolCall.function.arguments);
          
          if (toolCall.function.name === 'search_reels') {
            // Search reels with specific themes or traits
            const searchResults = await this.search_reels(args);
            reels = searchResults.reels || [];
          } else if (toolCall.function.name === 'analyze_reel') {
            // Analyze a specific reel in detail
            reelAnalysis = await this.analyze_reel(args);
          } else if (toolCall.function.name === 'summarize_candidate_journey') {
            // Summarize a candidate's journey
            journeySummary = await this.summarize_candidate_journey(args);
          }
        }
      }
      
      // Generate appropriate summary based on which data was retrieved
      let summary = '';
      let data = null;
      
      if (reels.length > 0) {
        summary = this.generateReelSearchSummary(reels);
        data = { reels };
      } else if (reelAnalysis) {
        summary = this.generateReelAnalysisSummary(reelAnalysis);
        data = { reelAnalysis };
      } else if (journeySummary) {
        summary = this.generateJourneySummary(journeySummary);
        data = { journeySummary };
      } else {
        // No tool calls were made, use AI response directly
        summary = response.content;
      }
      
      return {
        summary,
        data
      };
    } catch (error) {
      console.error('Error in reel agent processing:', error);
      return {
        summary: `Error analyzing candidate reels: ${error.message}`,
        data: null
      };
    }
  }

  /**
   * Search for candidate reels
   * @param {Object} params - Search parameters
   * @returns {Promise<Object>} Search results
   */
  async search_reels(params) {
    try {
      console.log(`Searching reels with themes: ${params.themes.join(', ')}`);
      
      // In a real implementation, this would query your reel database
      // For demo purposes, we'll return mock reel data
      const mockReels = [
        {
          id: 'R001',
          candidateId: 'C001',
          candidateName: 'Alex Explorer',
          title: 'My Eco Journey',
          filename: 'eco-journey-2024.mp4',
          duration: 180, // seconds
          themes: ['sustainability', 'design process', 'innovation'],
          demonstratedTraits: ['empathy', 'creativity', 'leadership'],
          keyInsights: [
            'Reduced product packaging by 30%',
            'Implemented circular design principles',
            'Led cross-functional sustainability initiative'
          ],
          thumbnailUrl: 'https://example.com/thumbnails/eco-journey.jpg',
          uploadDate: '2024-06-15'
        },
        {
          id: 'R002',
          candidateId: 'C002',
          candidateName: 'Jamie Trailblazer',
          title: 'Data Insights Project',
          filename: 'data-insights-2025.mp4',
          duration: 360, // seconds
          themes: ['data analysis', 'consumer behavior', 'visualization'],
          demonstratedTraits: ['analytical', 'detail-oriented', 'problem-solving'],
          keyInsights: [
            'Developed new consumer segmentation model',
            'Increased targeting accuracy by 45%',
            'Created interactive dashboard for stakeholders'
          ],
          thumbnailUrl: 'https://example.com/thumbnails/data-insights.jpg',
          uploadDate: '2025-02-20'
        },
        {
          id: 'R003',
          candidateId: 'C003',
          candidateName: 'Riley Innovator',
          title: 'Accessibility Innovations',
          filename: 'accessibility-innovations.mp4',
          duration: 240, // seconds
          themes: ['accessibility', 'inclusive design', 'user research'],
          demonstratedTraits: ['creative', 'empathy', 'technical'],
          keyInsights: [
            'Created new accessible navigation patterns',
            'Conducted research with diverse user groups',
            'Reduced cognitive load while maintaining functionality'
          ],
          thumbnailUrl: 'https://example.com/thumbnails/accessibility-innovations.jpg',
          uploadDate: '2025-01-10'
        },
        {
          id: 'R004',
          candidateId: 'C001',
          candidateName: 'Alex Explorer',
          title: 'Sustainable Materials Research',
          filename: 'sustainable-materials.mp4',
          duration: 420, // seconds
          themes: ['sustainability', 'material science', 'innovation'],
          demonstratedTraits: ['curiosity', 'technical', 'analytical'],
          keyInsights: [
            'Researched biodegradable packaging alternatives',
            'Conducted lifecycle assessments on 12 materials',
            'Developed decision matrix for material selection'
          ],
          thumbnailUrl: 'https://example.com/thumbnails/sustainable-materials.jpg',
          uploadDate: '2024-09-05'
        }
      ];
      
      // Filter reels based on parameters
      let filteredReels = [...mockReels];
      
      // Filter by themes
      if (params.themes && params.themes.length > 0) {
        filteredReels = filteredReels.filter(reel => 
          params.themes.some(theme => 
            reel.themes.some(reelTheme => 
              reelTheme.toLowerCase().includes(theme.toLowerCase())
            )
          )
        );
      }
      
      // Filter by traits if provided
      if (params.traits && params.traits.length > 0) {
        filteredReels = filteredReels.filter(reel => 
          params.traits.some(trait => 
            reel.demonstratedTraits.some(reelTrait => 
              reelTrait.toLowerCase().includes(trait.toLowerCase())
            )
          )
        );
      }
      
      // Filter by duration if provided
      if (params.duration && params.duration !== 'Any') {
        filteredReels = filteredReels.filter(reel => {
          if (params.duration === 'Short') return reel.duration < 120;
          if (params.duration === 'Medium') return reel.duration >= 120 && reel.duration <= 300;
          if (params.duration === 'Long') return reel.duration > 300;
          return true;
        });
      }
      
      // Apply limit if provided
      if (params.limit && filteredReels.length > params.limit) {
        filteredReels = filteredReels.slice(0, params.limit);
      }
      
      return {
        reels: filteredReels,
        totalFound: filteredReels.length
      };
    } catch (error) {
      console.error('Error searching reels:', error);
      throw error;
    }
  }

  /**
   * Analyze a specific reel
   * @param {Object} params - Analysis parameters
   * @returns {Promise<Object>} Analysis results
   */
  async analyze_reel(params) {
    try {
      console.log(`Analyzing reel ${params.reelId}`);
      
      // In a real implementation, this would retrieve detailed reel data
      // and perform AI-powered analysis
      
      // Mock data based on reel ID
      let mockReel;
      if (params.reelId === 'R001') {
        mockReel = {
          id: 'R001',
          candidateId: 'C001',
          candidateName: 'Alex Explorer',
          title: 'My Eco Journey',
          duration: 180, // seconds
          fileUrl: 'https://example.com/reels/eco-journey-2024.mp4',
          transcriptExcerpts: [
            "When I started this project, I knew we needed to fundamentally rethink packaging.",
            "By listening to our customers' concerns about waste, we identified three key areas for improvement.",
            "The team's collaborative approach allowed us to implement solutions that reduced packaging by 30%."
          ]
        };
      } else if (params.reelId === 'R002') {
        mockReel = {
          id: 'R002',
          candidateId: 'C002',
          candidateName: 'Jamie Trailblazer',
          title: 'Data Insights Project',
          duration: 360, // seconds
          fileUrl: 'https://example.com/reels/data-insights-2025.mp4',
          transcriptExcerpts: [
            "We needed to go beyond basic demographics to truly understand customer behavior.",
            "By analyzing over 2 million data points, we identified 7 distinct consumer segments.",
            "The interactive dashboard we developed allowed stakeholders to explore patterns and make decisions."
          ]
        };
      } else if (params.reelId === 'R003') {
        mockReel = {
          id: 'R003',
          candidateId: 'C003',
          candidateName: 'Riley Innovator',
          title: 'Accessibility Innovations',
          duration: 240, // seconds
          fileUrl: 'https://example.com/reels/accessibility-innovations.mp4',
          transcriptExcerpts: [
            "Accessibility isn't an add-on feature, it's a fundamental design principle.",
            "We conducted research sessions with diverse user groups to understand varied needs.",
            "The navigation system we developed reduced cognitive load while maintaining full functionality."
          ]
        };
      } else {
        mockReel = {
          id: 'R004',
          candidateId: 'C001',
          candidateName: 'Alex Explorer',
          title: 'Sustainable Materials Research',
          duration: 420, // seconds
          fileUrl: 'https://example.com/reels/sustainable-materials.mp4',
          transcriptExcerpts: [
            "We tested 12 different biodegradable materials against our sustainability criteria.",
            "The lifecycle assessment revealed surprising results about water usage versus carbon footprint.",
            "Our decision matrix helps teams make informed choices about material selection based on project priorities."
          ]
        };
      }
      
      // Perform analysis
      const analysis = {
        reel: mockReel,
        contentAnalysis: {
          clarity: params.reelId === 'R001' ? 92 : params.reelId === 'R002' ? 86 : 89,
          structure: params.reelId === 'R001' ? 88 : params.reelId === 'R002' ? 94 : 85,
          relevance: params.reelId === 'R001' ? 95 : params.reelId === 'R002' ? 88 : 92
        },
        presentationAnalysis: {
          delivery: params.reelId === 'R001' ? 90 : params.reelId === 'R002' ? 85 : 88,
          visualImpact: params.reelId === 'R001' ? 87 : params.reelId === 'R002' ? 83 : 92,
          engagementLevel: params.reelId === 'R001' ? 93 : params.reelId === 'R002' ? 84 : 90
        },
        skillsDemonstrated: params.reelId === 'R001' ? 
          ['Environmental awareness', 'Stakeholder communication', 'Project leadership'] :
          params.reelId === 'R002' ?
          ['Data analysis', 'Pattern recognition', 'Dashboard design'] :
          ['User research', 'Accessibility expertise', 'Inclusive design'],
        keyTakeaways: params.reelId === 'R001' ?
          ['Candidate shows strong commitment to sustainability principles', 'Demonstrates effective cross-functional leadership', 'Evidence of practical implementation of eco-friendly solutions'] :
          params.reelId === 'R002' ?
          ['Strong analytical capabilities with large datasets', 'Creates actionable insights from complex data', 'Focus on practical business applications'] :
          ['Deep understanding of accessibility challenges', 'Human-centered research approach', 'Innovative problem-solving']
      };
      
      // Filter analysis to focus areas if provided
      if (params.focusAreas && params.focusAreas.length > 0) {
        const focusAreasLower = params.focusAreas.map(area => area.toLowerCase());
        
        // Filter skillsDemonstrated
        analysis.skillsDemonstrated = analysis.skillsDemonstrated.filter(
          skill => focusAreasLower.some(
            area => skill.toLowerCase().includes(area)
          )
        );
        
        // Filter keyTakeaways
        analysis.keyTakeaways = analysis.keyTakeaways.filter(
          takeaway => focusAreasLower.some(
            area => takeaway.toLowerCase().includes(area)
          )
        );
      }
      
      return analysis;
    } catch (error) {
      console.error(`Error analyzing reel ${params.reelId}:`, error);
      throw error;
    }
  }

  /**
   * Generate a summary of a candidate's journey from their reels
   * @param {Object} params - Journey parameters
   * @returns {Promise<Object>} Journey summary
   */
  async summarize_candidate_journey(params) {
    try {
      console.log(`Summarizing ${params.journeyType} journey for candidate ${params.candidateId}`);
      
      // In a real implementation, this would analyze multiple reels
      // from a candidate and extract a coherent journey narrative
      
      let candidateName = '';
      let journeyTitle = '';
      let journeyPhases = [];
      let keyHighlights = [];
      let skills = [];
      
      // Mock data based on candidate ID and journey type
      if (params.candidateId === 'C001') {
        candidateName = 'Alex Explorer';
        
        if (params.journeyType === 'Eco' || params.journeyType === 'Full') {
          journeyTitle = 'Sustainability Champion';
          journeyPhases = [
            {
              title: 'Discovery',
              description: 'Initial exploration of sustainable design principles and their business impact',
              timeframe: '2022-2023'
            },
            {
              title: 'Implementation',
              description: 'Leading cross-functional teams to implement eco-friendly packaging solutions',
              timeframe: '2023-2024'
            },
            {
              title: 'Innovation',
              description: 'Researching and testing new biodegradable materials for future products',
              timeframe: '2024-2025'
            }
          ];
          keyHighlights = [
            'Reduced packaging waste by 30%',
            'Led sustainability initiative across 3 product lines',
            'Researched 12 alternative biodegradable materials',
            'Developed eco-material selection framework'
          ];
          skills = ['Sustainable Design', 'Cross-functional Leadership', 'Materials Research', 'Lifecycle Assessment'];
        } else if (params.journeyType === 'Career' || params.journeyType === 'Full') {
          journeyTitle = 'Product Design Evolution';
          journeyPhases = [
            {
              title: 'Foundation',
              description: 'Junior designer focusing on digital product interfaces',
              timeframe: '2017-2019'
            },
            {
              title: 'Expansion',
              description: 'Mid-level designer incorporating physical product design principles',
              timeframe: '2019-2022'
            },
            {
              title: 'Leadership',
              description: 'Senior designer leading sustainability initiatives and cross-functional teams',
              timeframe: '2022-Present'
            }
          ];
          keyHighlights = [
            'Progressed from UI focus to holistic product design',
            'Expanded skills to include physical product design',
            'Took on leadership of sustainability initiatives',
            'Developed mentorship program for junior designers'
          ];
          skills = ['UI/UX Design', 'Product Design', 'Team Leadership', 'Mentorship', 'Sustainability Integration'];
        }
      } else if (params.candidateId === 'C002') {
        candidateName = 'Jamie Trailblazer';
        
        if (params.journeyType === 'Project' || params.journeyType === 'Full') {
          journeyTitle = 'Data Insights Evolution';
          journeyPhases = [
            {
              title: 'Requirements Gathering',
              description: 'Identified key business questions and data availability',
              timeframe: 'Q1 2024'
            },
            {
              title: 'Analysis & Discovery',
              description: 'Deep analysis of consumer behavior patterns across 2M+ data points',
              timeframe: 'Q2-Q3 2024'
            },
            {
              title: 'Implementation & Rollout',
              description: 'Development of interactive dashboards and stakeholder training',
              timeframe: 'Q4 2024-Q1 2025'
            }
          ];
          keyHighlights = [
            'Analyzed 2M+ consumer data points',
            'Identified 7 distinct customer segments',
            'Increased targeting accuracy by 45%',
            'Developed interactive stakeholder dashboard'
          ];
          skills = ['Data Analysis', 'Consumer Behavior Modeling', 'Dashboard Design', 'Stakeholder Communication'];
        } else if (params.journeyType === 'Career' || params.journeyType === 'Full') {
          journeyTitle = 'Data Analytics Professional';
          journeyPhases = [
            {
              title: 'Foundations',
              description: 'Junior analyst working with structured datasets and basic reporting',
              timeframe: '2020-2022'
            },
            {
              title: 'Specialization',
              description: 'Mid-level analyst focusing on consumer behavior patterns',
              timeframe: '2022-2024'
            },
            {
              title: 'Leadership',
              description: 'Leading analytics projects and developing new methodologies',
              timeframe: '2024-Present'
            }
          ];
          keyHighlights = [
            'Progressed from basic reporting to advanced analytics',
            'Specialized in consumer behavior analysis',
            'Developed new segmentation methodologies',
            'Leading cross-departmental data initiatives'
          ];
          skills = ['Data Analysis', 'Consumer Behavior Modeling', 'Segmentation', 'Project Leadership', 'Methodology Development'];
        }
      } else if (params.candidateId === 'C003') {
        candidateName = 'Riley Innovator';
        
        if (params.journeyType === 'Learning' || params.journeyType === 'Full') {
          journeyTitle = 'Accessibility Expertise Development';
          journeyPhases = [
            {
              title: 'Foundation',
              description: 'Initial research into accessibility standards and best practices',
              timeframe: '2022'
            },
            {
              title: 'Application',
              description: 'Implementing accessibility improvements in existing products',
              timeframe: '2023'
            },
            {
              title: 'Innovation',
              description: 'Developing new accessibility frameworks and inclusive design methodologies',
              timeframe: '2024-Present'
            }
          ];
          keyHighlights = [
            'Certification in Web Content Accessibility Guidelines (WCAG)',
            'Conducted 50+ user research sessions with diverse participants',
            'Developed new navigation framework for cognitive accessibility',
            'Published research on inclusive design methodologies'
          ];
          skills = ['Accessibility Standards', 'Inclusive Research', 'Framework Development', 'Cognitive Design'];
        }
      }
      
      return {
        candidateId: params.candidateId,
        candidateName,
        journeyType: params.journeyType,
        journeyTitle,
        journeyPhases,
        keyHighlights,
        skills
      };
    } catch (error) {
      console.error(`Error summarizing journey for ${params.candidateId}:`, error);
      throw error;
    }
  }

  /**
   * Generate a summary for reel search results
   * @param {Array} reels - Reel search results
   * @returns {string} Summary text
   */
  generateReelSearchSummary(reels) {
    if (reels.length === 0) {
      return "No reels found matching your criteria.";
    }
    
    // Group reels by themes
    const themeGroups = {};
    reels.forEach(reel => {
      reel.themes.forEach(theme => {
        if (!themeGroups[theme]) {
          themeGroups[theme] = [];
        }
        themeGroups[theme].push(reel.title);
      });
    });
    
    // Find most common themes
    const sortedThemes = Object.entries(themeGroups)
      .sort(([, reelsA], [, reelsB]) => reelsB.length - reelsA.length)
      .slice(0, 2);
    
    // Group by candidates
    const candidateGroups = {};
    reels.forEach(reel => {
      if (!candidateGroups[reel.candidateName]) {
        candidateGroups[reel.candidateName] = [];
      }
      candidateGroups[reel.candidateName].push(reel);
    });
    
    const candidateCount = Object.keys(candidateGroups).length;
    
    let summary = `Found ${reels.length} reel${reels.length !== 1 ? 's' : ''} `;
    summary += `from ${candidateCount} candidate${candidateCount !== 1 ? 's' : ''}. `;
    
    // Add theme breakdown
    if (sortedThemes.length > 0) {
      summary += `Popular themes include ${sortedThemes.map(([theme]) => theme).join(' and ')}. `;
    }
    
    // Highlight candidate with most relevant reels
    const topCandidate = Object.entries(candidateGroups)
      .sort(([, reelsA], [, reelsB]) => reelsB.length - reelsA.length)[0];
    
    if (topCandidate) {
      summary += `${topCandidate[0]} has the most relevant content with ${topCandidate[1].length} reel${topCandidate[1].length !== 1 ? 's' : ''}.`;
    }
    
    return summary;
  }

  /**
   * Generate a summary for reel analysis
   * @param {Object} analysis - Reel analysis
   * @returns {string} Summary text
   */
  generateReelAnalysisSummary(analysis) {
    const reel = analysis.reel;
    const contentScores = Object.values(analysis.contentAnalysis);
    const presentationScores = Object.values(analysis.presentationAnalysis);
    
    // Calculate average scores
    const avgContentScore = contentScores.reduce((a, b) => a + b, 0) / contentScores.length;
    const avgPresentationScore = presentationScores.reduce((a, b) => a + b, 0) / presentationScores.length;
    
    let summary = `Analysis of "${reel.title}" by ${reel.candidateName} shows `;
    
    // Evaluate content and presentation
    if (avgContentScore >= 90) {
      summary += `outstanding content quality (${avgContentScore.toFixed(1)}) `;
    } else if (avgContentScore >= 80) {
      summary += `strong content quality (${avgContentScore.toFixed(1)}) `;
    } else {
      summary += `good content quality (${avgContentScore.toFixed(1)}) `;
    }
    
    summary += `and `;
    
    if (avgPresentationScore >= 90) {
      summary += `exceptional presentation (${avgPresentationScore.toFixed(1)}). `;
    } else if (avgPresentationScore >= 80) {
      summary += `effective presentation (${avgPresentationScore.toFixed(1)}). `;
    } else {
      summary += `adequate presentation (${avgPresentationScore.toFixed(1)}). `;
    }
    
    // Highlight key skills
    if (analysis.skillsDemonstrated && analysis.skillsDemonstrated.length > 0) {
      summary += `Key skills demonstrated include ${analysis.skillsDemonstrated.slice(0, 2).join(' and ')}`;
      if (analysis.skillsDemonstrated.length > 2) {
        summary += `, among others`;
      }
      summary += `.`;
    }
    
    return summary;
  }

  /**
   * Generate a summary for journey analysis
   * @param {Object} journey - Journey analysis
   * @returns {string} Summary text
   */
  generateJourneySummary(journey) {
    if (!journey || !journey.journeyPhases || journey.journeyPhases.length === 0) {
      return "Insufficient information to summarize candidate's journey.";
    }
    
    const phasesCount = journey.journeyPhases.length;
    const latestPhase = journey.journeyPhases[phasesCount - 1];
    const firstPhase = journey.journeyPhases[0];
    
    let summary = `${journey.candidateName}'s ${journey.journeyType.toLowerCase()} journey `;
    
    if (journey.journeyTitle) {
      summary += `"${journey.journeyTitle}" `;
    }
    
    summary += `spans ${phasesCount} phases, `;
    
    // Add timeframe if available
    if (firstPhase.timeframe && latestPhase.timeframe) {
      summary += `from ${firstPhase.timeframe} to ${latestPhase.timeframe}, `;
    }
    
    // Add progression summary
    summary += `progressing from "${firstPhase.title}" to "${latestPhase.title}". `;
    
    // Add key highlights
    if (journey.keyHighlights && journey.keyHighlights.length > 0) {
      summary += `Key accomplishments include ${journey.keyHighlights.slice(0, 2).join(' and ')}. `;
    }
    
    // Add skills
    if (journey.skills && journey.skills.length > 0) {
      summary += `Demonstrates expertise in ${journey.skills.slice(0, 3).join(', ')}`;
      if (journey.skills.length > 3) {
        summary += ', and other areas';
      }
      summary += '.';
    }
    
    return summary;
  }
}

module.exports = ReelAgent;
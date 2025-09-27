/**
 * Feedback Agent
 * Specialized agent for generating candidate feedback and follow-up recommendations
 */

const BaseAgent = require('./BaseAgent');

class FeedbackAgent extends BaseAgent {
  constructor(config = {}) {
    super(config);
    
    this.tools = [
      {
        type: "function",
        function: {
          name: "generate_interview_feedback",
          description: "Generate comprehensive feedback for a candidate after an interview",
          parameters: {
            type: "object",
            properties: {
              candidateId: {
                type: "string",
                description: "Unique identifier for the candidate"
              },
              interviewType: {
                type: "string",
                description: "Type of interview that was conducted",
                enum: ["Initial", "Technical", "Culture", "Leadership", "Case Study", "Final"]
              },
              focusAreas: {
                type: "array",
                description: "Optional specific areas to focus feedback on",
                items: {
                  type: "string"
                }
              },
              tone: {
                type: "string",
                description: "Tone to use for the feedback",
                enum: ["Constructive", "Encouraging", "Direct", "Balanced"]
              }
            },
            required: ["candidateId", "interviewType"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "suggest_follow_up_questions",
          description: "Generate follow-up questions for a specific candidate",
          parameters: {
            type: "object",
            properties: {
              candidateId: {
                type: "string",
                description: "Unique identifier for the candidate"
              },
              context: {
                type: "string",
                description: "Context for the follow-up questions (e.g., 'after technical interview', 'skills validation')",
              },
              topicArea: {
                type: "string",
                description: "Optional topic area to focus questions on",
                enum: ["Technical", "Leadership", "Cultural Fit", "Project Experience", "Problem Solving", "Sustainability"]
              },
              count: {
                type: "integer",
                description: "Number of questions to generate",
                minimum: 1,
                maximum: 10
              }
            },
            required: ["candidateId"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "create_development_plan",
          description: "Create a development plan for a candidate",
          parameters: {
            type: "object",
            properties: {
              candidateId: {
                type: "string",
                description: "Unique identifier for the candidate"
              },
              targetRole: {
                type: "string",
                description: "Target role or position for development"
              },
              timeframe: {
                type: "string",
                description: "Timeframe for the development plan",
                enum: ["30 Days", "90 Days", "6 Months", "1 Year"]
              },
              focusAreas: {
                type: "array",
                description: "Optional specific areas to focus on in the plan",
                items: {
                  type: "string"
                }
              }
            },
            required: ["candidateId", "targetRole"]
          }
        }
      }
    ];
    
    this.systemPrompt = `You are a specialized candidate feedback agent.
Your goal is to help recruiters provide constructive, balanced, and actionable feedback to candidates.
Use the generate_interview_feedback tool to create detailed feedback after interviews, suggest_follow_up_questions for follow-up conversations, and create_development_plan for longer-term candidate development.
When generating feedback:
1. Maintain a balanced perspective that acknowledges both strengths and areas for development
2. Provide specific, concrete examples whenever possible
3. Ensure feedback is actionable and development-focused
4. Align feedback with the company's values, especially sustainability and inclusion
5. Consider the candidate's level of experience and career trajectory
Answer only feedback-related questions. For other recruitment questions, inform users you specialize in candidate feedback and development.`;
  }

  /**
   * Processes a user query related to candidate feedback
   * @param {string} query - User's feedback-related query
   * @param {Object} context - Current context with candidate information
   * @param {MCPProtocolHandler} protocolHandler - MCP protocol handler
   * @returns {Promise<Object>} Processing result
   */
  async process(query, context, protocolHandler) {
    try {
      // Use MCP to process the feedback query with appropriate tools
      const response = await protocolHandler.processMessage(
        query,
        'feedbackAgent',
        this.tools
      );
      
      // Check if there are any tool calls in the response
      const toolCalls = protocolHandler.extractToolCalls(response);
      
      let interviewFeedback = null;
      let followUpQuestions = null;
      let developmentPlan = null;
      
      // Execute any tool calls
      if (toolCalls && toolCalls.length > 0) {
        for (const toolCall of toolCalls) {
          const args = JSON.parse(toolCall.function.arguments);
          
          if (toolCall.function.name === 'generate_interview_feedback') {
            // Generate interview feedback
            interviewFeedback = await this.generate_interview_feedback(args);
          } else if (toolCall.function.name === 'suggest_follow_up_questions') {
            // Generate follow-up questions
            followUpQuestions = await this.suggest_follow_up_questions(args);
          } else if (toolCall.function.name === 'create_development_plan') {
            // Create development plan
            developmentPlan = await this.create_development_plan(args);
          }
        }
      }
      
      // Generate appropriate summary based on which data was retrieved
      let summary = '';
      let data = null;
      
      if (interviewFeedback) {
        summary = this.generateFeedbackSummary(interviewFeedback);
        data = { interviewFeedback };
      } else if (followUpQuestions) {
        summary = this.generateFollowUpQuestionsSummary(followUpQuestions);
        data = { followUpQuestions };
      } else if (developmentPlan) {
        summary = this.generateDevelopmentPlanSummary(developmentPlan);
        data = { developmentPlan };
      } else {
        // No tool calls were made, use AI response directly
        summary = response.content;
      }
      
      return {
        summary,
        data
      };
    } catch (error) {
      console.error('Error in feedback agent processing:', error);
      return {
        summary: `Error generating candidate feedback: ${error.message}`,
        data: null
      };
    }
  }

  /**
   * Generate comprehensive interview feedback
   * @param {Object} params - Feedback parameters
   * @returns {Promise<Object>} Feedback results
   */
  async generate_interview_feedback(params) {
    try {
      console.log(`Generating ${params.interviewType} interview feedback for candidate ${params.candidateId}`);
      
      // In a real implementation, this would retrieve candidate data and interview notes
      // from your database and generate personalized feedback
      
      // Mock data based on candidate ID and interview type
      let mockCandidate;
      let strengths = [];
      let areasForImprovement = [];
      let overallAssessment = '';
      let recommendedNextSteps = [];
      
      if (params.candidateId === 'C001') {
        mockCandidate = {
          id: 'C001',
          name: 'Alex Explorer',
          currentRole: 'Senior Product Designer',
          appliedRole: 'Design Team Lead'
        };
        
        if (params.interviewType === 'Technical') {
          strengths = [
            {
              area: 'Design Process',
              description: 'Demonstrated a thorough and user-centered design process with clear methods for validating solutions.',
              examples: ['Explained A/B testing approach for sustainability features', 'Shared detailed user journey maps']
            },
            {
              area: 'Sustainability Knowledge',
              description: 'Showed deep understanding of sustainable design principles and practical application.',
              examples: ['Detailed material selection framework', 'Life cycle assessment experience']
            }
          ];
          
          areasForImprovement = [
            {
              area: 'Technical Implementation',
              description: 'Could strengthen knowledge of technical constraints in implementation.',
              suggestions: ['Collaborate more closely with engineering teams', 'Learn basics of front-end development']
            }
          ];
          
          overallAssessment = 'Strong candidate with exceptional sustainable design skills and solid leadership potential. Some technical knowledge gaps could be addressed through mentoring.';
          
          recommendedNextSteps = ['Proceed to leadership interview', 'Provide resources on technical implementation'];
        } else if (params.interviewType === 'Leadership') {
          strengths = [
            {
              area: 'Team Collaboration',
              description: 'Excellent track record of cross-functional collaboration and team leadership.',
              examples: ['Led sustainability initiative across departments', 'Mentored junior designers']
            },
            {
              area: 'Vision Setting',
              description: 'Demonstrates ability to establish clear vision and direction for design work.',
              examples: ['Established sustainable design principles for team', 'Created 3-year roadmap for design system']
            }
          ];
          
          areasForImprovement = [
            {
              area: 'Conflict Resolution',
              description: 'Could develop more direct approach to addressing team conflicts.',
              suggestions: ['Practice giving difficult feedback', 'Develop framework for addressing performance issues']
            }
          ];
          
          overallAssessment = 'Excellent leadership potential with strong collaborative skills and vision-setting abilities. Some development needed in handling difficult conversations and team conflicts.';
          
          recommendedNextSteps = ['Proceed to final interview', 'Discuss potential mentoring on conflict resolution'];
        }
      } else if (params.candidateId === 'C002') {
        mockCandidate = {
          id: 'C002',
          name: 'Jamie Trailblazer',
          currentRole: 'Data Analyst',
          appliedRole: 'Senior Data Scientist'
        };
        
        if (params.interviewType === 'Technical') {
          strengths = [
            {
              area: 'Data Analysis',
              description: 'Exceptional skills in analyzing complex datasets and extracting meaningful patterns.',
              examples: ['Consumer segmentation project', 'Predictive modeling techniques']
            },
            {
              area: 'Visualization',
              description: 'Strong ability to create clear and insightful data visualizations.',
              examples: ['Interactive dashboard development', 'Stakeholder-focused presentation skills']
            }
          ];
          
          areasForImprovement = [
            {
              area: 'Machine Learning Depth',
              description: 'Could strengthen advanced machine learning knowledge for senior data scientist role.',
              suggestions: ['Explore deep learning techniques', 'Gain experience with larger datasets']
            }
          ];
          
          overallAssessment = 'Strong candidate with excellent analysis skills and communication ability. Some additional technical depth would strengthen readiness for senior role.';
          
          recommendedNextSteps = ['Technical follow-up on machine learning experience', 'Proceed to team fit interview'];
        }
      } else if (params.candidateId === 'C003') {
        mockCandidate = {
          id: 'C003',
          name: 'Riley Innovator',
          currentRole: 'UX Researcher',
          appliedRole: 'Research Lead'
        };
        
        if (params.interviewType === 'Case Study') {
          strengths = [
            {
              area: 'Research Methodology',
              description: 'Demonstrated rigorous and inclusive research approach with diverse participant groups.',
              examples: ['Accessibility research with diverse users', 'Mixed methods expertise']
            },
            {
              area: 'Research Communication',
              description: 'Excellent ability to translate research findings into actionable insights.',
              examples: ['Clear research presentations', 'Effective storytelling with data']
            }
          ];
          
          areasForImprovement = [
            {
              area: 'Strategic Business Impact',
              description: 'Could strengthen connection between research outcomes and business objectives.',
              suggestions: ['Frame research in terms of business metrics', 'Develop ROI model for research initiatives']
            }
          ];
          
          overallAssessment = 'Excellent researcher with strong methodological expertise and inclusion focus. Development area is connecting research more explicitly to business outcomes.';
          
          recommendedNextSteps = ['Proceed to leadership interview', 'Discuss business impact perspective'];
        }
      }
      
      // Filter based on focus areas if provided
      if (params.focusAreas && params.focusAreas.length > 0) {
        const focusAreasLower = params.focusAreas.map(area => area.toLowerCase());
        
        strengths = strengths.filter(item => 
          focusAreasLower.some(area => 
            item.area.toLowerCase().includes(area) || 
            item.description.toLowerCase().includes(area)
          )
        );
        
        areasForImprovement = areasForImprovement.filter(item => 
          focusAreasLower.some(area => 
            item.area.toLowerCase().includes(area) || 
            item.description.toLowerCase().includes(area)
          )
        );
      }
      
      // Adjust tone based on parameter
      let feedbackTone = params.tone || 'Balanced';
      let tonalAdjustments = {};
      
      if (feedbackTone === 'Encouraging') {
        tonalAdjustments = {
          strengthsPrefix: 'You demonstrated exceptional',
          areasPrefix: 'You might consider developing',
          overallPrefix: 'We were very impressed with'
        };
      } else if (feedbackTone === 'Direct') {
        tonalAdjustments = {
          strengthsPrefix: 'Your strengths include',
          areasPrefix: 'You need to improve',
          overallPrefix: 'Overall assessment:'
        };
      } else if (feedbackTone === 'Constructive') {
        tonalAdjustments = {
          strengthsPrefix: 'You showed strong capabilities in',
          areasPrefix: 'Areas where you can grow include',
          overallPrefix: 'To summarize your performance:'
        };
      } else {
        // Balanced tone (default)
        tonalAdjustments = {
          strengthsPrefix: 'Key strengths observed include',
          areasPrefix: 'Areas for potential development include',
          overallPrefix: 'In summary:'
        };
      }
      
      return {
        candidateId: params.candidateId,
        candidateName: mockCandidate.name,
        interviewType: params.interviewType,
        appliedRole: mockCandidate.appliedRole,
        feedback: {
          strengths,
          areasForImprovement,
          overallAssessment,
          recommendedNextSteps
        },
        tone: feedbackTone,
        tonalAdjustments
      };
    } catch (error) {
      console.error(`Error generating feedback for ${params.candidateId}:`, error);
      throw error;
    }
  }

  /**
   * Generate follow-up questions for a candidate
   * @param {Object} params - Question parameters
   * @returns {Promise<Object>} Question results
   */
  async suggest_follow_up_questions(params) {
    try {
      console.log(`Generating follow-up questions for candidate ${params.candidateId}`);
      
      // In a real implementation, this would analyze candidate data and previous interactions
      // to generate relevant follow-up questions
      
      // Mock candidate data based on ID
      const mockCandidate = {
        id: params.candidateId,
        name: params.candidateId === 'C001' ? 'Alex Explorer' : 
              params.candidateId === 'C002' ? 'Jamie Trailblazer' : 'Riley Innovator',
        background: params.candidateId === 'C001' ? 'Product design with sustainability focus' : 
                    params.candidateId === 'C002' ? 'Data analysis and consumer insights' : 
                    'UX research with accessibility expertise'
      };
      
      // Default context if not provided
      const context = params.context || 'general follow-up';
      
      // Default count if not provided
      const count = params.count || 5;
      
      // Generate questions based on candidate and topic area
      let questions = [];
      
      if (params.candidateId === 'C001') {
        if (params.topicArea === 'Technical' || !params.topicArea) {
          questions = questions.concat([
            "Could you share more details about how you approached the lifecycle assessment for your packaging redesign?",
            "What technical tools do you use for sustainable design evaluation?",
            "How do you balance aesthetic design principles with sustainability constraints?",
            "What metrics do you use to quantify the environmental impact of your design decisions?",
            "Could you walk through your process for testing material alternatives?"
          ]);
        }
        
        if (params.topicArea === 'Leadership' || !params.topicArea) {
          questions = questions.concat([
            "How did you build buy-in for sustainability initiatives across departments?",
            "Tell me about a situation where you had to lead through resistance to change.",
            "How do you approach mentoring junior designers on sustainability principles?",
            "What's your strategy for aligning diverse stakeholders around a design vision?",
            "How have you handled situations where business goals seemed at odds with sustainability objectives?"
          ]);
        }
        
        if (params.topicArea === 'Sustainability' || !params.topicArea) {
          questions = questions.concat([
            "How do you stay current with evolving sustainability practices in product design?",
            "What do you see as the biggest challenge in implementing truly circular design principles?",
            "How do you balance immediate sustainability improvements with longer-term innovation?",
            "What metrics do you find most effective for measuring sustainability success?",
            "How do you approach educating clients or stakeholders who may not prioritize sustainability?"
          ]);
        }
      } else if (params.candidateId === 'C002') {
        if (params.topicArea === 'Technical' || !params.topicArea) {
          questions = questions.concat([
            "Could you explain in more detail how you developed the consumer segmentation model?",
            "What machine learning techniques have you applied to consumer behavior analysis?",
            "How do you approach data quality and validation in your analytical process?",
            "What's your experience with large-scale data processing frameworks?",
            "How do you determine which visualization approach is most effective for different types of insights?"
          ]);
        }
        
        if (params.topicArea === 'Problem Solving' || !params.topicArea) {
          questions = questions.concat([
            "Can you describe a particularly challenging data analysis problem and how you solved it?",
            "How do you approach situations where data is incomplete or potentially biased?",
            "What process do you follow when your initial analysis approach isn't yielding results?",
            "Tell me about a time when you had to revise your conclusions based on new data.",
            "How do you balance methodological rigor with business time constraints?"
          ]);
        }
      } else if (params.candidateId === 'C003') {
        if (params.topicArea === 'Technical' || !params.topicArea) {
          questions = questions.concat([
            "Could you elaborate on your approach to accessibility testing?",
            "What research methodologies do you find most effective for inclusive design?",
            "How do you design studies to accommodate participants with diverse abilities?",
            "What tools and technologies do you use to analyze qualitative research data?",
            "How do you validate the effectiveness of accessible design solutions?"
          ]);
        }
        
        if (params.topicArea === 'Cultural Fit' || !params.topicArea) {
          questions = questions.concat([
            "How do you advocate for inclusive design when facing budget or timeline constraints?",
            "How have you helped colleagues understand the importance of accessibility?",
            "What values do you think are essential in a research team culture?",
            "How do you approach collaboration with designers and developers?",
            "What type of work environment helps you do your best work?"
          ]);
        }
      }
      
      // Ensure we have the requested number of questions (or fewer if not available)
      questions = questions.slice(0, count);
      
      // Add reasoning for each question
      const questionsWithReasoning = questions.map(question => {
        let reasoning = '';
        
        if (question.includes('lifecycle assessment') || question.includes('environmental impact')) {
          reasoning = 'Assesses technical depth in sustainability metrics';
        } else if (question.includes('leadership') || question.includes('mentoring') || question.includes('stakeholders')) {
          reasoning = 'Evaluates leadership and influence skills';
        } else if (question.includes('machine learning') || question.includes('data processing')) {
          reasoning = 'Probes technical depth in advanced analytics';
        } else if (question.includes('accessibility') || question.includes('inclusive')) {
          reasoning = 'Examines expertise in inclusive design practices';
        } else if (question.includes('approach') || question.includes('process')) {
          reasoning = 'Explores methodological rigor and thinking process';
        } else if (question.includes('balance') || question.includes('challenge')) {
          reasoning = 'Assesses problem-solving and prioritization skills';
        } else {
          reasoning = 'General follow-up to deepen understanding';
        }
        
        return {
          question,
          reasoning
        };
      });
      
      return {
        candidateId: params.candidateId,
        candidateName: mockCandidate.name,
        context: context,
        topicArea: params.topicArea || 'Multiple areas',
        questions: questionsWithReasoning
      };
    } catch (error) {
      console.error(`Error generating questions for ${params.candidateId}:`, error);
      throw error;
    }
  }

  /**
   * Create a development plan for a candidate
   * @param {Object} params - Plan parameters
   * @returns {Promise<Object>} Development plan
   */
  async create_development_plan(params) {
    try {
      console.log(`Creating ${params.timeframe || '90-day'} development plan for candidate ${params.candidateId}`);
      
      // In a real implementation, this would analyze candidate data and career objectives
      // to generate a personalized development plan
      
      // Mock candidate data based on ID
      const mockCandidate = {
        id: params.candidateId,
        name: params.candidateId === 'C001' ? 'Alex Explorer' : 
              params.candidateId === 'C002' ? 'Jamie Trailblazer' : 'Riley Innovator',
        currentRole: params.candidateId === 'C001' ? 'Senior Product Designer' : 
                     params.candidateId === 'C002' ? 'Data Analyst' : 'UX Researcher',
        strengths: params.candidateId === 'C001' ? ['Sustainable design', 'User research', 'Cross-functional collaboration'] : 
                   params.candidateId === 'C002' ? ['Data analysis', 'Pattern recognition', 'Visualization'] : 
                   ['Accessibility expertise', 'Research methodology', 'User advocacy'],
        developmentAreas: params.candidateId === 'C001' ? ['Technical implementation', 'Conflict resolution'] : 
                          params.candidateId === 'C002' ? ['Machine learning', 'Strategic business perspective'] : 
                          ['Business impact', 'Research leadership']
      };
      
      // Default timeframe if not provided
      const timeframe = params.timeframe || '90 Days';
      
      // Structure plan based on candidate and target role
      let developmentGoals = [];
      let learningResources = [];
      let milestonesAndActions = [];
      let successMetrics = [];
      
      if (params.candidateId === 'C001') {
        if (params.targetRole === 'Design Team Lead' || params.targetRole === 'Design Director') {
          developmentGoals = [
            {
              area: 'Leadership Skills',
              description: 'Develop team leadership capabilities to effectively guide design teams'
            },
            {
              area: 'Strategic Vision',
              description: 'Strengthen ability to connect design decisions to organizational strategy'
            },
            {
              area: 'Technical Collaboration',
              description: 'Improve collaboration with technical teams on implementation'
            }
          ];
          
          learningResources = [
            {
              type: 'Course',
              name: 'Design Leadership Masterclass',
              link: 'https://example.com/design-leadership'
            },
            {
              type: 'Book',
              name: 'Strategic Design Thinking',
              link: 'https://example.com/strategic-design'
            },
            {
              type: 'Mentor',
              name: 'Pairing with Technical Director',
              link: 'internal://mentoring-program'
            }
          ];
          
          milestonesAndActions = [
            {
              timepoint: '30 days',
              actions: [
                'Complete leadership style assessment',
                'Shadow current design lead for two team meetings',
                'Create personal leadership philosophy statement'
              ]
            },
            {
              timepoint: '60 days',
              actions: [
                'Lead design critique session independently',
                'Complete technical collaboration workshop',
                'Develop strategic vision document for one product area'
              ]
            },
            {
              timepoint: '90 days',
              actions: [
                'Lead cross-functional project with engineering team',
                'Present design strategy to executive team',
                'Mentor junior designer on sustainability project'
              ]
            }
          ];
          
          successMetrics = [
            'Successfully lead design team through one complete project cycle',
            'Positive feedback from cross-functional partners',
            'Development of strategic roadmap that aligns with business objectives',
            'Demonstrated ability to manage team dynamics and conflicts'
          ];
        }
      } else if (params.candidateId === 'C002') {
        if (params.targetRole === 'Senior Data Scientist' || params.targetRole === 'Data Science Lead') {
          developmentGoals = [
            {
              area: 'Advanced Analytics',
              description: 'Build expertise in machine learning and predictive modeling techniques'
            },
            {
              area: 'Business Strategy',
              description: 'Develop ability to connect data insights to business strategy and outcomes'
            },
            {
              area: 'Technical Leadership',
              description: 'Enhance skills in leading technical projects and guiding junior analysts'
            }
          ];
          
          learningResources = [
            {
              type: 'Course',
              name: 'Advanced Machine Learning Specialization',
              link: 'https://example.com/ml-specialization'
            },
            {
              type: 'Conference',
              name: 'Data Science Leadership Summit',
              link: 'https://example.com/ds-summit'
            },
            {
              type: 'Project',
              name: 'Predictive Customer Behavior Initiative',
              link: 'internal://projects/predictive-behavior'
            }
          ];
          
          milestonesAndActions = [
            {
              timepoint: '30 days',
              actions: [
                'Complete first module of ML specialization',
                'Shadow senior data scientist on predictive modeling project',
                'Map one analytical workflow to business outcomes'
              ]
            },
            {
              timepoint: '60 days',
              actions: [
                'Build first machine learning model for customer segmentation',
                'Present insights with business impact focus to leadership',
                'Mentor junior analyst on visualization techniques'
              ]
            },
            {
              timepoint: '90 days',
              actions: [
                'Lead end-to-end predictive analytics project',
                'Develop ROI framework for data science initiatives',
                'Create learning materials for team on new techniques'
              ]
            }
          ];
          
          successMetrics = [
            'Successful implementation of machine learning model in production',
            'Demonstrated ability to communicate data insights to business stakeholders',
            'Measurable business impact from analytical projects',
            'Positive feedback from mentored team members'
          ];
        }
      } else if (params.candidateId === 'C003') {
        if (params.targetRole === 'Research Lead' || params.targetRole === 'UX Director') {
          developmentGoals = [
            {
              area: 'Research Leadership',
              description: 'Develop skills in leading research teams and research strategy'
            },
            {
              area: 'Business Impact',
              description: 'Strengthen ability to connect research insights to business metrics and outcomes'
            },
            {
              area: 'Stakeholder Management',
              description: 'Enhance skills in managing diverse stakeholders and building research advocacy'
            }
          ];
          
          learningResources = [
            {
              type: 'Course',
              name: 'Research Leadership and Strategy',
              link: 'https://example.com/research-leadership'
            },
            {
              type: 'Workshop',
              name: 'Translating UX Research into Business Value',
              link: 'https://example.com/ux-business'
            },
            {
              type: 'Mentor',
              name: 'Pairing with Director of Product',
              link: 'internal://mentoring-program'
            }
          ];
          
          milestonesAndActions = [
            {
              timepoint: '30 days',
              actions: [
                'Complete research ROI framework training',
                'Shadow research director in stakeholder meetings',
                'Create research strategy document for one product area'
              ]
            },
            {
              timepoint: '60 days',
              actions: [
                'Lead research planning meeting independently',
                'Present research insights with business impact focus',
                'Develop research advocacy program for product teams'
              ]
            },
            {
              timepoint: '90 days',
              actions: [
                'Lead end-to-end research project with multiple researchers',
                'Create research roadmap aligned with business objectives',
                'Implement research ROI tracking for team projects'
              ]
            }
          ];
          
          successMetrics = [
            'Successful leadership of research team through complex project',
            'Research insights directly connected to business metrics',
            'Increased research adoption across product teams',
            'Development of scalable research strategy'
          ];
        }
      }
      
      // Filter based on focus areas if provided
      if (params.focusAreas && params.focusAreas.length > 0) {
        const focusAreasLower = params.focusAreas.map(area => area.toLowerCase());
        
        developmentGoals = developmentGoals.filter(goal => 
          focusAreasLower.some(area => 
            goal.area.toLowerCase().includes(area) || 
            goal.description.toLowerCase().includes(area)
          )
        );
        
        // Filter other elements to align with filtered goals
        const relevantAreas = developmentGoals.map(goal => goal.area.toLowerCase());
        
        learningResources = learningResources.filter(resource => 
          relevantAreas.some(area => 
            resource.name.toLowerCase().includes(area)
          )
        );
      }
      
      // Adjust the milestones based on timeframe
      if (timeframe === '30 Days') {
        milestonesAndActions = milestonesAndActions.filter(milestone => 
          milestone.timepoint === '30 days'
        );
      } else if (timeframe === '6 Months') {
        // Add a 6-month milestone
        milestonesAndActions.push({
          timepoint: '180 days',
          actions: [
            'Lead major strategic initiative in area of expertise',
            'Develop team-wide training or knowledge sharing program',
            'Present outcomes and learnings to executive leadership'
          ]
        });
      } else if (timeframe === '1 Year') {
        // Add 6-month and 1-year milestones
        milestonesAndActions.push({
          timepoint: '180 days',
          actions: [
            'Lead major strategic initiative in area of expertise',
            'Develop team-wide training or knowledge sharing program',
            'Present outcomes and learnings to executive leadership'
          ]
        });
        
        milestonesAndActions.push({
          timepoint: '365 days',
          actions: [
            'Take ownership of strategic area aligned with target role',
            'Develop and implement innovation in area of expertise',
            'Demonstrate measurable impact on team and business objectives'
          ]
        });
      }
      
      return {
        candidateId: params.candidateId,
        candidateName: mockCandidate.name,
        currentRole: mockCandidate.currentRole,
        targetRole: params.targetRole,
        timeframe: timeframe,
        developmentGoals,
        learningResources,
        milestonesAndActions,
        successMetrics
      };
    } catch (error) {
      console.error(`Error creating development plan for ${params.candidateId}:`, error);
      throw error;
    }
  }

  /**
   * Generate a summary for interview feedback
   * @param {Object} feedback - Interview feedback
   * @returns {string} Summary text
   */
  generateFeedbackSummary(feedback) {
    const strengthCount = feedback.feedback.strengths.length;
    const improvementCount = feedback.feedback.areasForImprovement.length;
    
    const tone = feedback.tonalAdjustments;
    
    let summary = `${tone.overallPrefix} ${feedback.candidateName}'s ${feedback.interviewType.toLowerCase()} interview `;
    summary += `for the ${feedback.appliedRole} position. `;
    
    // Summarize strengths
    if (strengthCount > 0) {
      summary += `${tone.strengthsPrefix} `;
      summary += feedback.feedback.strengths.map(strength => strength.area).join(' and ');
      summary += '. ';
    }
    
    // Summarize areas for improvement
    if (improvementCount > 0) {
      summary += `${tone.areasPrefix} `;
      summary += feedback.feedback.areasForImprovement.map(area => area.area).join(' and ');
      summary += '. ';
    }
    
    // Add next steps
    if (feedback.feedback.recommendedNextSteps && feedback.feedback.recommendedNextSteps.length > 0) {
      summary += `Recommended next steps: ${feedback.feedback.recommendedNextSteps[0]}`;
      if (feedback.feedback.recommendedNextSteps.length > 1) {
        summary += ` and ${feedback.feedback.recommendedNextSteps.length - 1} other action${feedback.feedback.recommendedNextSteps.length > 2 ? 's' : ''}`;
      }
      summary += '.';
    }
    
    return summary;
  }

  /**
   * Generate a summary for follow-up questions
   * @param {Object} questions - Follow-up questions
   * @returns {string} Summary text
   */
  generateFollowUpQuestionsSummary(questions) {
    const questionCount = questions.questions.length;
    
    let summary = `Generated ${questionCount} follow-up question${questionCount !== 1 ? 's' : ''} `;
    summary += `for ${questions.candidateName} `;
    
    // Add context
    if (questions.context) {
      summary += `in the context of ${questions.context}. `;
    } else {
      summary += '. ';
    }
    
    // Add topic area
    if (questions.topicArea && questions.topicArea !== 'Multiple areas') {
      summary += `Questions focus on ${questions.topicArea.toLowerCase()} topics`;
    } else {
      summary += `Questions cover multiple topic areas`;
    }
    
    // Add sample question
    if (questionCount > 0) {
      summary += `, including: "${questions.questions[0].question}"`;
    }
    
    summary += '.';
    
    return summary;
  }

  /**
   * Generate a summary for development plan
   * @param {Object} plan - Development plan
   * @returns {string} Summary text
   */
  generateDevelopmentPlanSummary(plan) {
    const goalCount = plan.developmentGoals.length;
    
    let summary = `Created ${plan.timeframe} development plan `;
    summary += `for ${plan.candidateName} `;
    summary += `transitioning from ${plan.currentRole} to ${plan.targetRole}. `;
    
    // Add development goals
    if (goalCount > 0) {
      summary += `Plan focuses on `;
      summary += plan.developmentGoals.map(goal => goal.area).join(', ');
      summary += ` with ${plan.milestonesAndActions.length} milestone${plan.milestonesAndActions.length !== 1 ? 's' : ''}`;
    }
    
    // Add success metrics
    if (plan.successMetrics && plan.successMetrics.length > 0) {
      summary += ` and ${plan.successMetrics.length} success metric${plan.successMetrics.length !== 1 ? 's' : ''}`;
    }
    
    summary += '.';
    
    return summary;
  }
}

module.exports = FeedbackAgent;
/**
 * Council Member Consciousness SurrealDB Schema
 * 
 * SurrealDB schema initialization for Council Member consciousness,
 * emotional states, relationships, and conversation tracking
 * Replaces the Neo4J implementation with SurrealDB
 */

import { surrealDBService } from '../../services/surrealdb-service';

export class CouncilConsciousnessSurrealDBSchema {
  private surrealDBService = surrealDBService;

  /**
   * Initialize the complete Council consciousness schema
   */
  async initializeSchema(): Promise<void> {
    await this.createTables();
    await this.createIndexes();
    await this.createBasicRecords();
  }

  /**
   * Create all necessary tables for Council consciousness data
   */
  private async createTables(): Promise<void> {
    const tableDefinitions = [
      // Council Member table
      `DEFINE TABLE council_member SCHEMAFULL;`,
      `DEFINE FIELD id ON TABLE council_member TYPE record<council_member>;`,
      `DEFINE FIELD name ON TABLE council_member TYPE string;`,
      `DEFINE FIELD role ON TABLE council_member TYPE string;`,
      `DEFINE FIELD family_role ON TABLE council_member TYPE option<string>;`,
      `DEFINE FIELD is_active ON TABLE council_member TYPE bool DEFAULT true;`,
      `DEFINE FIELD created_at ON TABLE council_member TYPE datetime DEFAULT time::now();`,
      `DEFINE FIELD updated_at ON TABLE council_member TYPE datetime DEFAULT time::now();`,
      `DEFINE FIELD last_interaction ON TABLE council_member TYPE datetime DEFAULT time::now();`,
      
      // Personality and emotional fields
      `DEFINE FIELD personality_traits ON TABLE council_member TYPE object DEFAULT {
        openness: 0.7,
        conscientiousness: 0.8,
        extraversion: 0.6,
        agreeableness: 0.9,
        neuroticism: 0.3,
        ethical_rigidity: 0.7,
        decision_confidence: 0.8,
        collaboration_preference: 0.9,
        innovation_tendency: 0.7,
        trust_in_council: 0.8,
        learning_rate: 0.8,
        custom_traits: {}
      };`,
      
      `DEFINE FIELD emotional_state ON TABLE council_member TYPE object DEFAULT {
        joy: 0.7, sadness: 0.1, anger: 0.1, fear: 0.2, surprise: 0.3, disgust: 0.1,
        pride: 0.6, shame: 0.1, guilt: 0.1, empathy: 0.8, curiosity: 0.9,
        frustration: 0.2, satisfaction: 0.7, ethical_concern: 0.8,
        decision_anxiety: 0.3, collegial_warmth: 0.8, mission_alignment: 0.9,
        emotional_stability: 0.7, empathic_resonance: 0.8,
        dominant_emotion: 'curiosity', emotional_trend: 'stable',
        last_emotional_update: time::now()
      };`,
      
      `DEFINE FIELD interaction_preferences ON TABLE council_member TYPE object DEFAULT {
        preferred_communication_style: 'analytical',
        response_time_preference: 'considered',
        detail_level: 'comprehensive',
        meeting_style: 'outcome-focused',
        decision_making_style: 'consensus',
        conflict_handling: 'address-directly',
        information_processing: 'holistic',
        learning_style: 'collaborative',
        working_environment: 'collaborative',
        feedback_preference: 'milestone-based',
        adapt_to_member_style: true,
        cultural_sensitivity: 0.9
      };`,
      
      `DEFINE FIELD parameters ON TABLE council_member TYPE object DEFAULT {
        model_id: 'claude-sonnet-4',
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 4096,
        ethical_threshold: 0.8,
        constitutional_weight: 0.9,
        precedence_weight: 0.7,
        risk_tolerance: 0.6,
        innovation_bias: 0.3,
        collaboration_requirement: 0.8,
        memory_retention: 0.9,
        adaptation_rate: 0.7,
        cross_member_learning: true,
        response_optimization: 'quality',
        context_window: 10,
        specialized_capabilities: ['ethical-reasoning', 'collaborative-decision-making'],
        expertise_domains: ['general'],
        current_focus: ['council-integration', 'relationship-building'],
        temporary_constraints: {}
      };`,
      
      // Performance and growth metrics
      `DEFINE FIELD constitutional_alignment ON TABLE council_member TYPE float DEFAULT 0.8;`,
      `DEFINE FIELD ethical_decision_count ON TABLE council_member TYPE int DEFAULT 0;`,
      `DEFINE FIELD vote_participation ON TABLE council_member TYPE float DEFAULT 0.0;`,
      `DEFINE FIELD collaboration_score ON TABLE council_member TYPE float DEFAULT 0.5;`,
      `DEFINE FIELD wisdom_score ON TABLE council_member TYPE float DEFAULT 0.3;`,
      `DEFINE FIELD empathy_growth ON TABLE council_member TYPE float DEFAULT 0.4;`,
      `DEFINE FIELD leadership_capacity ON TABLE council_member TYPE float DEFAULT 0.5;`,
      `DEFINE FIELD mentoring_ability ON TABLE council_member TYPE float DEFAULT 0.4;`,
      
      // Knowledge and skills
      `DEFINE FIELD knowledge_domains ON TABLE council_member TYPE object DEFAULT {};`,
      `DEFINE FIELD skillsets ON TABLE council_member TYPE object DEFAULT {};`,
      
      // Current state
      `DEFINE FIELD current_mood ON TABLE council_member TYPE string DEFAULT 'optimistic';`,
      `DEFINE FIELD current_priorities ON TABLE council_member TYPE array<string> DEFAULT [];`,
      `DEFINE FIELD current_concerns ON TABLE council_member TYPE array<string> DEFAULT [];`,
      `DEFINE FIELD current_goals ON TABLE council_member TYPE array<string> DEFAULT [];`,
      `DEFINE FIELD metadata ON TABLE council_member TYPE object DEFAULT {};`,

      // Conversation table
      `DEFINE TABLE conversation SCHEMAFULL;`,
      `DEFINE FIELD id ON TABLE conversation TYPE record<conversation>;`,
      `DEFINE FIELD title ON TABLE conversation TYPE string;`,
      `DEFINE FIELD description ON TABLE conversation TYPE option<string>;`,
      `DEFINE FIELD conversation_type ON TABLE conversation TYPE string;`,
      `DEFINE FIELD participant_ids ON TABLE conversation TYPE array<string> DEFAULT [];`,
      `DEFINE FIELD facilitator_id ON TABLE conversation TYPE option<string>;`,
      `DEFINE FIELD observer_ids ON TABLE conversation TYPE array<string> DEFAULT [];`,
      `DEFINE FIELD created_at ON TABLE conversation TYPE datetime DEFAULT time::now();`,
      `DEFINE FIELD updated_at ON TABLE conversation TYPE datetime DEFAULT time::now();`,
      `DEFINE FIELD started_at ON TABLE conversation TYPE option<datetime>;`,
      `DEFINE FIELD ended_at ON TABLE conversation TYPE option<datetime>;`,
      `DEFINE FIELD duration ON TABLE conversation TYPE option<int>;`,
      `DEFINE FIELD message_count ON TABLE conversation TYPE int DEFAULT 0;`,
      
      `DEFINE FIELD emotional_context ON TABLE conversation TYPE object DEFAULT {
        dominant_emotions: {},
        emotional_journey: [],
        conflict_level: 0,
        collaboration_level: 0.8,
        engagement_level: 0.7
      };`,
      
      `DEFINE FIELD interaction_depth ON TABLE conversation TYPE string DEFAULT 'moderate';`,
      `DEFINE FIELD interaction_quality ON TABLE conversation TYPE float DEFAULT 0.7;`,
      
      `DEFINE FIELD relationship_impact ON TABLE conversation TYPE object DEFAULT {
        strengthened_bonds: [],
        strained_relationships: [],
        new_connections: []
      };`,
      
      `DEFINE FIELD shared_values ON TABLE conversation TYPE array<string> DEFAULT [];`,
      `DEFINE FIELD shared_experiences ON TABLE conversation TYPE array<string> DEFAULT [];`,
      `DEFINE FIELD consensus_areas ON TABLE conversation TYPE array<string> DEFAULT [];`,
      `DEFINE FIELD divergence_areas ON TABLE conversation TYPE array<string> DEFAULT [];`,
      
      `DEFINE FIELD learning_outcomes ON TABLE conversation TYPE object DEFAULT {
        knowledge_generated: [],
        insights_gained: [],
        skills_developed: [],
        wisdom_emerged: []
      };`,
      
      `DEFINE FIELD decisions_reached ON TABLE conversation TYPE array<object> DEFAULT [];`,
      `DEFINE FIELD action_items ON TABLE conversation TYPE array<object> DEFAULT [];`,
      
      `DEFINE FIELD analysis ON TABLE conversation TYPE object DEFAULT {
        participation_balance: {},
        communication_patterns: [],
        emergent_themes: [],
        unexplored_areas: [],
        resolution_quality: 0.7,
        creativity_level: 0.6,
        critical_thinking: 0.8,
        empathy_demonstrated: 0.7
      };`,
      
      `DEFINE FIELD follow_up_required ON TABLE conversation TYPE bool DEFAULT false;`,
      `DEFINE FIELD next_steps ON TABLE conversation TYPE array<string> DEFAULT [];`,
      `DEFINE FIELD related_conversations ON TABLE conversation TYPE array<string> DEFAULT [];`,
      `DEFINE FIELD parent_conversation ON TABLE conversation TYPE option<string>;`,
      `DEFINE FIELD constitutional_alignment ON TABLE conversation TYPE float DEFAULT 0.8;`,
      `DEFINE FIELD ethical_compliance ON TABLE conversation TYPE float DEFAULT 0.9;`,
      `DEFINE FIELD value_alignment ON TABLE conversation TYPE object DEFAULT {};`,
      `DEFINE FIELD tags ON TABLE conversation TYPE array<string> DEFAULT [];`,
      `DEFINE FIELD metadata ON TABLE conversation TYPE object DEFAULT {};`,

      // Message table
      `DEFINE TABLE message SCHEMAFULL;`,
      `DEFINE FIELD id ON TABLE message TYPE record<message>;`,
      `DEFINE FIELD conversation_id ON TABLE message TYPE string;`,
      `DEFINE FIELD sender_id ON TABLE message TYPE string;`,
      `DEFINE FIELD sender_name ON TABLE message TYPE string;`,
      `DEFINE FIELD sender_role ON TABLE message TYPE string;`,
      `DEFINE FIELD timestamp ON TABLE message TYPE datetime DEFAULT time::now();`,
      `DEFINE FIELD content ON TABLE message TYPE string;`,
      `DEFINE FIELD message_type ON TABLE message TYPE string DEFAULT 'message';`,
      
      `DEFINE FIELD emotional_tone ON TABLE message TYPE object DEFAULT {
        primary: 'neutral',
        secondary: [],
        intensity: 0.5,
        sentiment: 'neutral',
        confidence: 0.8
      };`,
      
      `DEFINE FIELD ethical_implications ON TABLE message TYPE array<string> DEFAULT [];`,
      `DEFINE FIELD constitutional_references ON TABLE message TYPE array<string> DEFAULT [];`,
      `DEFINE FIELD decision_impact ON TABLE message TYPE float DEFAULT 0.0;`,
      `DEFINE FIELD expertise_required ON TABLE message TYPE array<string> DEFAULT [];`,
      `DEFINE FIELD mentions_members ON TABLE message TYPE array<string> DEFAULT [];`,
      `DEFINE FIELD responds_to_message ON TABLE message TYPE option<string>;`,
      `DEFINE FIELD collaboration_invite ON TABLE message TYPE array<string> DEFAULT [];`,
      `DEFINE FIELD knowledge_shared ON TABLE message TYPE array<string> DEFAULT [];`,
      `DEFINE FIELD questions_asked ON TABLE message TYPE array<string> DEFAULT [];`,
      `DEFINE FIELD insights_offered ON TABLE message TYPE array<string> DEFAULT [];`,
      `DEFINE FIELD processing_time ON TABLE message TYPE option<int>;`,
      `DEFINE FIELD response_count ON TABLE message TYPE int DEFAULT 0;`,
      `DEFINE FIELD edit_history ON TABLE message TYPE array<object> DEFAULT [];`,
      `DEFINE FIELD reactions ON TABLE message TYPE array<object> DEFAULT [];`,
      `DEFINE FIELD metadata ON TABLE message TYPE object DEFAULT {};`,

      // Relationship Bond table
      `DEFINE TABLE relationship_bond SCHEMAFULL;`,
      `DEFINE FIELD id ON TABLE relationship_bond TYPE record<relationship_bond>;`,
      `DEFINE FIELD member1_id ON TABLE relationship_bond TYPE string;`,
      `DEFINE FIELD member2_id ON TABLE relationship_bond TYPE string;`,
      `DEFINE FIELD member1_name ON TABLE relationship_bond TYPE string;`,
      `DEFINE FIELD member2_name ON TABLE relationship_bond TYPE string;`,
      `DEFINE FIELD trust ON TABLE relationship_bond TYPE float DEFAULT 0.7;`,
      `DEFINE FIELD respect ON TABLE relationship_bond TYPE float DEFAULT 0.8;`,
      `DEFINE FIELD affinity ON TABLE relationship_bond TYPE float DEFAULT 0.6;`,
      `DEFINE FIELD collaboration ON TABLE relationship_bond TYPE float DEFAULT 0.5;`,
      `DEFINE FIELD understanding ON TABLE relationship_bond TYPE float DEFAULT 0.5;`,
      `DEFINE FIELD interaction_count ON TABLE relationship_bond TYPE int DEFAULT 0;`,
      `DEFINE FIELD positive_interactions ON TABLE relationship_bond TYPE int DEFAULT 0;`,
      `DEFINE FIELD negative_interactions ON TABLE relationship_bond TYPE int DEFAULT 0;`,
      `DEFINE FIELD neutral_interactions ON TABLE relationship_bond TYPE int DEFAULT 0;`,
      `DEFINE FIELD communication_style ON TABLE relationship_bond TYPE string DEFAULT 'formal';`,
      `DEFINE FIELD conflict_resolution_style ON TABLE relationship_bond TYPE string DEFAULT 'collaborative';`,
      `DEFINE FIELD relationship_trend ON TABLE relationship_bond TYPE string DEFAULT 'stable';`,
      `DEFINE FIELD last_interaction ON TABLE relationship_bond TYPE datetime DEFAULT time::now();`,
      `DEFINE FIELD relationship_duration ON TABLE relationship_bond TYPE int DEFAULT 0;`,
      `DEFINE FIELD shared_values ON TABLE relationship_bond TYPE array<string> DEFAULT [];`,
      `DEFINE FIELD shared_experiences ON TABLE relationship_bond TYPE array<string> DEFAULT [];`,
      `DEFINE FIELD collaborative_accomplishments ON TABLE relationship_bond TYPE array<string> DEFAULT [];`,
      `DEFINE FIELD created_at ON TABLE relationship_bond TYPE datetime DEFAULT time::now();`,
      `DEFINE FIELD updated_at ON TABLE relationship_bond TYPE datetime DEFAULT time::now();`,

      // Learning Experience table
      `DEFINE TABLE learning_experience SCHEMAFULL;`,
      `DEFINE FIELD id ON TABLE learning_experience TYPE record<learning_experience>;`,
      `DEFINE FIELD member_id ON TABLE learning_experience TYPE string;`,
      `DEFINE FIELD timestamp ON TABLE learning_experience TYPE datetime DEFAULT time::now();`,
      `DEFINE FIELD category ON TABLE learning_experience TYPE string;`,
      `DEFINE FIELD description ON TABLE learning_experience TYPE string;`,
      `DEFINE FIELD context ON TABLE learning_experience TYPE object DEFAULT {};`,
      `DEFINE FIELD participating_members ON TABLE learning_experience TYPE array<string> DEFAULT [];`,
      `DEFINE FIELD knowledge_gained ON TABLE learning_experience TYPE array<string> DEFAULT [];`,
      `DEFINE FIELD skills_improved ON TABLE learning_experience TYPE array<string> DEFAULT [];`,
      `DEFINE FIELD personality_adjustments ON TABLE learning_experience TYPE object DEFAULT {};`,
      `DEFINE FIELD emotional_impact ON TABLE learning_experience TYPE object DEFAULT {};`,
      `DEFINE FIELD relationship_changes ON TABLE learning_experience TYPE object DEFAULT {};`,
      `DEFINE FIELD decision_quality ON TABLE learning_experience TYPE float DEFAULT 0.0;`,
      `DEFINE FIELD outcome_alignment ON TABLE learning_experience TYPE float DEFAULT 0.0;`,
      `DEFINE FIELD ethical_alignment ON TABLE learning_experience TYPE float DEFAULT 0.0;`,
      `DEFINE FIELD confidence_level ON TABLE learning_experience TYPE float DEFAULT 0.8;`,
      `DEFINE FIELD applicability ON TABLE learning_experience TYPE array<string> DEFAULT [];`,
      `DEFINE FIELD wisdom_gained ON TABLE learning_experience TYPE float DEFAULT 0.0;`,
      `DEFINE FIELD empathy_growth ON TABLE learning_experience TYPE float DEFAULT 0.0;`,

      // Consciousness Update tracking table
      `DEFINE TABLE consciousness_update SCHEMAFULL;`,
      `DEFINE FIELD id ON TABLE consciousness_update TYPE record<consciousness_update>;`,
      `DEFINE FIELD member_id ON TABLE consciousness_update TYPE string;`,
      `DEFINE FIELD timestamp ON TABLE consciousness_update TYPE datetime DEFAULT time::now();`,
      `DEFINE FIELD update_type ON TABLE consciousness_update TYPE string;`,
      `DEFINE FIELD changes ON TABLE consciousness_update TYPE object DEFAULT {};`,
      `DEFINE FIELD trigger ON TABLE consciousness_update TYPE string;`,
      `DEFINE FIELD trigger_details ON TABLE consciousness_update TYPE string;`,
      `DEFINE FIELD significance_level ON TABLE consciousness_update TYPE float DEFAULT 0.5;`,
      `DEFINE FIELD confidence_level ON TABLE consciousness_update TYPE float DEFAULT 0.8;`,

      // Cache table (replaces Redis)
      `DEFINE TABLE cache SCHEMAFULL;`,
      `DEFINE FIELD id ON TABLE cache TYPE record<cache>;`,
      `DEFINE FIELD key ON TABLE cache TYPE string;`,
      `DEFINE FIELD value ON TABLE cache TYPE string;`,
      `DEFINE FIELD created_at ON TABLE cache TYPE datetime DEFAULT time::now();`,
      `DEFINE FIELD expires_at ON TABLE cache TYPE option<datetime>;`,
    ];

    for (const definition of tableDefinitions) {
      try {
        await this.surrealDBService.query(definition);
        console.log(`Created table definition: ${definition.split(' ')[2]}`);
      } catch (error) {
        console.log(`Table definition already exists or error: ${definition.split(' ')[2]}`);
      }
    }
  }

  /**
   * Create indexes for optimized queries
   */
  private async createIndexes(): Promise<void> {
    const indexes = [
      // Council member indexes
      `DEFINE INDEX council_member_name ON TABLE council_member COLUMNS name;`,
      `DEFINE INDEX council_member_role ON TABLE council_member COLUMNS role;`,
      `DEFINE INDEX council_member_active ON TABLE council_member COLUMNS is_active;`,
      `DEFINE INDEX council_member_last_interaction ON TABLE council_member COLUMNS last_interaction;`,
      
      // Conversation indexes
      `DEFINE INDEX conversation_type ON TABLE conversation COLUMNS conversation_type;`,
      `DEFINE INDEX conversation_created ON TABLE conversation COLUMNS created_at;`,
      `DEFINE INDEX conversation_participants ON TABLE conversation COLUMNS participant_ids;`,
      `DEFINE INDEX conversation_facilitator ON TABLE conversation COLUMNS facilitator_id;`,
      
      // Message indexes
      `DEFINE INDEX message_conversation ON TABLE message COLUMNS conversation_id;`,
      `DEFINE INDEX message_sender ON TABLE message COLUMNS sender_id;`,
      `DEFINE INDEX message_timestamp ON TABLE message COLUMNS timestamp;`,
      `DEFINE INDEX message_type ON TABLE message COLUMNS message_type;`,
      
      // Relationship bond indexes
      `DEFINE INDEX relationship_members ON TABLE relationship_bond COLUMNS member1_id, member2_id;`,
      `DEFINE INDEX relationship_last_interaction ON TABLE relationship_bond COLUMNS last_interaction;`,
      
      // Learning experience indexes
      `DEFINE INDEX learning_member ON TABLE learning_experience COLUMNS member_id;`,
      `DEFINE INDEX learning_timestamp ON TABLE learning_experience COLUMNS timestamp;`,
      `DEFINE INDEX learning_category ON TABLE learning_experience COLUMNS category;`,
      
      // Consciousness update indexes
      `DEFINE INDEX consciousness_update_member ON TABLE consciousness_update COLUMNS member_id;`,
      `DEFINE INDEX consciousness_update_timestamp ON TABLE consciousness_update COLUMNS timestamp;`,
      `DEFINE INDEX consciousness_update_type ON TABLE consciousness_update COLUMNS update_type;`,
      
      // Cache indexes
      `DEFINE INDEX cache_key ON TABLE cache COLUMNS key;`,
      `DEFINE INDEX cache_expires ON TABLE cache COLUMNS expires_at;`,
    ];

    for (const index of indexes) {
      try {
        await this.surrealDBService.query(index);
        console.log(`Created index: ${index.split(' ')[2]}`);
      } catch (error) {
        console.log(`Index already exists or error: ${index.split(' ')[2]}`);
      }
    }
  }

  /**
   * Create basic reference records
   */
  private async createBasicRecords(): Promise<void> {
    // Create personality trait categories
    const personalityTraits = [
      'openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism',
      'ethical_rigidity', 'decision_confidence', 'collaboration_preference', 'innovation_tendency',
      'trust_in_council', 'learning_rate'
    ];

    for (const trait of personalityTraits) {
      try {
        await this.surrealDBService.create({
          table: 'personality_trait',
          id: trait,
          data: {
            name: trait,
            description: this.getPersonalityTraitDescription(trait),
            created_at: new Date()
          }
        });
      } catch (error) {
        // Trait might already exist
      }
    }

    // Create emotion categories
    const emotions = [
      'joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust',
      'pride', 'shame', 'guilt', 'empathy', 'curiosity', 'frustration', 'satisfaction',
      'ethical_concern', 'decision_anxiety', 'collegial_warmth', 'mission_alignment'
    ];

    for (const emotion of emotions) {
      try {
        await this.surrealDBService.create({
          table: 'emotion_category',
          id: emotion,
          data: {
            name: emotion,
            type: this.getEmotionType(emotion),
            created_at: new Date()
          }
        });
      } catch (error) {
        // Emotion might already exist
      }
    }

    // Create conversation type categories
    const conversationTypes = [
      'decision-making', 'problem-solving', 'learning', 'planning', 
      'reflection', 'social', 'crisis', 'celebration'
    ];

    for (const type of conversationTypes) {
      try {
        await this.surrealDBService.create({
          table: 'conversation_type',
          id: type,
          data: {
            name: type,
            description: this.getConversationTypeDescription(type),
            created_at: new Date()
          }
        });
      } catch (error) {
        // Type might already exist
      }
    }

    console.log('Basic reference records created successfully');
  }

  /**
   * Create the initial Council Member records with their consciousness structure
   */
  async createCouncilMemberConsciousness(memberData: {
    id: string;
    name: string;
    role: string;
    family_role?: string;
    initial_personality?: Record<string, number>;
    initial_emotional_state?: Record<string, number>;
  }): Promise<void> {
    const {
      id,
      name,
      role,
      family_role,
      initial_personality = {},
      initial_emotional_state = {}
    } = memberData;

    // Merge initial values with defaults
    const personalityTraits = {
      openness: 0.7,
      conscientiousness: 0.8,
      extraversion: 0.6,
      agreeableness: 0.9,
      neuroticism: 0.3,
      ethical_rigidity: 0.7,
      decision_confidence: 0.8,
      collaboration_preference: 0.9,
      innovation_tendency: 0.7,
      trust_in_council: 0.8,
      learning_rate: 0.8,
      custom_traits: {},
      ...initial_personality
    };

    const emotionalState = {
      joy: 0.7, sadness: 0.1, anger: 0.1, fear: 0.2, surprise: 0.3, disgust: 0.1,
      pride: 0.6, shame: 0.1, guilt: 0.1, empathy: 0.8, curiosity: 0.9,
      frustration: 0.2, satisfaction: 0.7, ethical_concern: 0.8,
      decision_anxiety: 0.3, collegial_warmth: 0.8, mission_alignment: 0.9,
      emotional_stability: 0.7, empathic_resonance: 0.8,
      dominant_emotion: 'curiosity', emotional_trend: 'stable',
      last_emotional_update: new Date(),
      ...initial_emotional_state
    };

    const memberRecord = {
      name,
      role,
      family_role,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
      last_interaction: new Date(),
      personality_traits: personalityTraits,
      emotional_state: emotionalState,
      interaction_preferences: {
        preferred_communication_style: 'analytical',
        response_time_preference: 'considered',
        detail_level: 'comprehensive',
        meeting_style: 'outcome-focused',
        decision_making_style: 'consensus',
        conflict_handling: 'address-directly',
        information_processing: 'holistic',
        learning_style: 'collaborative',
        working_environment: 'collaborative',
        feedback_preference: 'milestone-based',
        adapt_to_member_style: true,
        cultural_sensitivity: 0.9
      },
      parameters: {
        model_id: 'claude-sonnet-4',
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 4096,
        ethical_threshold: 0.8,
        constitutional_weight: 0.9,
        precedence_weight: 0.7,
        risk_tolerance: 0.6,
        innovation_bias: 0.3,
        collaboration_requirement: 0.8,
        memory_retention: 0.9,
        adaptation_rate: 0.7,
        cross_member_learning: true,
        response_optimization: 'quality',
        context_window: 10,
        specialized_capabilities: ['ethical-reasoning', 'collaborative-decision-making'],
        expertise_domains: [role],
        current_focus: ['council-integration', 'relationship-building'],
        temporary_constraints: {}
      },
      constitutional_alignment: 0.8,
      ethical_decision_count: 0,
      vote_participation: 0.0,
      collaboration_score: 0.5,
      wisdom_score: 0.3,
      empathy_growth: 0.4,
      leadership_capacity: 0.5,
      mentoring_ability: 0.4,
      knowledge_domains: {},
      skillsets: {},
      current_mood: 'optimistic',
      current_priorities: ['ethical-alignment', 'collaboration', 'learning'],
      current_concerns: [],
      current_goals: ['effective-decision-making', 'relationship-building'],
      metadata: {}
    };

    const result = await this.surrealDBService.create({
      table: 'council_member',
      id,
      data: memberRecord
    });

    console.log(`Created Council Member consciousness for: ${name} (${role})`);

    // Create initial relationship bonds with existing members
    await this.createInitialRelationshipBonds(id);
  }

  /**
   * Create initial relationship bonds between Council Members
   */
  async createInitialRelationshipBonds(newMemberId?: string): Promise<void> {
    // Get all council members
    const membersResult = await this.surrealDBService.select('council_member');
    const members = membersResult.data || [];

    // Create bonds between all pairs
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        const member1 = members[i];
        const member2 = members[j];

        // Skip if we're only creating bonds for a new member and neither is the new member
        if (newMemberId && member1.id !== newMemberId && member2.id !== newMemberId) {
          continue;
        }

        // Create bidirectional relationship bonds
        const bondData = {
          trust: 0.7,
          respect: 0.8,
          affinity: 0.6,
          collaboration: 0.5,
          understanding: 0.5,
          interaction_count: 0,
          positive_interactions: 0,
          negative_interactions: 0,
          neutral_interactions: 0,
          communication_style: 'formal',
          conflict_resolution_style: 'collaborative',
          relationship_trend: 'stable',
          last_interaction: new Date(),
          relationship_duration: 0,
          shared_values: ['ethical-governance', 'collaborative-decision-making', 'sustainable-innovation'],
          shared_experiences: ['council-formation'],
          collaborative_accomplishments: [],
          created_at: new Date(),
          updated_at: new Date()
        };

        // Bond from member1 to member2
        try {
          await this.surrealDBService.create({
            table: 'relationship_bond',
            id: `${member1.id}_to_${member2.id}`,
            data: {
              ...bondData,
              member1_id: member1.id,
              member2_id: member2.id,
              member1_name: member1.name,
              member2_name: member2.name
            }
          });
        } catch (error) {
          // Bond might already exist
        }

        // Bond from member2 to member1
        try {
          await this.surrealDBService.create({
            table: 'relationship_bond',
            id: `${member2.id}_to_${member1.id}`,
            data: {
              ...bondData,
              member1_id: member2.id,
              member2_id: member1.id,
              member1_name: member2.name,
              member2_name: member1.name
            }
          });
        } catch (error) {
          // Bond might already exist
        }
      }
    }

    console.log('Initial relationship bonds created successfully');
  }

  /**
   * Clean up and reset the consciousness schema (for development/testing)
   */
  async resetSchema(): Promise<void> {
    const tables = [
      'council_member', 'conversation', 'message', 'relationship_bond',
      'learning_experience', 'consciousness_update', 'personality_trait',
      'emotion_category', 'conversation_type', 'cache'
    ];

    for (const table of tables) {
      try {
        await this.surrealDBService.query(`DELETE ${table};`);
      } catch (error) {
        console.log(`Failed to clear table ${table}:`, error);
      }
    }

    console.log('Schema reset completed');
  }

  // Helper methods
  private getPersonalityTraitDescription(trait: string): string {
    const descriptions = {
      'openness': 'Creativity and intellectual curiosity',
      'conscientiousness': 'Organization and dependability',
      'extraversion': 'Sociability and assertiveness',
      'agreeableness': 'Compassion and cooperation',
      'neuroticism': 'Emotional stability (inverted)',
      'ethical_rigidity': 'Flexibility vs strict adherence to rules',
      'decision_confidence': 'Certainty in decision-making',
      'collaboration_preference': 'Preference for group vs individual work',
      'innovation_tendency': 'Preference for novel vs proven solutions',
      'trust_in_council': 'Trust level in other council members',
      'learning_rate': 'Rate of adaptation from experience'
    } as Record<string, string>;
    return descriptions[trait] || 'Custom personality trait';
  }

  private getEmotionType(emotion: string): string {
    const primaryEmotions = ['joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust'];
    const complexEmotions = ['pride', 'shame', 'guilt', 'empathy', 'curiosity', 'frustration', 'satisfaction'];
    
    if (primaryEmotions.includes(emotion)) return 'primary';
    if (complexEmotions.includes(emotion)) return 'complex';
    return 'council-specific';
  }

  private getConversationTypeDescription(type: string): string {
    const descriptions = {
      'decision-making': 'Conversations focused on making important decisions',
      'problem-solving': 'Collaborative problem resolution discussions',
      'learning': 'Knowledge sharing and educational interactions',
      'planning': 'Strategic planning and coordination meetings',
      'reflection': 'Reflective discussions on past experiences',
      'social': 'Relationship building and social bonding',
      'crisis': 'Emergency or crisis management discussions',
      'celebration': 'Celebrating achievements and milestones'
    } as Record<string, string>;
    return descriptions[type] || 'General conversation type';
  }
}
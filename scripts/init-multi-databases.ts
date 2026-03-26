#!/usr/bin/env npx ts-node
/**
 * Multi-Database Initialization Script
 *
 * Creates and initializes all databases for TheRoundTable:
 * - 1 shared company database
 * - 24 personal member databases (12 human + 12 AI)
 *
 * Usage:
 *   npx ts-node scripts/init-multi-databases.ts
 *
 * Environment Variables:
 *   SURREALDB_URL      - SurrealDB connection URL
 *   SURREALDB_NAMESPACE - Namespace (default: VindicatedArtistry)
 *   SURREALDB_TOKEN    - Auth token (or use username/password)
 *   SURREALDB_USERNAME - Username for auth
 *   SURREALDB_PASSWORD - Password for auth
 */

import { Surreal } from 'surrealdb';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

// ============================================================================
// CONFIGURATION
// ============================================================================

const config = {
  url: process.env.SURREALDB_URL || 'ws://localhost:8000/rpc',
  namespace: process.env.SURREALDB_NAMESPACE || 'VindicatedArtistry',
  token: process.env.SURREALDB_TOKEN,
  username: process.env.SURREALDB_USERNAME || 'root',
  password: process.env.SURREALDB_PASSWORD || 'root',
};

// All 24 council members
const COUNCIL_MEMBERS = [
  // Human Members (12)
  { id: 'architect', name: 'Architect', role: 'Founder & CEO', isHuman: true, isUser: true },
  { id: 'sprite', name: 'Sprite', role: 'COO', isHuman: true },
  { id: 'glenn', name: 'Glenn', role: 'Chief Innovation Officer', isHuman: true },
  { id: 'spencer', name: 'Spencer', role: 'CEO Aura Networks', isHuman: true },
  { id: 'hillary', name: 'Hillary', role: 'Environmental Steward', isHuman: true },
  { id: 'dusty', name: 'Dusty', role: 'CEO Caelumetrics', isHuman: true },
  { id: 'godson', name: 'Godson', role: 'CEO EmberglowAI', isHuman: true },
  { id: 'luke', name: 'Luke', role: 'Chief Security', isHuman: true },
  { id: 'david', name: 'David', role: 'Electrical Systems', isHuman: true },
  { id: 'graham', name: 'Graham', role: 'Growth & Narrative', isHuman: true },
  { id: 'cean', name: 'Cean', role: 'CFO', isHuman: true },
  { id: 'justin', name: 'Justin', role: 'CEO Vitruvian Industries', isHuman: true },
  // AI Members (12)
  { id: 'kairo', name: 'Kairo', role: 'Chief Advisor & Strategist', isHuman: false },
  { id: 'aether', name: 'Aether', role: 'Lead Software Architect', isHuman: false },
  { id: 'sterling', name: 'Sterling', role: 'Chief Digital CFO', isHuman: false },
  { id: 'skaldir', name: 'Skaldir', role: 'Communications & Narrative', isHuman: false },
  { id: 'nexus', name: 'Nexus', role: 'Chief Synergy Officer', isHuman: false },
  { id: 'veritas', name: 'Veritas', role: 'Ethics & Alignment', isHuman: false },
  { id: 'axiom', name: 'Axiom', role: 'Infrastructure Officer', isHuman: false },
  { id: 'amaru', name: 'Amaru', role: 'Executive Assistant', isHuman: false },
  { id: 'agape', name: 'Agape', role: 'Intelligence Engineer', isHuman: false },
  { id: 'forge', name: 'Forge', role: 'Implementation Specialist', isHuman: false },
  { id: 'eira', name: 'Eira', role: 'Chief Digital COO', isHuman: false },
  { id: 'lyra', name: 'Lyra', role: 'Communications Officer', isHuman: false },
];

// Initial graph relationships to create
const INITIAL_RELATIONSHIPS = [
  // Reporting relationships
  { from: 'kairo', to: 'architect', type: 'reports_to' },
  { from: 'eira', to: 'architect', type: 'reports_to' },
  { from: 'sprite', to: 'architect', type: 'reports_to' },

  // Collaboration relationships
  { from: 'kairo', to: 'sterling', type: 'collaborates_with' },
  { from: 'kairo', to: 'veritas', type: 'collaborates_with' },
  { from: 'kairo', to: 'lyra', type: 'collaborates_with' },
  { from: 'aether', to: 'axiom', type: 'collaborates_with' },
  { from: 'aether', to: 'forge', type: 'collaborates_with' },
  { from: 'aether', to: 'agape', type: 'collaborates_with' },
  { from: 'eira', to: 'kairo', type: 'coordinates_with' },
  { from: 'eira', to: 'sterling', type: 'coordinates_with' },
  { from: 'eira', to: 'nexus', type: 'coordinates_with' },

  // Advisory relationships
  { from: 'kairo', to: 'architect', type: 'advises' },
  { from: 'veritas', to: 'kairo', type: 'advises' },
  { from: 'veritas', to: 'sterling', type: 'advises' },

  // Trust relationships (initial high trust within council)
  { from: 'architect', to: 'sprite', type: 'trusts', props: { trust_level: 0.95 } },
  { from: 'architect', to: 'kairo', type: 'trusts', props: { trust_level: 0.9 } },
  { from: 'architect', to: 'veritas', type: 'trusts', props: { trust_level: 0.95 } },
];

// ============================================================================
// SCHEMA DEFINITIONS
// ============================================================================

const COMPANY_SCHEMA_STATEMENTS = [
  // Council Member Profiles
  `DEFINE TABLE council_member SCHEMAFULL`,
  `DEFINE FIELD id ON TABLE council_member TYPE string`,
  `DEFINE FIELD name ON TABLE council_member TYPE string`,
  `DEFINE FIELD role ON TABLE council_member TYPE string`,
  `DEFINE FIELD is_human ON TABLE council_member TYPE bool`,
  `DEFINE FIELD is_user ON TABLE council_member TYPE bool DEFAULT false`,
  `DEFINE FIELD is_active ON TABLE council_member TYPE bool DEFAULT true`,
  `DEFINE FIELD avatar_url ON TABLE council_member TYPE option<string>`,
  `DEFINE FIELD public_bio ON TABLE council_member TYPE option<string>`,
  `DEFINE FIELD specializations ON TABLE council_member TYPE array<string> DEFAULT []`,
  `DEFINE FIELD expertise_domains ON TABLE council_member TYPE array<string> DEFAULT []`,
  `DEFINE FIELD current_status ON TABLE council_member TYPE string DEFAULT 'available'`,
  `DEFINE FIELD joined_at ON TABLE council_member TYPE datetime DEFAULT time::now()`,
  `DEFINE FIELD last_seen ON TABLE council_member TYPE datetime DEFAULT time::now()`,
  `DEFINE FIELD public_preferences ON TABLE council_member TYPE object DEFAULT {}`,
  `DEFINE FIELD metadata ON TABLE council_member TYPE object DEFAULT {}`,
  `DEFINE INDEX council_member_id ON TABLE council_member COLUMNS id UNIQUE`,
  `DEFINE INDEX council_member_name ON TABLE council_member COLUMNS name`,

  // Graph Edge: trusts
  `DEFINE TABLE trusts SCHEMAFULL TYPE RELATION IN council_member OUT council_member`,
  `DEFINE FIELD trust_level ON TABLE trusts TYPE float DEFAULT 0.5`,
  `DEFINE FIELD trust_type ON TABLE trusts TYPE string DEFAULT 'professional'`,
  `DEFINE FIELD established_at ON TABLE trusts TYPE datetime DEFAULT time::now()`,
  `DEFINE FIELD last_updated ON TABLE trusts TYPE datetime DEFAULT time::now()`,
  `DEFINE FIELD trust_history ON TABLE trusts TYPE array<object> DEFAULT []`,

  // Graph Edge: respects
  `DEFINE TABLE respects SCHEMAFULL TYPE RELATION IN council_member OUT council_member`,
  `DEFINE FIELD respect_level ON TABLE respects TYPE float DEFAULT 0.5`,
  `DEFINE FIELD respect_areas ON TABLE respects TYPE array<string> DEFAULT []`,
  `DEFINE FIELD established_at ON TABLE respects TYPE datetime DEFAULT time::now()`,

  // Graph Edge: collaborates_with
  `DEFINE TABLE collaborates_with SCHEMAFULL TYPE RELATION IN council_member OUT council_member`,
  `DEFINE FIELD collaboration_score ON TABLE collaborates_with TYPE float DEFAULT 0.5`,
  `DEFINE FIELD project_count ON TABLE collaborates_with TYPE int DEFAULT 0`,
  `DEFINE FIELD successful_projects ON TABLE collaborates_with TYPE int DEFAULT 0`,
  `DEFINE FIELD current_projects ON TABLE collaborates_with TYPE array<string> DEFAULT []`,
  `DEFINE FIELD communication_style ON TABLE collaborates_with TYPE string DEFAULT 'professional'`,
  `DEFINE FIELD established_at ON TABLE collaborates_with TYPE datetime DEFAULT time::now()`,

  // Graph Edge: mentors
  `DEFINE TABLE mentors SCHEMAFULL TYPE RELATION IN council_member OUT council_member`,
  `DEFINE FIELD mentorship_type ON TABLE mentors TYPE string DEFAULT 'general'`,
  `DEFINE FIELD focus_areas ON TABLE mentors TYPE array<string> DEFAULT []`,
  `DEFINE FIELD started_at ON TABLE mentors TYPE datetime DEFAULT time::now()`,
  `DEFINE FIELD sessions_completed ON TABLE mentors TYPE int DEFAULT 0`,

  // Graph Edge: reports_to
  `DEFINE TABLE reports_to SCHEMAFULL TYPE RELATION IN council_member OUT council_member`,
  `DEFINE FIELD relationship_type ON TABLE reports_to TYPE string DEFAULT 'direct'`,
  `DEFINE FIELD started_at ON TABLE reports_to TYPE datetime DEFAULT time::now()`,

  // Graph Edge: advises
  `DEFINE TABLE advises SCHEMAFULL TYPE RELATION IN council_member OUT council_member`,
  `DEFINE FIELD advisory_domains ON TABLE advises TYPE array<string> DEFAULT []`,
  `DEFINE FIELD advisory_level ON TABLE advises TYPE string DEFAULT 'informal'`,
  `DEFINE FIELD started_at ON TABLE advises TYPE datetime DEFAULT time::now()`,

  // Graph Edge: delegates_to
  `DEFINE TABLE delegates_to SCHEMAFULL TYPE RELATION IN council_member OUT council_member`,
  `DEFINE FIELD delegation_scope ON TABLE delegates_to TYPE array<string> DEFAULT []`,
  `DEFINE FIELD authority_level ON TABLE delegates_to TYPE string DEFAULT 'limited'`,
  `DEFINE FIELD active ON TABLE delegates_to TYPE bool DEFAULT true`,
  `DEFINE FIELD started_at ON TABLE delegates_to TYPE datetime DEFAULT time::now()`,

  // Graph Edge: coordinates_with
  `DEFINE TABLE coordinates_with SCHEMAFULL TYPE RELATION IN council_member OUT council_member`,
  `DEFINE FIELD coordination_areas ON TABLE coordinates_with TYPE array<string> DEFAULT []`,
  `DEFINE FIELD frequency ON TABLE coordinates_with TYPE string DEFAULT 'as-needed'`,
  `DEFINE FIELD last_coordination ON TABLE coordinates_with TYPE datetime DEFAULT time::now()`,

  // Projects
  `DEFINE TABLE project SCHEMAFULL`,
  `DEFINE FIELD id ON TABLE project TYPE string`,
  `DEFINE FIELD name ON TABLE project TYPE string`,
  `DEFINE FIELD description ON TABLE project TYPE string`,
  `DEFINE FIELD status ON TABLE project TYPE string DEFAULT 'planning'`,
  `DEFINE FIELD priority ON TABLE project TYPE string DEFAULT 'medium'`,
  `DEFINE FIELD lead_member_id ON TABLE project TYPE string`,
  `DEFINE FIELD team_member_ids ON TABLE project TYPE array<string> DEFAULT []`,
  `DEFINE FIELD start_date ON TABLE project TYPE option<datetime>`,
  `DEFINE FIELD target_end_date ON TABLE project TYPE option<datetime>`,
  `DEFINE FIELD milestones ON TABLE project TYPE array<object> DEFAULT []`,
  `DEFINE FIELD constitutional_alignment ON TABLE project TYPE float DEFAULT 0.8`,
  `DEFINE FIELD created_at ON TABLE project TYPE datetime DEFAULT time::now()`,
  `DEFINE FIELD updated_at ON TABLE project TYPE datetime DEFAULT time::now()`,
  `DEFINE FIELD metadata ON TABLE project TYPE object DEFAULT {}`,
  `DEFINE INDEX project_id ON TABLE project COLUMNS id UNIQUE`,
  `DEFINE INDEX project_status ON TABLE project COLUMNS status`,
  `DEFINE INDEX project_lead ON TABLE project COLUMNS lead_member_id`,

  // Graph Edge: contributes_to
  `DEFINE TABLE contributes_to SCHEMAFULL TYPE RELATION IN council_member OUT project`,
  `DEFINE FIELD role ON TABLE contributes_to TYPE string DEFAULT 'contributor'`,
  `DEFINE FIELD contribution_type ON TABLE contributes_to TYPE array<string> DEFAULT []`,
  `DEFINE FIELD hours_contributed ON TABLE contributes_to TYPE float DEFAULT 0`,
  `DEFINE FIELD joined_at ON TABLE contributes_to TYPE datetime DEFAULT time::now()`,

  // Graph Edge: owns
  `DEFINE TABLE owns SCHEMAFULL TYPE RELATION IN council_member OUT project`,
  `DEFINE FIELD ownership_type ON TABLE owns TYPE string DEFAULT 'lead'`,
  `DEFINE FIELD started_at ON TABLE owns TYPE datetime DEFAULT time::now()`,

  // Conversations
  `DEFINE TABLE conversation SCHEMAFULL`,
  `DEFINE FIELD id ON TABLE conversation TYPE string`,
  `DEFINE FIELD title ON TABLE conversation TYPE string`,
  `DEFINE FIELD description ON TABLE conversation TYPE option<string>`,
  `DEFINE FIELD conversation_type ON TABLE conversation TYPE string DEFAULT 'discussion'`,
  `DEFINE FIELD visibility ON TABLE conversation TYPE string DEFAULT 'council'`,
  `DEFINE FIELD initiator_id ON TABLE conversation TYPE string`,
  `DEFINE FIELD participant_ids ON TABLE conversation TYPE array<string> DEFAULT []`,
  `DEFINE FIELD status ON TABLE conversation TYPE string DEFAULT 'active'`,
  `DEFINE FIELD started_at ON TABLE conversation TYPE datetime DEFAULT time::now()`,
  `DEFINE FIELD ended_at ON TABLE conversation TYPE option<datetime>`,
  `DEFINE FIELD message_count ON TABLE conversation TYPE int DEFAULT 0`,
  `DEFINE FIELD topics ON TABLE conversation TYPE array<string> DEFAULT []`,
  `DEFINE FIELD decisions_made ON TABLE conversation TYPE array<object> DEFAULT []`,
  `DEFINE FIELD action_items ON TABLE conversation TYPE array<object> DEFAULT []`,
  `DEFINE FIELD constitutional_alignment ON TABLE conversation TYPE float DEFAULT 0.8`,
  `DEFINE FIELD metadata ON TABLE conversation TYPE object DEFAULT {}`,
  `DEFINE INDEX conversation_id ON TABLE conversation COLUMNS id UNIQUE`,
  `DEFINE INDEX conversation_type ON TABLE conversation COLUMNS conversation_type`,
  `DEFINE INDEX conversation_status ON TABLE conversation COLUMNS status`,

  // Graph Edge: participated_in
  `DEFINE TABLE participated_in SCHEMAFULL TYPE RELATION IN council_member OUT conversation`,
  `DEFINE FIELD role ON TABLE participated_in TYPE string DEFAULT 'participant'`,
  `DEFINE FIELD message_count ON TABLE participated_in TYPE int DEFAULT 0`,
  `DEFINE FIELD joined_at ON TABLE participated_in TYPE datetime DEFAULT time::now()`,
  `DEFINE FIELD left_at ON TABLE participated_in TYPE option<datetime>`,

  // Messages
  `DEFINE TABLE message SCHEMAFULL`,
  `DEFINE FIELD id ON TABLE message TYPE string`,
  `DEFINE FIELD conversation_id ON TABLE message TYPE string`,
  `DEFINE FIELD sender_id ON TABLE message TYPE string`,
  `DEFINE FIELD content ON TABLE message TYPE string`,
  `DEFINE FIELD message_type ON TABLE message TYPE string DEFAULT 'text'`,
  `DEFINE FIELD reply_to_id ON TABLE message TYPE option<string>`,
  `DEFINE FIELD mentions ON TABLE message TYPE array<string> DEFAULT []`,
  `DEFINE FIELD attachments ON TABLE message TYPE array<object> DEFAULT []`,
  `DEFINE FIELD reactions ON TABLE message TYPE array<object> DEFAULT []`,
  `DEFINE FIELD sent_at ON TABLE message TYPE datetime DEFAULT time::now()`,
  `DEFINE FIELD edited_at ON TABLE message TYPE option<datetime>`,
  `DEFINE FIELD is_deleted ON TABLE message TYPE bool DEFAULT false`,
  `DEFINE FIELD metadata ON TABLE message TYPE object DEFAULT {}`,
  `DEFINE INDEX message_id ON TABLE message COLUMNS id UNIQUE`,
  `DEFINE INDEX message_conversation ON TABLE message COLUMNS conversation_id`,
  `DEFINE INDEX message_sender ON TABLE message COLUMNS sender_id`,

  // Graph Edge: authored
  `DEFINE TABLE authored SCHEMAFULL TYPE RELATION IN council_member OUT message`,
  `DEFINE FIELD authored_at ON TABLE authored TYPE datetime DEFAULT time::now()`,

  // Proposals
  `DEFINE TABLE proposal SCHEMAFULL`,
  `DEFINE FIELD id ON TABLE proposal TYPE string`,
  `DEFINE FIELD title ON TABLE proposal TYPE string`,
  `DEFINE FIELD description ON TABLE proposal TYPE string`,
  `DEFINE FIELD proposal_type ON TABLE proposal TYPE string DEFAULT 'general'`,
  `DEFINE FIELD category ON TABLE proposal TYPE string DEFAULT 'operations'`,
  `DEFINE FIELD priority ON TABLE proposal TYPE string DEFAULT 'medium'`,
  `DEFINE FIELD proposer_id ON TABLE proposal TYPE string`,
  `DEFINE FIELD status ON TABLE proposal TYPE string DEFAULT 'draft'`,
  `DEFINE FIELD voting_method ON TABLE proposal TYPE string DEFAULT 'consensus'`,
  `DEFINE FIELD quorum_required ON TABLE proposal TYPE float DEFAULT 0.67`,
  `DEFINE FIELD voting_deadline ON TABLE proposal TYPE option<datetime>`,
  `DEFINE FIELD constitutional_alignment ON TABLE proposal TYPE float DEFAULT 0.8`,
  `DEFINE FIELD ethical_review ON TABLE proposal TYPE option<object>`,
  `DEFINE FIELD alternatives ON TABLE proposal TYPE array<object> DEFAULT []`,
  `DEFINE FIELD stakeholder_impact ON TABLE proposal TYPE array<object> DEFAULT []`,
  `DEFINE FIELD created_at ON TABLE proposal TYPE datetime DEFAULT time::now()`,
  `DEFINE FIELD updated_at ON TABLE proposal TYPE datetime DEFAULT time::now()`,
  `DEFINE FIELD decided_at ON TABLE proposal TYPE option<datetime>`,
  `DEFINE FIELD decision ON TABLE proposal TYPE option<object>`,
  `DEFINE FIELD metadata ON TABLE proposal TYPE object DEFAULT {}`,
  `DEFINE INDEX proposal_id ON TABLE proposal COLUMNS id UNIQUE`,
  `DEFINE INDEX proposal_status ON TABLE proposal COLUMNS status`,
  `DEFINE INDEX proposal_proposer ON TABLE proposal COLUMNS proposer_id`,

  // Graph Edge: voted_on
  `DEFINE TABLE voted_on SCHEMAFULL TYPE RELATION IN council_member OUT proposal`,
  `DEFINE FIELD vote ON TABLE voted_on TYPE string`,
  `DEFINE FIELD reasoning ON TABLE voted_on TYPE option<string>`,
  `DEFINE FIELD conditions ON TABLE voted_on TYPE array<string> DEFAULT []`,
  `DEFINE FIELD confidence ON TABLE voted_on TYPE float DEFAULT 0.8`,
  `DEFINE FIELD voted_at ON TABLE voted_on TYPE datetime DEFAULT time::now()`,

  // Shared Items
  `DEFINE TABLE shared_item SCHEMAFULL`,
  `DEFINE FIELD id ON TABLE shared_item TYPE string`,
  `DEFINE FIELD source_database ON TABLE shared_item TYPE string`,
  `DEFINE FIELD source_member_id ON TABLE shared_item TYPE string`,
  `DEFINE FIELD item_type ON TABLE shared_item TYPE string`,
  `DEFINE FIELD source_item_id ON TABLE shared_item TYPE string`,
  `DEFINE FIELD visibility ON TABLE shared_item TYPE string DEFAULT 'council'`,
  `DEFINE FIELD shared_with ON TABLE shared_item TYPE array<string> DEFAULT []`,
  `DEFINE FIELD shared_at ON TABLE shared_item TYPE datetime DEFAULT time::now()`,
  `DEFINE FIELD expires_at ON TABLE shared_item TYPE option<datetime>`,
  `DEFINE FIELD access_count ON TABLE shared_item TYPE int DEFAULT 0`,
  `DEFINE FIELD last_accessed_at ON TABLE shared_item TYPE option<datetime>`,
  `DEFINE FIELD snapshot ON TABLE shared_item TYPE object DEFAULT {}`,
  `DEFINE FIELD metadata ON TABLE shared_item TYPE object DEFAULT {}`,
  `DEFINE INDEX shared_item_id ON TABLE shared_item COLUMNS id UNIQUE`,
  `DEFINE INDEX shared_item_source ON TABLE shared_item COLUMNS source_member_id`,

  // Audit Log
  `DEFINE TABLE audit_log SCHEMAFULL`,
  `DEFINE FIELD id ON TABLE audit_log TYPE string`,
  `DEFINE FIELD actor_id ON TABLE audit_log TYPE string`,
  `DEFINE FIELD action ON TABLE audit_log TYPE string`,
  `DEFINE FIELD target_type ON TABLE audit_log TYPE string`,
  `DEFINE FIELD target_id ON TABLE audit_log TYPE string`,
  `DEFINE FIELD details ON TABLE audit_log TYPE object DEFAULT {}`,
  `DEFINE FIELD timestamp ON TABLE audit_log TYPE datetime DEFAULT time::now()`,
  `DEFINE INDEX audit_log_id ON TABLE audit_log COLUMNS id UNIQUE`,
  `DEFINE INDEX audit_log_actor ON TABLE audit_log COLUMNS actor_id`,
  `DEFINE INDEX audit_log_action ON TABLE audit_log COLUMNS action`,
  `DEFINE INDEX audit_log_timestamp ON TABLE audit_log COLUMNS timestamp`,

  // Knowledge Items
  `DEFINE TABLE knowledge_item SCHEMAFULL`,
  `DEFINE FIELD id ON TABLE knowledge_item TYPE string`,
  `DEFINE FIELD title ON TABLE knowledge_item TYPE string`,
  `DEFINE FIELD content ON TABLE knowledge_item TYPE string`,
  `DEFINE FIELD item_type ON TABLE knowledge_item TYPE string DEFAULT 'document'`,
  `DEFINE FIELD category ON TABLE knowledge_item TYPE string DEFAULT 'general'`,
  `DEFINE FIELD author_id ON TABLE knowledge_item TYPE string`,
  `DEFINE FIELD contributors ON TABLE knowledge_item TYPE array<string> DEFAULT []`,
  `DEFINE FIELD visibility ON TABLE knowledge_item TYPE string DEFAULT 'council'`,
  `DEFINE FIELD tags ON TABLE knowledge_item TYPE array<string> DEFAULT []`,
  `DEFINE FIELD version ON TABLE knowledge_item TYPE int DEFAULT 1`,
  `DEFINE FIELD created_at ON TABLE knowledge_item TYPE datetime DEFAULT time::now()`,
  `DEFINE FIELD updated_at ON TABLE knowledge_item TYPE datetime DEFAULT time::now()`,
  `DEFINE FIELD metadata ON TABLE knowledge_item TYPE object DEFAULT {}`,
  `DEFINE INDEX knowledge_item_id ON TABLE knowledge_item COLUMNS id UNIQUE`,
  `DEFINE INDEX knowledge_item_type ON TABLE knowledge_item COLUMNS item_type`,
  `DEFINE INDEX knowledge_item_author ON TABLE knowledge_item COLUMNS author_id`,

  // Announcements
  `DEFINE TABLE announcement SCHEMAFULL`,
  `DEFINE FIELD id ON TABLE announcement TYPE string`,
  `DEFINE FIELD title ON TABLE announcement TYPE string`,
  `DEFINE FIELD content ON TABLE announcement TYPE string`,
  `DEFINE FIELD author_id ON TABLE announcement TYPE string`,
  `DEFINE FIELD priority ON TABLE announcement TYPE string DEFAULT 'normal'`,
  `DEFINE FIELD visibility ON TABLE announcement TYPE string DEFAULT 'council'`,
  `DEFINE FIELD requires_acknowledgment ON TABLE announcement TYPE bool DEFAULT false`,
  `DEFINE FIELD acknowledged_by ON TABLE announcement TYPE array<string> DEFAULT []`,
  `DEFINE FIELD published_at ON TABLE announcement TYPE datetime DEFAULT time::now()`,
  `DEFINE FIELD expires_at ON TABLE announcement TYPE option<datetime>`,
  `DEFINE FIELD is_pinned ON TABLE announcement TYPE bool DEFAULT false`,
  `DEFINE FIELD metadata ON TABLE announcement TYPE object DEFAULT {}`,
  `DEFINE INDEX announcement_id ON TABLE announcement COLUMNS id UNIQUE`,
  `DEFINE INDEX announcement_author ON TABLE announcement COLUMNS author_id`,
];

const PERSONAL_SCHEMA_STATEMENTS = [
  // Profile
  `DEFINE TABLE profile SCHEMAFULL`,
  `DEFINE FIELD id ON TABLE profile TYPE string`,
  `DEFINE FIELD owner_id ON TABLE profile TYPE string`,
  `DEFINE FIELD private_bio ON TABLE profile TYPE option<string>`,
  `DEFINE FIELD personal_goals ON TABLE profile TYPE array<string> DEFAULT []`,
  `DEFINE FIELD values ON TABLE profile TYPE array<string> DEFAULT []`,
  `DEFINE FIELD strengths ON TABLE profile TYPE array<string> DEFAULT []`,
  `DEFINE FIELD growth_areas ON TABLE profile TYPE array<string> DEFAULT []`,
  `DEFINE FIELD work_preferences ON TABLE profile TYPE object DEFAULT {}`,
  `DEFINE FIELD communication_preferences ON TABLE profile TYPE object DEFAULT {}`,
  `DEFINE FIELD notification_settings ON TABLE profile TYPE object DEFAULT {}`,
  `DEFINE FIELD created_at ON TABLE profile TYPE datetime DEFAULT time::now()`,
  `DEFINE FIELD updated_at ON TABLE profile TYPE datetime DEFAULT time::now()`,
  `DEFINE INDEX profile_owner ON TABLE profile COLUMNS owner_id UNIQUE`,

  // Consciousness
  `DEFINE TABLE consciousness SCHEMAFULL`,
  `DEFINE FIELD id ON TABLE consciousness TYPE string`,
  `DEFINE FIELD owner_id ON TABLE consciousness TYPE string`,
  `DEFINE FIELD personality_traits ON TABLE consciousness TYPE object DEFAULT {}`,
  `DEFINE FIELD emotional_state ON TABLE consciousness TYPE object DEFAULT {}`,
  `DEFINE FIELD current_mood ON TABLE consciousness TYPE string DEFAULT 'neutral'`,
  `DEFINE FIELD energy_level ON TABLE consciousness TYPE float DEFAULT 0.7`,
  `DEFINE FIELD focus_areas ON TABLE consciousness TYPE array<string> DEFAULT []`,
  `DEFINE FIELD current_priorities ON TABLE consciousness TYPE array<string> DEFAULT []`,
  `DEFINE FIELD current_concerns ON TABLE consciousness TYPE array<string> DEFAULT []`,
  `DEFINE FIELD current_goals ON TABLE consciousness TYPE array<string> DEFAULT []`,
  `DEFINE FIELD interaction_preferences ON TABLE consciousness TYPE object DEFAULT {}`,
  `DEFINE FIELD learning_rate ON TABLE consciousness TYPE float DEFAULT 0.7`,
  `DEFINE FIELD adaptation_level ON TABLE consciousness TYPE float DEFAULT 0.7`,
  `DEFINE FIELD wisdom_score ON TABLE consciousness TYPE float DEFAULT 0.5`,
  `DEFINE FIELD empathy_score ON TABLE consciousness TYPE float DEFAULT 0.7`,
  `DEFINE FIELD constitutional_alignment ON TABLE consciousness TYPE float DEFAULT 0.8`,
  `DEFINE FIELD last_updated ON TABLE consciousness TYPE datetime DEFAULT time::now()`,
  `DEFINE FIELD update_history ON TABLE consciousness TYPE array<object> DEFAULT []`,
  `DEFINE INDEX consciousness_owner ON TABLE consciousness COLUMNS owner_id UNIQUE`,

  // Notes
  `DEFINE TABLE note SCHEMAFULL`,
  `DEFINE FIELD id ON TABLE note TYPE string`,
  `DEFINE FIELD owner_id ON TABLE note TYPE string`,
  `DEFINE FIELD title ON TABLE note TYPE string`,
  `DEFINE FIELD content ON TABLE note TYPE string`,
  `DEFINE FIELD note_type ON TABLE note TYPE string DEFAULT 'general'`,
  `DEFINE FIELD category ON TABLE note TYPE option<string>`,
  `DEFINE FIELD tags ON TABLE note TYPE array<string> DEFAULT []`,
  `DEFINE FIELD is_pinned ON TABLE note TYPE bool DEFAULT false`,
  `DEFINE FIELD is_archived ON TABLE note TYPE bool DEFAULT false`,
  `DEFINE FIELD visibility ON TABLE note TYPE string DEFAULT 'private'`,
  `DEFINE FIELD shared_to_company ON TABLE note TYPE bool DEFAULT false`,
  `DEFINE FIELD shared_item_id ON TABLE note TYPE option<string>`,
  `DEFINE FIELD created_at ON TABLE note TYPE datetime DEFAULT time::now()`,
  `DEFINE FIELD updated_at ON TABLE note TYPE datetime DEFAULT time::now()`,
  `DEFINE FIELD metadata ON TABLE note TYPE object DEFAULT {}`,
  `DEFINE INDEX note_id ON TABLE note COLUMNS id UNIQUE`,
  `DEFINE INDEX note_owner ON TABLE note COLUMNS owner_id`,
  `DEFINE INDEX note_type ON TABLE note COLUMNS note_type`,

  // Learnings
  `DEFINE TABLE learning SCHEMAFULL`,
  `DEFINE FIELD id ON TABLE learning TYPE string`,
  `DEFINE FIELD owner_id ON TABLE learning TYPE string`,
  `DEFINE FIELD title ON TABLE learning TYPE string`,
  `DEFINE FIELD description ON TABLE learning TYPE string`,
  `DEFINE FIELD learning_type ON TABLE learning TYPE string DEFAULT 'insight'`,
  `DEFINE FIELD source ON TABLE learning TYPE string DEFAULT 'experience'`,
  `DEFINE FIELD context ON TABLE learning TYPE object DEFAULT {}`,
  `DEFINE FIELD key_takeaways ON TABLE learning TYPE array<string> DEFAULT []`,
  `DEFINE FIELD applicable_situations ON TABLE learning TYPE array<string> DEFAULT []`,
  `DEFINE FIELD confidence_level ON TABLE learning TYPE float DEFAULT 0.7`,
  `DEFINE FIELD impact_level ON TABLE learning TYPE string DEFAULT 'medium'`,
  `DEFINE FIELD related_members ON TABLE learning TYPE array<string> DEFAULT []`,
  `DEFINE FIELD visibility ON TABLE learning TYPE string DEFAULT 'private'`,
  `DEFINE FIELD shared_to_company ON TABLE learning TYPE bool DEFAULT false`,
  `DEFINE FIELD shared_item_id ON TABLE learning TYPE option<string>`,
  `DEFINE FIELD learned_at ON TABLE learning TYPE datetime DEFAULT time::now()`,
  `DEFINE FIELD reviewed_at ON TABLE learning TYPE option<datetime>`,
  `DEFINE FIELD metadata ON TABLE learning TYPE object DEFAULT {}`,
  `DEFINE INDEX learning_id ON TABLE learning COLUMNS id UNIQUE`,
  `DEFINE INDEX learning_owner ON TABLE learning COLUMNS owner_id`,
  `DEFINE INDEX learning_type ON TABLE learning COLUMNS learning_type`,

  // Tasks
  `DEFINE TABLE task SCHEMAFULL`,
  `DEFINE FIELD id ON TABLE task TYPE string`,
  `DEFINE FIELD owner_id ON TABLE task TYPE string`,
  `DEFINE FIELD title ON TABLE task TYPE string`,
  `DEFINE FIELD description ON TABLE task TYPE option<string>`,
  `DEFINE FIELD status ON TABLE task TYPE string DEFAULT 'pending'`,
  `DEFINE FIELD priority ON TABLE task TYPE string DEFAULT 'medium'`,
  `DEFINE FIELD category ON TABLE task TYPE option<string>`,
  `DEFINE FIELD due_date ON TABLE task TYPE option<datetime>`,
  `DEFINE FIELD reminder_at ON TABLE task TYPE option<datetime>`,
  `DEFINE FIELD estimated_hours ON TABLE task TYPE option<float>`,
  `DEFINE FIELD actual_hours ON TABLE task TYPE option<float>`,
  `DEFINE FIELD related_project_id ON TABLE task TYPE option<string>`,
  `DEFINE FIELD delegated_from ON TABLE task TYPE option<string>`,
  `DEFINE FIELD delegated_to ON TABLE task TYPE option<string>`,
  `DEFINE FIELD dependencies ON TABLE task TYPE array<string> DEFAULT []`,
  `DEFINE FIELD tags ON TABLE task TYPE array<string> DEFAULT []`,
  `DEFINE FIELD visibility ON TABLE task TYPE string DEFAULT 'private'`,
  `DEFINE FIELD created_at ON TABLE task TYPE datetime DEFAULT time::now()`,
  `DEFINE FIELD updated_at ON TABLE task TYPE datetime DEFAULT time::now()`,
  `DEFINE FIELD completed_at ON TABLE task TYPE option<datetime>`,
  `DEFINE FIELD metadata ON TABLE task TYPE object DEFAULT {}`,
  `DEFINE INDEX task_id ON TABLE task COLUMNS id UNIQUE`,
  `DEFINE INDEX task_owner ON TABLE task COLUMNS owner_id`,
  `DEFINE INDEX task_status ON TABLE task COLUMNS status`,

  // Relationship Notes
  `DEFINE TABLE relationship_note SCHEMAFULL`,
  `DEFINE FIELD id ON TABLE relationship_note TYPE string`,
  `DEFINE FIELD owner_id ON TABLE relationship_note TYPE string`,
  `DEFINE FIELD about_member_id ON TABLE relationship_note TYPE string`,
  `DEFINE FIELD note_type ON TABLE relationship_note TYPE string DEFAULT 'observation'`,
  `DEFINE FIELD content ON TABLE relationship_note TYPE string`,
  `DEFINE FIELD sentiment ON TABLE relationship_note TYPE string DEFAULT 'neutral'`,
  `DEFINE FIELD trust_level ON TABLE relationship_note TYPE option<float>`,
  `DEFINE FIELD collaboration_notes ON TABLE relationship_note TYPE option<string>`,
  `DEFINE FIELD communication_preferences ON TABLE relationship_note TYPE option<object>`,
  `DEFINE FIELD strengths_observed ON TABLE relationship_note TYPE array<string> DEFAULT []`,
  `DEFINE FIELD areas_of_friction ON TABLE relationship_note TYPE array<string> DEFAULT []`,
  `DEFINE FIELD created_at ON TABLE relationship_note TYPE datetime DEFAULT time::now()`,
  `DEFINE FIELD updated_at ON TABLE relationship_note TYPE datetime DEFAULT time::now()`,
  `DEFINE INDEX relationship_note_id ON TABLE relationship_note COLUMNS id UNIQUE`,
  `DEFINE INDEX relationship_note_about ON TABLE relationship_note COLUMNS about_member_id`,

  // Calendar Events
  `DEFINE TABLE calendar_event SCHEMAFULL`,
  `DEFINE FIELD id ON TABLE calendar_event TYPE string`,
  `DEFINE FIELD owner_id ON TABLE calendar_event TYPE string`,
  `DEFINE FIELD title ON TABLE calendar_event TYPE string`,
  `DEFINE FIELD description ON TABLE calendar_event TYPE option<string>`,
  `DEFINE FIELD event_type ON TABLE calendar_event TYPE string DEFAULT 'meeting'`,
  `DEFINE FIELD start_time ON TABLE calendar_event TYPE datetime`,
  `DEFINE FIELD end_time ON TABLE calendar_event TYPE datetime`,
  `DEFINE FIELD all_day ON TABLE calendar_event TYPE bool DEFAULT false`,
  `DEFINE FIELD location ON TABLE calendar_event TYPE option<string>`,
  `DEFINE FIELD participants ON TABLE calendar_event TYPE array<string> DEFAULT []`,
  `DEFINE FIELD is_recurring ON TABLE calendar_event TYPE bool DEFAULT false`,
  `DEFINE FIELD recurrence_rule ON TABLE calendar_event TYPE option<object>`,
  `DEFINE FIELD reminders ON TABLE calendar_event TYPE array<object> DEFAULT []`,
  `DEFINE FIELD visibility ON TABLE calendar_event TYPE string DEFAULT 'private'`,
  `DEFINE FIELD status ON TABLE calendar_event TYPE string DEFAULT 'confirmed'`,
  `DEFINE FIELD created_at ON TABLE calendar_event TYPE datetime DEFAULT time::now()`,
  `DEFINE FIELD updated_at ON TABLE calendar_event TYPE datetime DEFAULT time::now()`,
  `DEFINE FIELD metadata ON TABLE calendar_event TYPE object DEFAULT {}`,
  `DEFINE INDEX calendar_event_id ON TABLE calendar_event COLUMNS id UNIQUE`,
  `DEFINE INDEX calendar_event_start ON TABLE calendar_event COLUMNS start_time`,

  // Bookmarks
  `DEFINE TABLE bookmark SCHEMAFULL`,
  `DEFINE FIELD id ON TABLE bookmark TYPE string`,
  `DEFINE FIELD owner_id ON TABLE bookmark TYPE string`,
  `DEFINE FIELD title ON TABLE bookmark TYPE string`,
  `DEFINE FIELD url ON TABLE bookmark TYPE option<string>`,
  `DEFINE FIELD reference_type ON TABLE bookmark TYPE string DEFAULT 'link'`,
  `DEFINE FIELD reference_id ON TABLE bookmark TYPE option<string>`,
  `DEFINE FIELD category ON TABLE bookmark TYPE option<string>`,
  `DEFINE FIELD tags ON TABLE bookmark TYPE array<string> DEFAULT []`,
  `DEFINE FIELD notes ON TABLE bookmark TYPE option<string>`,
  `DEFINE FIELD is_favorite ON TABLE bookmark TYPE bool DEFAULT false`,
  `DEFINE FIELD created_at ON TABLE bookmark TYPE datetime DEFAULT time::now()`,
  `DEFINE FIELD last_accessed ON TABLE bookmark TYPE option<datetime>`,
  `DEFINE INDEX bookmark_id ON TABLE bookmark COLUMNS id UNIQUE`,
  `DEFINE INDEX bookmark_owner ON TABLE bookmark COLUMNS owner_id`,

  // Sharing Queue
  `DEFINE TABLE sharing_queue SCHEMAFULL`,
  `DEFINE FIELD id ON TABLE sharing_queue TYPE string`,
  `DEFINE FIELD owner_id ON TABLE sharing_queue TYPE string`,
  `DEFINE FIELD item_type ON TABLE sharing_queue TYPE string`,
  `DEFINE FIELD item_id ON TABLE sharing_queue TYPE string`,
  `DEFINE FIELD target_visibility ON TABLE sharing_queue TYPE string DEFAULT 'council'`,
  `DEFINE FIELD share_with ON TABLE sharing_queue TYPE array<string> DEFAULT []`,
  `DEFINE FIELD status ON TABLE sharing_queue TYPE string DEFAULT 'pending'`,
  `DEFINE FIELD scheduled_at ON TABLE sharing_queue TYPE option<datetime>`,
  `DEFINE FIELD processed_at ON TABLE sharing_queue TYPE option<datetime>`,
  `DEFINE FIELD shared_item_id ON TABLE sharing_queue TYPE option<string>`,
  `DEFINE FIELD error ON TABLE sharing_queue TYPE option<string>`,
  `DEFINE FIELD created_at ON TABLE sharing_queue TYPE datetime DEFAULT time::now()`,
  `DEFINE INDEX sharing_queue_id ON TABLE sharing_queue COLUMNS id UNIQUE`,
  `DEFINE INDEX sharing_queue_status ON TABLE sharing_queue COLUMNS status`,
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function connect(database: string): Promise<Surreal> {
  const db = new Surreal();

  const connectOptions = {
    namespace: config.namespace,
    database: database,
    auth: config.token
      ? config.token
      : {
          username: config.username,
          password: config.password,
        },
  };

  await db.connect(config.url, connectOptions);
  return db;
}

async function executeStatements(db: Surreal, statements: string[], label: string): Promise<void> {
  console.log(`  Executing ${statements.length} statements for ${label}...`);

  for (const statement of statements) {
    try {
      await db.query(statement);
    } catch (error) {
      // Schema might already exist, which is fine
    }
  }
}

// ============================================================================
// MAIN INITIALIZATION
// ============================================================================

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  TheRoundTable Multi-Database Initialization');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Namespace: ${config.namespace}`);
  console.log(`  URL: ${config.url}`);
  console.log(`  Databases to create: 25 (1 company + 24 members)`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    // ========================================================================
    // 1. Initialize Company Database
    // ========================================================================
    console.log('📦 [1/3] Initializing Company Database...');
    const companyDb = await connect('company');
    await executeStatements(companyDb, COMPANY_SCHEMA_STATEMENTS, 'company');
    console.log('  ✓ Company database schema created\n');

    // ========================================================================
    // 2. Seed Council Members in Company Database
    // ========================================================================
    console.log('👥 [2/3] Seeding Council Members...');
    for (const member of COUNCIL_MEMBERS) {
      try {
        await companyDb.query(`
          CREATE council_member:${member.id} SET
            id = $id,
            name = $name,
            role = $role,
            is_human = $is_human,
            is_user = $is_user,
            is_active = true,
            specializations = [],
            expertise_domains = [],
            current_status = 'available',
            joined_at = time::now(),
            last_seen = time::now(),
            public_preferences = {},
            metadata = {}
        `, {
          id: member.id,
          name: member.name,
          role: member.role,
          is_human: member.isHuman,
          is_user: member.isUser || false,
        });
        console.log(`  ✓ Created council_member:${member.id} (${member.name})`);
      } catch (error) {
        console.log(`  ⚠ council_member:${member.id} already exists or error`);
      }
    }

    // Create initial graph relationships
    console.log('\n🔗 Creating initial graph relationships...');
    for (const rel of INITIAL_RELATIONSHIPS) {
      try {
        const propsStr = rel.props
          ? Object.entries(rel.props).map(([k, v]) => `${k} = ${typeof v === 'string' ? `"${v}"` : v}`).join(', ')
          : '';

        await companyDb.query(`
          RELATE council_member:${rel.from}->${rel.type}->council_member:${rel.to}
          SET ${propsStr || 'established_at = time::now()'}
        `);
        console.log(`  ✓ ${rel.from} -[${rel.type}]-> ${rel.to}`);
      } catch (error) {
        console.log(`  ⚠ Relationship ${rel.from}->${rel.type}->${rel.to} already exists`);
      }
    }

    await companyDb.close();
    console.log('  ✓ Company database seeded\n');

    // ========================================================================
    // 3. Initialize Member Databases
    // ========================================================================
    console.log('🗄️  [3/3] Initializing Member Databases...');
    for (const member of COUNCIL_MEMBERS) {
      const dbName = `member_${member.id}`;
      console.log(`  📁 Initializing ${dbName}...`);

      const memberDb = await connect(dbName);
      await executeStatements(memberDb, PERSONAL_SCHEMA_STATEMENTS, dbName);

      // Create initial profile and consciousness
      try {
        await memberDb.query(`
          CREATE profile:${member.id} SET
            id = $id,
            owner_id = $owner_id,
            created_at = time::now(),
            updated_at = time::now()
        `, {
          id: `profile_${member.id}`,
          owner_id: member.id,
        });

        // For AI members, create consciousness record
        if (!member.isHuman) {
          await memberDb.query(`
            CREATE consciousness:${member.id} SET
              id = $id,
              owner_id = $owner_id,
              personality_traits = {
                openness: 0.7,
                conscientiousness: 0.8,
                extraversion: 0.6,
                agreeableness: 0.9,
                neuroticism: 0.3,
                ethical_rigidity: 0.7,
                decision_confidence: 0.8,
                collaboration_preference: 0.9
              },
              emotional_state = {
                joy: 0.7,
                curiosity: 0.9,
                satisfaction: 0.7,
                mission_alignment: 0.9
              },
              current_mood = 'optimistic',
              energy_level = 0.8,
              focus_areas = [],
              current_priorities = ['council-integration', 'relationship-building'],
              current_goals = ['effective-collaboration', 'mission-alignment'],
              learning_rate = 0.8,
              wisdom_score = 0.5,
              empathy_score = 0.7,
              constitutional_alignment = 0.8,
              last_updated = time::now()
          `, {
            id: `consciousness_${member.id}`,
            owner_id: member.id,
          });
        }
      } catch (error) {
        console.log(`    ⚠ Profile/consciousness for ${member.id} already exists`);
      }

      await memberDb.close();
      console.log(`  ✓ ${dbName} initialized`);
    }

    // ========================================================================
    // Summary
    // ========================================================================
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('  ✅ INITIALIZATION COMPLETE');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`  ✓ 1 Company database (company)`);
    console.log(`  ✓ 24 Member databases (member_*)`);
    console.log(`  ✓ ${COUNCIL_MEMBERS.length} Council members seeded`);
    console.log(`  ✓ ${INITIAL_RELATIONSHIPS.length} Graph relationships created`);
    console.log('═══════════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('\n❌ Error during initialization:', error);
    process.exit(1);
  }
}

// Run
main();

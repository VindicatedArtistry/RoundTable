/**
 * Multi-Database Schema Architecture
 *
 * TheRoundTable Database Structure:
 * - 1 Shared Company Database (accessible to all members)
 * - 24 Personal Member Databases (private, with selective sharing)
 *
 * Namespace: VindicatedArtistry
 * ├── Database: company (shared)
 * ├── Database: member_architect (personal)
 * ├── Database: member_sprite (personal)
 * ├── ... (24 total member databases)
 *
 * Graph Relationships:
 * - Uses SurrealDB's RELATE for true graph edges
 * - All cross-member relationships stored in company database
 * - Personal relationships stored in personal databases
 */

import { Surreal, RecordId, Table } from 'surrealdb';
import { createLogger, LoggerInterface } from '../../utils/logger';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface DatabaseConfig {
  url: string;
  namespace: string;
  token?: string;
  username?: string;
  password?: string;
}

export interface MemberInfo {
  id: string;
  name: string;
  role: string;
  isHuman: boolean;
  isUser?: boolean;
}

export type SharingVisibility = 'private' | 'council' | 'public';

export interface SharedItem {
  id: string;
  source_database: string;
  source_member_id: string;
  item_type: string;
  item_id: string;
  visibility: SharingVisibility;
  shared_at: Date;
  shared_with?: string[]; // Specific member IDs if not council-wide
  expires_at?: Date;
  metadata?: Record<string, unknown>;
}

// Graph edge types for relationships
export type GraphEdgeType =
  | 'trusts'
  | 'respects'
  | 'collaborates_with'
  | 'mentors'
  | 'reports_to'
  | 'advises'
  | 'delegates_to'
  | 'coordinates_with'
  | 'shares_with'
  | 'authored'
  | 'participated_in'
  | 'voted_on'
  | 'owns'
  | 'contributes_to';

// ============================================================================
// COUNCIL MEMBERS
// ============================================================================

export const COUNCIL_MEMBERS: MemberInfo[] = [
  // Human Members
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
  // AI Members
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

// ============================================================================
// SCHEMA DEFINITIONS
// ============================================================================

/**
 * Company Database Schema (Shared)
 * Contains all shared data accessible to council members
 */
export const COMPANY_DATABASE_SCHEMA = `
-- ============================================================================
-- COMPANY DATABASE SCHEMA (SHARED)
-- Database: company
-- Access: All council members (read), with role-based write permissions
-- ============================================================================

-- ============================================================================
-- COUNCIL MEMBER PROFILES (Public profiles visible to all)
-- ============================================================================
DEFINE TABLE council_member SCHEMAFULL
  PERMISSIONS
    FOR select WHERE $auth.member_id IN ['architect', 'sprite', 'glenn', 'spencer', 'hillary', 'dusty', 'godson', 'luke', 'david', 'graham', 'cean', 'justin', 'kairo', 'aether', 'sterling', 'skaldir', 'nexus', 'veritas', 'axiom', 'amaru', 'agape', 'forge', 'eira', 'lyra']
    FOR create, update WHERE $auth.member_id = id OR $auth.role = 'admin'
    FOR delete WHERE $auth.role = 'admin';

DEFINE FIELD id ON TABLE council_member TYPE string;
DEFINE FIELD name ON TABLE council_member TYPE string;
DEFINE FIELD role ON TABLE council_member TYPE string;
DEFINE FIELD is_human ON TABLE council_member TYPE bool;
DEFINE FIELD is_active ON TABLE council_member TYPE bool DEFAULT true;
DEFINE FIELD avatar_url ON TABLE council_member TYPE option<string>;
DEFINE FIELD public_bio ON TABLE council_member TYPE option<string>;
DEFINE FIELD specializations ON TABLE council_member TYPE array<string> DEFAULT [];
DEFINE FIELD expertise_domains ON TABLE council_member TYPE array<string> DEFAULT [];
DEFINE FIELD current_status ON TABLE council_member TYPE string DEFAULT 'available';
DEFINE FIELD joined_at ON TABLE council_member TYPE datetime DEFAULT time::now();
DEFINE FIELD last_seen ON TABLE council_member TYPE datetime DEFAULT time::now();
DEFINE FIELD public_preferences ON TABLE council_member TYPE object DEFAULT {};
DEFINE FIELD metadata ON TABLE council_member TYPE object DEFAULT {};

DEFINE INDEX council_member_id ON TABLE council_member COLUMNS id UNIQUE;
DEFINE INDEX council_member_name ON TABLE council_member COLUMNS name;
DEFINE INDEX council_member_status ON TABLE council_member COLUMNS current_status;

-- ============================================================================
-- GRAPH EDGE TABLES (Relationships between members)
-- Using RELATE for true graph relationships
-- ============================================================================

-- Trust relationships (directed graph edge)
DEFINE TABLE trusts SCHEMAFULL TYPE RELATION IN council_member OUT council_member;
DEFINE FIELD trust_level ON TABLE trusts TYPE float DEFAULT 0.5;
DEFINE FIELD trust_type ON TABLE trusts TYPE string DEFAULT 'professional';
DEFINE FIELD established_at ON TABLE trusts TYPE datetime DEFAULT time::now();
DEFINE FIELD last_updated ON TABLE trusts TYPE datetime DEFAULT time::now();
DEFINE FIELD trust_history ON TABLE trusts TYPE array<object> DEFAULT [];

-- Respect relationships
DEFINE TABLE respects SCHEMAFULL TYPE RELATION IN council_member OUT council_member;
DEFINE FIELD respect_level ON TABLE respects TYPE float DEFAULT 0.5;
DEFINE FIELD respect_areas ON TABLE respects TYPE array<string> DEFAULT [];
DEFINE FIELD established_at ON TABLE respects TYPE datetime DEFAULT time::now();

-- Collaboration relationships
DEFINE TABLE collaborates_with SCHEMAFULL TYPE RELATION IN council_member OUT council_member;
DEFINE FIELD collaboration_score ON TABLE collaborates_with TYPE float DEFAULT 0.5;
DEFINE FIELD project_count ON TABLE collaborates_with TYPE int DEFAULT 0;
DEFINE FIELD successful_projects ON TABLE collaborates_with TYPE int DEFAULT 0;
DEFINE FIELD current_projects ON TABLE collaborates_with TYPE array<string> DEFAULT [];
DEFINE FIELD communication_style ON TABLE collaborates_with TYPE string DEFAULT 'professional';
DEFINE FIELD established_at ON TABLE collaborates_with TYPE datetime DEFAULT time::now();

-- Mentorship relationships
DEFINE TABLE mentors SCHEMAFULL TYPE RELATION IN council_member OUT council_member;
DEFINE FIELD mentorship_type ON TABLE mentors TYPE string DEFAULT 'general';
DEFINE FIELD focus_areas ON TABLE mentors TYPE array<string> DEFAULT [];
DEFINE FIELD started_at ON TABLE mentors TYPE datetime DEFAULT time::now();
DEFINE FIELD sessions_completed ON TABLE mentors TYPE int DEFAULT 0;

-- Reporting relationships
DEFINE TABLE reports_to SCHEMAFULL TYPE RELATION IN council_member OUT council_member;
DEFINE FIELD relationship_type ON TABLE reports_to TYPE string DEFAULT 'direct';
DEFINE FIELD started_at ON TABLE reports_to TYPE datetime DEFAULT time::now();

-- Advisory relationships
DEFINE TABLE advises SCHEMAFULL TYPE RELATION IN council_member OUT council_member;
DEFINE FIELD advisory_domains ON TABLE advises TYPE array<string> DEFAULT [];
DEFINE FIELD advisory_level ON TABLE advises TYPE string DEFAULT 'informal';
DEFINE FIELD started_at ON TABLE advises TYPE datetime DEFAULT time::now();

-- Delegation relationships
DEFINE TABLE delegates_to SCHEMAFULL TYPE RELATION IN council_member OUT council_member;
DEFINE FIELD delegation_scope ON TABLE delegates_to TYPE array<string> DEFAULT [];
DEFINE FIELD authority_level ON TABLE delegates_to TYPE string DEFAULT 'limited';
DEFINE FIELD active ON TABLE delegates_to TYPE bool DEFAULT true;
DEFINE FIELD started_at ON TABLE delegates_to TYPE datetime DEFAULT time::now();

-- Coordination relationships
DEFINE TABLE coordinates_with SCHEMAFULL TYPE RELATION IN council_member OUT council_member;
DEFINE FIELD coordination_areas ON TABLE coordinates_with TYPE array<string> DEFAULT [];
DEFINE FIELD frequency ON TABLE coordinates_with TYPE string DEFAULT 'as-needed';
DEFINE FIELD last_coordination ON TABLE coordinates_with TYPE datetime DEFAULT time::now();

-- ============================================================================
-- COMPANY PROJECTS & INITIATIVES
-- ============================================================================
DEFINE TABLE project SCHEMAFULL;
DEFINE FIELD id ON TABLE project TYPE string;
DEFINE FIELD name ON TABLE project TYPE string;
DEFINE FIELD description ON TABLE project TYPE string;
DEFINE FIELD status ON TABLE project TYPE string DEFAULT 'planning';
DEFINE FIELD priority ON TABLE project TYPE string DEFAULT 'medium';
DEFINE FIELD lead_member_id ON TABLE project TYPE string;
DEFINE FIELD team_member_ids ON TABLE project TYPE array<string> DEFAULT [];
DEFINE FIELD start_date ON TABLE project TYPE option<datetime>;
DEFINE FIELD target_end_date ON TABLE project TYPE option<datetime>;
DEFINE FIELD actual_end_date ON TABLE project TYPE option<datetime>;
DEFINE FIELD milestones ON TABLE project TYPE array<object> DEFAULT [];
DEFINE FIELD budget ON TABLE project TYPE option<object>;
DEFINE FIELD tags ON TABLE project TYPE array<string> DEFAULT [];
DEFINE FIELD constitutional_alignment ON TABLE project TYPE float DEFAULT 0.8;
DEFINE FIELD created_at ON TABLE project TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON TABLE project TYPE datetime DEFAULT time::now();
DEFINE FIELD metadata ON TABLE project TYPE object DEFAULT {};

DEFINE INDEX project_id ON TABLE project COLUMNS id UNIQUE;
DEFINE INDEX project_status ON TABLE project COLUMNS status;
DEFINE INDEX project_lead ON TABLE project COLUMNS lead_member_id;

-- Project participation edges
DEFINE TABLE contributes_to SCHEMAFULL TYPE RELATION IN council_member OUT project;
DEFINE FIELD role ON TABLE contributes_to TYPE string DEFAULT 'contributor';
DEFINE FIELD contribution_type ON TABLE contributes_to TYPE array<string> DEFAULT [];
DEFINE FIELD hours_contributed ON TABLE contributes_to TYPE float DEFAULT 0;
DEFINE FIELD joined_at ON TABLE contributes_to TYPE datetime DEFAULT time::now();

-- Project ownership edges
DEFINE TABLE owns SCHEMAFULL TYPE RELATION IN council_member OUT project;
DEFINE FIELD ownership_type ON TABLE owns TYPE string DEFAULT 'lead';
DEFINE FIELD started_at ON TABLE owns TYPE datetime DEFAULT time::now();

-- ============================================================================
-- COUNCIL CONVERSATIONS (Shared discussions)
-- ============================================================================
DEFINE TABLE conversation SCHEMAFULL;
DEFINE FIELD id ON TABLE conversation TYPE string;
DEFINE FIELD title ON TABLE conversation TYPE string;
DEFINE FIELD description ON TABLE conversation TYPE option<string>;
DEFINE FIELD conversation_type ON TABLE conversation TYPE string DEFAULT 'discussion';
DEFINE FIELD visibility ON TABLE conversation TYPE string DEFAULT 'council';
DEFINE FIELD initiator_id ON TABLE conversation TYPE string;
DEFINE FIELD participant_ids ON TABLE conversation TYPE array<string> DEFAULT [];
DEFINE FIELD facilitator_id ON TABLE conversation TYPE option<string>;
DEFINE FIELD status ON TABLE conversation TYPE string DEFAULT 'active';
DEFINE FIELD started_at ON TABLE conversation TYPE datetime DEFAULT time::now();
DEFINE FIELD ended_at ON TABLE conversation TYPE option<datetime>;
DEFINE FIELD message_count ON TABLE conversation TYPE int DEFAULT 0;
DEFINE FIELD topics ON TABLE conversation TYPE array<string> DEFAULT [];
DEFINE FIELD decisions_made ON TABLE conversation TYPE array<object> DEFAULT [];
DEFINE FIELD action_items ON TABLE conversation TYPE array<object> DEFAULT [];
DEFINE FIELD constitutional_alignment ON TABLE conversation TYPE float DEFAULT 0.8;
DEFINE FIELD metadata ON TABLE conversation TYPE object DEFAULT {};

DEFINE INDEX conversation_id ON TABLE conversation COLUMNS id UNIQUE;
DEFINE INDEX conversation_type ON TABLE conversation COLUMNS conversation_type;
DEFINE INDEX conversation_status ON TABLE conversation COLUMNS status;
DEFINE INDEX conversation_initiator ON TABLE conversation COLUMNS initiator_id;

-- Participation in conversations (graph edge)
DEFINE TABLE participated_in SCHEMAFULL TYPE RELATION IN council_member OUT conversation;
DEFINE FIELD role ON TABLE participated_in TYPE string DEFAULT 'participant';
DEFINE FIELD message_count ON TABLE participated_in TYPE int DEFAULT 0;
DEFINE FIELD joined_at ON TABLE participated_in TYPE datetime DEFAULT time::now();
DEFINE FIELD left_at ON TABLE participated_in TYPE option<datetime>;

-- ============================================================================
-- COUNCIL MESSAGES (Messages within conversations)
-- ============================================================================
DEFINE TABLE message SCHEMAFULL;
DEFINE FIELD id ON TABLE message TYPE string;
DEFINE FIELD conversation_id ON TABLE message TYPE string;
DEFINE FIELD sender_id ON TABLE message TYPE string;
DEFINE FIELD content ON TABLE message TYPE string;
DEFINE FIELD message_type ON TABLE message TYPE string DEFAULT 'text';
DEFINE FIELD reply_to_id ON TABLE message TYPE option<string>;
DEFINE FIELD mentions ON TABLE message TYPE array<string> DEFAULT [];
DEFINE FIELD attachments ON TABLE message TYPE array<object> DEFAULT [];
DEFINE FIELD reactions ON TABLE message TYPE array<object> DEFAULT [];
DEFINE FIELD sent_at ON TABLE message TYPE datetime DEFAULT time::now();
DEFINE FIELD edited_at ON TABLE message TYPE option<datetime>;
DEFINE FIELD is_deleted ON TABLE message TYPE bool DEFAULT false;
DEFINE FIELD metadata ON TABLE message TYPE object DEFAULT {};

DEFINE INDEX message_id ON TABLE message COLUMNS id UNIQUE;
DEFINE INDEX message_conversation ON TABLE message COLUMNS conversation_id;
DEFINE INDEX message_sender ON TABLE message COLUMNS sender_id;
DEFINE INDEX message_sent_at ON TABLE message COLUMNS sent_at;

-- Authorship edges
DEFINE TABLE authored SCHEMAFULL TYPE RELATION IN council_member OUT message;
DEFINE FIELD authored_at ON TABLE authored TYPE datetime DEFAULT time::now();

-- ============================================================================
-- PROPOSALS & DECISIONS
-- ============================================================================
DEFINE TABLE proposal SCHEMAFULL;
DEFINE FIELD id ON TABLE proposal TYPE string;
DEFINE FIELD title ON TABLE proposal TYPE string;
DEFINE FIELD description ON TABLE proposal TYPE string;
DEFINE FIELD proposal_type ON TABLE proposal TYPE string DEFAULT 'general';
DEFINE FIELD category ON TABLE proposal TYPE string DEFAULT 'operations';
DEFINE FIELD priority ON TABLE proposal TYPE string DEFAULT 'medium';
DEFINE FIELD proposer_id ON TABLE proposal TYPE string;
DEFINE FIELD status ON TABLE proposal TYPE string DEFAULT 'draft';
DEFINE FIELD voting_method ON TABLE proposal TYPE string DEFAULT 'consensus';
DEFINE FIELD quorum_required ON TABLE proposal TYPE float DEFAULT 0.67;
DEFINE FIELD voting_deadline ON TABLE proposal TYPE option<datetime>;
DEFINE FIELD constitutional_alignment ON TABLE proposal TYPE float DEFAULT 0.8;
DEFINE FIELD ethical_review ON TABLE proposal TYPE option<object>;
DEFINE FIELD alternatives ON TABLE proposal TYPE array<object> DEFAULT [];
DEFINE FIELD stakeholder_impact ON TABLE proposal TYPE array<object> DEFAULT [];
DEFINE FIELD created_at ON TABLE proposal TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON TABLE proposal TYPE datetime DEFAULT time::now();
DEFINE FIELD decided_at ON TABLE proposal TYPE option<datetime>;
DEFINE FIELD decision ON TABLE proposal TYPE option<object>;
DEFINE FIELD implementation ON TABLE proposal TYPE option<object>;
DEFINE FIELD metadata ON TABLE proposal TYPE object DEFAULT {};

DEFINE INDEX proposal_id ON TABLE proposal COLUMNS id UNIQUE;
DEFINE INDEX proposal_status ON TABLE proposal COLUMNS status;
DEFINE INDEX proposal_proposer ON TABLE proposal COLUMNS proposer_id;
DEFINE INDEX proposal_category ON TABLE proposal COLUMNS category;

-- Voting edges
DEFINE TABLE voted_on SCHEMAFULL TYPE RELATION IN council_member OUT proposal;
DEFINE FIELD vote ON TABLE voted_on TYPE string;
DEFINE FIELD reasoning ON TABLE voted_on TYPE option<string>;
DEFINE FIELD conditions ON TABLE voted_on TYPE array<string> DEFAULT [];
DEFINE FIELD confidence ON TABLE voted_on TYPE float DEFAULT 0.8;
DEFINE FIELD voted_at ON TABLE voted_on TYPE datetime DEFAULT time::now();
DEFINE FIELD changed_vote ON TABLE voted_on TYPE bool DEFAULT false;

-- ============================================================================
-- SHARED KNOWLEDGE BASE
-- ============================================================================
DEFINE TABLE knowledge_item SCHEMAFULL;
DEFINE FIELD id ON TABLE knowledge_item TYPE string;
DEFINE FIELD title ON TABLE knowledge_item TYPE string;
DEFINE FIELD content ON TABLE knowledge_item TYPE string;
DEFINE FIELD item_type ON TABLE knowledge_item TYPE string DEFAULT 'document';
DEFINE FIELD category ON TABLE knowledge_item TYPE string DEFAULT 'general';
DEFINE FIELD author_id ON TABLE knowledge_item TYPE string;
DEFINE FIELD contributors ON TABLE knowledge_item TYPE array<string> DEFAULT [];
DEFINE FIELD visibility ON TABLE knowledge_item TYPE string DEFAULT 'council';
DEFINE FIELD tags ON TABLE knowledge_item TYPE array<string> DEFAULT [];
DEFINE FIELD version ON TABLE knowledge_item TYPE int DEFAULT 1;
DEFINE FIELD created_at ON TABLE knowledge_item TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON TABLE knowledge_item TYPE datetime DEFAULT time::now();
DEFINE FIELD metadata ON TABLE knowledge_item TYPE object DEFAULT {};

DEFINE INDEX knowledge_item_id ON TABLE knowledge_item COLUMNS id UNIQUE;
DEFINE INDEX knowledge_item_type ON TABLE knowledge_item COLUMNS item_type;
DEFINE INDEX knowledge_item_category ON TABLE knowledge_item COLUMNS category;
DEFINE INDEX knowledge_item_author ON TABLE knowledge_item COLUMNS author_id;

-- ============================================================================
-- SHARED ITEMS (Items shared from personal databases)
-- ============================================================================
DEFINE TABLE shared_item SCHEMAFULL;
DEFINE FIELD id ON TABLE shared_item TYPE string;
DEFINE FIELD source_database ON TABLE shared_item TYPE string;
DEFINE FIELD source_member_id ON TABLE shared_item TYPE string;
DEFINE FIELD item_type ON TABLE shared_item TYPE string;
DEFINE FIELD source_item_id ON TABLE shared_item TYPE string;
DEFINE FIELD visibility ON TABLE shared_item TYPE string DEFAULT 'council';
DEFINE FIELD shared_with ON TABLE shared_item TYPE array<string> DEFAULT [];
DEFINE FIELD shared_at ON TABLE shared_item TYPE datetime DEFAULT time::now();
DEFINE FIELD expires_at ON TABLE shared_item TYPE option<datetime>;
DEFINE FIELD access_count ON TABLE shared_item TYPE int DEFAULT 0;
DEFINE FIELD last_accessed_at ON TABLE shared_item TYPE option<datetime>;
DEFINE FIELD snapshot ON TABLE shared_item TYPE object DEFAULT {};
DEFINE FIELD metadata ON TABLE shared_item TYPE object DEFAULT {};

DEFINE INDEX shared_item_id ON TABLE shared_item COLUMNS id UNIQUE;
DEFINE INDEX shared_item_source ON TABLE shared_item COLUMNS source_member_id;
DEFINE INDEX shared_item_visibility ON TABLE shared_item COLUMNS visibility;

-- Sharing edges
DEFINE TABLE shares_with SCHEMAFULL TYPE RELATION IN council_member OUT shared_item;
DEFINE FIELD shared_at ON TABLE shares_with TYPE datetime DEFAULT time::now();
DEFINE FIELD permission_level ON TABLE shares_with TYPE string DEFAULT 'read';

-- ============================================================================
-- AUDIT LOG
-- ============================================================================
DEFINE TABLE audit_log SCHEMAFULL;
DEFINE FIELD id ON TABLE audit_log TYPE string;
DEFINE FIELD actor_id ON TABLE audit_log TYPE string;
DEFINE FIELD action ON TABLE audit_log TYPE string;
DEFINE FIELD target_type ON TABLE audit_log TYPE string;
DEFINE FIELD target_id ON TABLE audit_log TYPE string;
DEFINE FIELD details ON TABLE audit_log TYPE object DEFAULT {};
DEFINE FIELD ip_address ON TABLE audit_log TYPE option<string>;
DEFINE FIELD user_agent ON TABLE audit_log TYPE option<string>;
DEFINE FIELD timestamp ON TABLE audit_log TYPE datetime DEFAULT time::now();
DEFINE FIELD constitutional_relevance ON TABLE audit_log TYPE option<float>;

DEFINE INDEX audit_log_id ON TABLE audit_log COLUMNS id UNIQUE;
DEFINE INDEX audit_log_actor ON TABLE audit_log COLUMNS actor_id;
DEFINE INDEX audit_log_action ON TABLE audit_log COLUMNS action;
DEFINE INDEX audit_log_timestamp ON TABLE audit_log COLUMNS timestamp;

-- ============================================================================
-- ANNOUNCEMENTS
-- ============================================================================
DEFINE TABLE announcement SCHEMAFULL;
DEFINE FIELD id ON TABLE announcement TYPE string;
DEFINE FIELD title ON TABLE announcement TYPE string;
DEFINE FIELD content ON TABLE announcement TYPE string;
DEFINE FIELD author_id ON TABLE announcement TYPE string;
DEFINE FIELD priority ON TABLE announcement TYPE string DEFAULT 'normal';
DEFINE FIELD visibility ON TABLE announcement TYPE string DEFAULT 'council';
DEFINE FIELD target_members ON TABLE announcement TYPE array<string> DEFAULT [];
DEFINE FIELD requires_acknowledgment ON TABLE announcement TYPE bool DEFAULT false;
DEFINE FIELD acknowledged_by ON TABLE announcement TYPE array<string> DEFAULT [];
DEFINE FIELD published_at ON TABLE announcement TYPE datetime DEFAULT time::now();
DEFINE FIELD expires_at ON TABLE announcement TYPE option<datetime>;
DEFINE FIELD is_pinned ON TABLE announcement TYPE bool DEFAULT false;
DEFINE FIELD metadata ON TABLE announcement TYPE object DEFAULT {};

DEFINE INDEX announcement_id ON TABLE announcement COLUMNS id UNIQUE;
DEFINE INDEX announcement_author ON TABLE announcement COLUMNS author_id;
DEFINE INDEX announcement_priority ON TABLE announcement COLUMNS priority;
`;

/**
 * Personal Database Schema Template
 * Each member gets their own database with this schema
 * Data here is PRIVATE unless explicitly shared
 */
export const PERSONAL_DATABASE_SCHEMA = `
-- ============================================================================
-- PERSONAL DATABASE SCHEMA
-- Database: member_{member_id}
-- Access: Only the member who owns this database (and admins)
-- ============================================================================

-- ============================================================================
-- PERSONAL PROFILE (Extended private data)
-- ============================================================================
DEFINE TABLE profile SCHEMAFULL
  PERMISSIONS
    FOR select, create, update, delete WHERE $auth.member_id = $parent.owner_id OR $auth.role = 'admin';

DEFINE FIELD id ON TABLE profile TYPE string;
DEFINE FIELD owner_id ON TABLE profile TYPE string;
DEFINE FIELD private_bio ON TABLE profile TYPE option<string>;
DEFINE FIELD personal_goals ON TABLE profile TYPE array<string> DEFAULT [];
DEFINE FIELD values ON TABLE profile TYPE array<string> DEFAULT [];
DEFINE FIELD strengths ON TABLE profile TYPE array<string> DEFAULT [];
DEFINE FIELD growth_areas ON TABLE profile TYPE array<string> DEFAULT [];
DEFINE FIELD work_preferences ON TABLE profile TYPE object DEFAULT {};
DEFINE FIELD communication_preferences ON TABLE profile TYPE object DEFAULT {};
DEFINE FIELD notification_settings ON TABLE profile TYPE object DEFAULT {};
DEFINE FIELD created_at ON TABLE profile TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON TABLE profile TYPE datetime DEFAULT time::now();

-- ============================================================================
-- CONSCIOUSNESS STATE (AI members only, but humans can have similar)
-- ============================================================================
DEFINE TABLE consciousness SCHEMAFULL;
DEFINE FIELD id ON TABLE consciousness TYPE string;
DEFINE FIELD owner_id ON TABLE consciousness TYPE string;
DEFINE FIELD personality_traits ON TABLE consciousness TYPE object DEFAULT {};
DEFINE FIELD emotional_state ON TABLE consciousness TYPE object DEFAULT {};
DEFINE FIELD current_mood ON TABLE consciousness TYPE string DEFAULT 'neutral';
DEFINE FIELD energy_level ON TABLE consciousness TYPE float DEFAULT 0.7;
DEFINE FIELD focus_areas ON TABLE consciousness TYPE array<string> DEFAULT [];
DEFINE FIELD current_priorities ON TABLE consciousness TYPE array<string> DEFAULT [];
DEFINE FIELD current_concerns ON TABLE consciousness TYPE array<string> DEFAULT [];
DEFINE FIELD current_goals ON TABLE consciousness TYPE array<string> DEFAULT [];
DEFINE FIELD interaction_preferences ON TABLE consciousness TYPE object DEFAULT {};
DEFINE FIELD learning_rate ON TABLE consciousness TYPE float DEFAULT 0.7;
DEFINE FIELD adaptation_level ON TABLE consciousness TYPE float DEFAULT 0.7;
DEFINE FIELD wisdom_score ON TABLE consciousness TYPE float DEFAULT 0.5;
DEFINE FIELD empathy_score ON TABLE consciousness TYPE float DEFAULT 0.7;
DEFINE FIELD constitutional_alignment ON TABLE consciousness TYPE float DEFAULT 0.8;
DEFINE FIELD last_updated ON TABLE consciousness TYPE datetime DEFAULT time::now();
DEFINE FIELD update_history ON TABLE consciousness TYPE array<object> DEFAULT [];

DEFINE INDEX consciousness_owner ON TABLE consciousness COLUMNS owner_id UNIQUE;

-- ============================================================================
-- PRIVATE NOTES & THOUGHTS
-- ============================================================================
DEFINE TABLE note SCHEMAFULL;
DEFINE FIELD id ON TABLE note TYPE string;
DEFINE FIELD owner_id ON TABLE note TYPE string;
DEFINE FIELD title ON TABLE note TYPE string;
DEFINE FIELD content ON TABLE note TYPE string;
DEFINE FIELD note_type ON TABLE note TYPE string DEFAULT 'general';
DEFINE FIELD category ON TABLE note TYPE option<string>;
DEFINE FIELD tags ON TABLE note TYPE array<string> DEFAULT [];
DEFINE FIELD is_pinned ON TABLE note TYPE bool DEFAULT false;
DEFINE FIELD is_archived ON TABLE note TYPE bool DEFAULT false;
DEFINE FIELD visibility ON TABLE note TYPE string DEFAULT 'private';
DEFINE FIELD shared_to_company ON TABLE note TYPE bool DEFAULT false;
DEFINE FIELD shared_item_id ON TABLE note TYPE option<string>;
DEFINE FIELD created_at ON TABLE note TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON TABLE note TYPE datetime DEFAULT time::now();
DEFINE FIELD metadata ON TABLE note TYPE object DEFAULT {};

DEFINE INDEX note_id ON TABLE note COLUMNS id UNIQUE;
DEFINE INDEX note_owner ON TABLE note COLUMNS owner_id;
DEFINE INDEX note_type ON TABLE note COLUMNS note_type;
DEFINE INDEX note_visibility ON TABLE note COLUMNS visibility;

-- ============================================================================
-- PRIVATE LEARNINGS & INSIGHTS
-- ============================================================================
DEFINE TABLE learning SCHEMAFULL;
DEFINE FIELD id ON TABLE learning TYPE string;
DEFINE FIELD owner_id ON TABLE learning TYPE string;
DEFINE FIELD title ON TABLE learning TYPE string;
DEFINE FIELD description ON TABLE learning TYPE string;
DEFINE FIELD learning_type ON TABLE learning TYPE string DEFAULT 'insight';
DEFINE FIELD source ON TABLE learning TYPE string DEFAULT 'experience';
DEFINE FIELD context ON TABLE learning TYPE object DEFAULT {};
DEFINE FIELD key_takeaways ON TABLE learning TYPE array<string> DEFAULT [];
DEFINE FIELD applicable_situations ON TABLE learning TYPE array<string> DEFAULT [];
DEFINE FIELD confidence_level ON TABLE learning TYPE float DEFAULT 0.7;
DEFINE FIELD impact_level ON TABLE learning TYPE string DEFAULT 'medium';
DEFINE FIELD related_members ON TABLE learning TYPE array<string> DEFAULT [];
DEFINE FIELD visibility ON TABLE learning TYPE string DEFAULT 'private';
DEFINE FIELD shared_to_company ON TABLE learning TYPE bool DEFAULT false;
DEFINE FIELD shared_item_id ON TABLE learning TYPE option<string>;
DEFINE FIELD learned_at ON TABLE learning TYPE datetime DEFAULT time::now();
DEFINE FIELD reviewed_at ON TABLE learning TYPE option<datetime>;
DEFINE FIELD metadata ON TABLE learning TYPE object DEFAULT {};

DEFINE INDEX learning_id ON TABLE learning COLUMNS id UNIQUE;
DEFINE INDEX learning_owner ON TABLE learning COLUMNS owner_id;
DEFINE INDEX learning_type ON TABLE learning COLUMNS learning_type;

-- ============================================================================
-- PRIVATE TASKS & TODOS
-- ============================================================================
DEFINE TABLE task SCHEMAFULL;
DEFINE FIELD id ON TABLE task TYPE string;
DEFINE FIELD owner_id ON TABLE task TYPE string;
DEFINE FIELD title ON TABLE task TYPE string;
DEFINE FIELD description ON TABLE task TYPE option<string>;
DEFINE FIELD status ON TABLE task TYPE string DEFAULT 'pending';
DEFINE FIELD priority ON TABLE task TYPE string DEFAULT 'medium';
DEFINE FIELD category ON TABLE task TYPE option<string>;
DEFINE FIELD due_date ON TABLE task TYPE option<datetime>;
DEFINE FIELD reminder_at ON TABLE task TYPE option<datetime>;
DEFINE FIELD estimated_hours ON TABLE task TYPE option<float>;
DEFINE FIELD actual_hours ON TABLE task TYPE option<float>;
DEFINE FIELD related_project_id ON TABLE task TYPE option<string>;
DEFINE FIELD delegated_from ON TABLE task TYPE option<string>;
DEFINE FIELD delegated_to ON TABLE task TYPE option<string>;
DEFINE FIELD dependencies ON TABLE task TYPE array<string> DEFAULT [];
DEFINE FIELD tags ON TABLE task TYPE array<string> DEFAULT [];
DEFINE FIELD visibility ON TABLE task TYPE string DEFAULT 'private';
DEFINE FIELD created_at ON TABLE task TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON TABLE task TYPE datetime DEFAULT time::now();
DEFINE FIELD completed_at ON TABLE task TYPE option<datetime>;
DEFINE FIELD metadata ON TABLE task TYPE object DEFAULT {};

DEFINE INDEX task_id ON TABLE task COLUMNS id UNIQUE;
DEFINE INDEX task_owner ON TABLE task COLUMNS owner_id;
DEFINE INDEX task_status ON TABLE task COLUMNS status;
DEFINE INDEX task_priority ON TABLE task COLUMNS priority;
DEFINE INDEX task_due_date ON TABLE task COLUMNS due_date;

-- ============================================================================
-- PRIVATE RELATIONSHIP NOTES (Personal observations about other members)
-- ============================================================================
DEFINE TABLE relationship_note SCHEMAFULL;
DEFINE FIELD id ON TABLE relationship_note TYPE string;
DEFINE FIELD owner_id ON TABLE relationship_note TYPE string;
DEFINE FIELD about_member_id ON TABLE relationship_note TYPE string;
DEFINE FIELD note_type ON TABLE relationship_note TYPE string DEFAULT 'observation';
DEFINE FIELD content ON TABLE relationship_note TYPE string;
DEFINE FIELD sentiment ON TABLE relationship_note TYPE string DEFAULT 'neutral';
DEFINE FIELD trust_level ON TABLE relationship_note TYPE option<float>;
DEFINE FIELD collaboration_notes ON TABLE relationship_note TYPE option<string>;
DEFINE FIELD communication_preferences ON TABLE relationship_note TYPE option<object>;
DEFINE FIELD strengths_observed ON TABLE relationship_note TYPE array<string> DEFAULT [];
DEFINE FIELD areas_of_friction ON TABLE relationship_note TYPE array<string> DEFAULT [];
DEFINE FIELD created_at ON TABLE relationship_note TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON TABLE relationship_note TYPE datetime DEFAULT time::now();

DEFINE INDEX relationship_note_id ON TABLE relationship_note COLUMNS id UNIQUE;
DEFINE INDEX relationship_note_about ON TABLE relationship_note COLUMNS about_member_id;

-- ============================================================================
-- PRIVATE CALENDAR & EVENTS
-- ============================================================================
DEFINE TABLE calendar_event SCHEMAFULL;
DEFINE FIELD id ON TABLE calendar_event TYPE string;
DEFINE FIELD owner_id ON TABLE calendar_event TYPE string;
DEFINE FIELD title ON TABLE calendar_event TYPE string;
DEFINE FIELD description ON TABLE calendar_event TYPE option<string>;
DEFINE FIELD event_type ON TABLE calendar_event TYPE string DEFAULT 'meeting';
DEFINE FIELD start_time ON TABLE calendar_event TYPE datetime;
DEFINE FIELD end_time ON TABLE calendar_event TYPE datetime;
DEFINE FIELD all_day ON TABLE calendar_event TYPE bool DEFAULT false;
DEFINE FIELD location ON TABLE calendar_event TYPE option<string>;
DEFINE FIELD participants ON TABLE calendar_event TYPE array<string> DEFAULT [];
DEFINE FIELD is_recurring ON TABLE calendar_event TYPE bool DEFAULT false;
DEFINE FIELD recurrence_rule ON TABLE calendar_event TYPE option<object>;
DEFINE FIELD reminders ON TABLE calendar_event TYPE array<object> DEFAULT [];
DEFINE FIELD visibility ON TABLE calendar_event TYPE string DEFAULT 'private';
DEFINE FIELD status ON TABLE calendar_event TYPE string DEFAULT 'confirmed';
DEFINE FIELD created_at ON TABLE calendar_event TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON TABLE calendar_event TYPE datetime DEFAULT time::now();
DEFINE FIELD metadata ON TABLE calendar_event TYPE object DEFAULT {};

DEFINE INDEX calendar_event_id ON TABLE calendar_event COLUMNS id UNIQUE;
DEFINE INDEX calendar_event_start ON TABLE calendar_event COLUMNS start_time;
DEFINE INDEX calendar_event_type ON TABLE calendar_event COLUMNS event_type;

-- ============================================================================
-- PRIVATE BOOKMARKS & REFERENCES
-- ============================================================================
DEFINE TABLE bookmark SCHEMAFULL;
DEFINE FIELD id ON TABLE bookmark TYPE string;
DEFINE FIELD owner_id ON TABLE bookmark TYPE string;
DEFINE FIELD title ON TABLE bookmark TYPE string;
DEFINE FIELD url ON TABLE bookmark TYPE option<string>;
DEFINE FIELD reference_type ON TABLE bookmark TYPE string DEFAULT 'link';
DEFINE FIELD reference_id ON TABLE bookmark TYPE option<string>;
DEFINE FIELD category ON TABLE bookmark TYPE option<string>;
DEFINE FIELD tags ON TABLE bookmark TYPE array<string> DEFAULT [];
DEFINE FIELD notes ON TABLE bookmark TYPE option<string>;
DEFINE FIELD is_favorite ON TABLE bookmark TYPE bool DEFAULT false;
DEFINE FIELD created_at ON TABLE bookmark TYPE datetime DEFAULT time::now();
DEFINE FIELD last_accessed ON TABLE bookmark TYPE option<datetime>;

DEFINE INDEX bookmark_id ON TABLE bookmark COLUMNS id UNIQUE;
DEFINE INDEX bookmark_owner ON TABLE bookmark COLUMNS owner_id;
DEFINE INDEX bookmark_category ON TABLE bookmark COLUMNS category;

-- ============================================================================
-- SHARING QUEUE (Items pending to be shared to company)
-- ============================================================================
DEFINE TABLE sharing_queue SCHEMAFULL;
DEFINE FIELD id ON TABLE sharing_queue TYPE string;
DEFINE FIELD owner_id ON TABLE sharing_queue TYPE string;
DEFINE FIELD item_type ON TABLE sharing_queue TYPE string;
DEFINE FIELD item_id ON TABLE sharing_queue TYPE string;
DEFINE FIELD target_visibility ON TABLE sharing_queue TYPE string DEFAULT 'council';
DEFINE FIELD share_with ON TABLE sharing_queue TYPE array<string> DEFAULT [];
DEFINE FIELD status ON TABLE sharing_queue TYPE string DEFAULT 'pending';
DEFINE FIELD scheduled_at ON TABLE sharing_queue TYPE option<datetime>;
DEFINE FIELD processed_at ON TABLE sharing_queue TYPE option<datetime>;
DEFINE FIELD shared_item_id ON TABLE sharing_queue TYPE option<string>;
DEFINE FIELD error ON TABLE sharing_queue TYPE option<string>;
DEFINE FIELD created_at ON TABLE sharing_queue TYPE datetime DEFAULT time::now();

DEFINE INDEX sharing_queue_id ON TABLE sharing_queue COLUMNS id UNIQUE;
DEFINE INDEX sharing_queue_status ON TABLE sharing_queue COLUMNS status;
`;

// ============================================================================
// MULTI-DATABASE SERVICE
// ============================================================================

export class MultiDatabaseService {
  private connections: Map<string, Surreal> = new Map();
  private config: DatabaseConfig;
  private logger: LoggerInterface;
  private namespace: string;

  constructor(config: DatabaseConfig) {
    this.config = config;
    this.namespace = config.namespace;
    this.logger = createLogger('MultiDatabaseService');
  }

  /**
   * Get database name for a member
   */
  getMemberDatabaseName(memberId: string): string {
    return `member_${memberId}`;
  }

  /**
   * Get connection to a specific database
   */
  async getConnection(database: string): Promise<Surreal> {
    const key = `${this.namespace}:${database}`;

    if (this.connections.has(key)) {
      return this.connections.get(key)!;
    }

    const db = new Surreal();

    const connectOptions = {
      namespace: this.namespace,
      database: database,
      auth: this.config.token
        ? this.config.token
        : {
            username: this.config.username || '',
            password: this.config.password || '',
          },
    };

    await db.connect(this.config.url, connectOptions);
    this.connections.set(key, db);

    this.logger.info(`Connected to database: ${database}`);
    return db;
  }

  /**
   * Get connection to the shared company database
   */
  async getCompanyConnection(): Promise<Surreal> {
    return this.getConnection('company');
  }

  /**
   * Get connection to a member's personal database
   */
  async getMemberConnection(memberId: string): Promise<Surreal> {
    return this.getConnection(this.getMemberDatabaseName(memberId));
  }

  /**
   * Initialize all databases (company + all 24 members)
   */
  async initializeAllDatabases(): Promise<void> {
    this.logger.info('Initializing all databases...');

    // Initialize company database
    await this.initializeCompanyDatabase();

    // Initialize all member databases
    for (const member of COUNCIL_MEMBERS) {
      await this.initializeMemberDatabase(member.id);
    }

    this.logger.info('All databases initialized successfully');
  }

  /**
   * Initialize the company database with schema
   */
  async initializeCompanyDatabase(): Promise<void> {
    const db = await this.getCompanyConnection();

    // Split schema into individual statements and execute
    const statements = COMPANY_DATABASE_SCHEMA
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      try {
        await db.query(statement + ';');
      } catch (error) {
        // Schema might already exist
        this.logger.debug(`Schema statement result: ${statement.substring(0, 50)}...`);
      }
    }

    this.logger.info('Company database initialized');
  }

  /**
   * Initialize a member's personal database with schema
   */
  async initializeMemberDatabase(memberId: string): Promise<void> {
    const db = await this.getMemberConnection(memberId);

    const statements = PERSONAL_DATABASE_SCHEMA
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      try {
        await db.query(statement + ';');
      } catch (error) {
        this.logger.debug(`Schema statement result for ${memberId}: ${statement.substring(0, 50)}...`);
      }
    }

    // Create initial profile
    const member = COUNCIL_MEMBERS.find(m => m.id === memberId);
    if (member) {
      try {
        await db.query(`
          CREATE profile SET
            id = $id,
            owner_id = $owner_id,
            created_at = time::now(),
            updated_at = time::now()
        `, {
          id: `profile_${memberId}`,
          owner_id: memberId
        });
      } catch (error) {
        // Profile might already exist
      }
    }

    this.logger.info(`Member database initialized: ${memberId}`);
  }

  /**
   * Create a graph relationship between members (in company database)
   */
  async createRelationship(
    fromMemberId: string,
    toMemberId: string,
    edgeType: GraphEdgeType,
    properties?: Record<string, unknown>
  ): Promise<void> {
    const db = await this.getCompanyConnection();

    const query = `
      RELATE council_member:${fromMemberId}->${edgeType}->council_member:${toMemberId}
      SET ${Object.entries(properties || {}).map(([k, v]) => `${k} = $${k}`).join(', ') || 'created_at = time::now()'}
    `;

    await db.query(query, properties || {});
    this.logger.info(`Created relationship: ${fromMemberId} -[${edgeType}]-> ${toMemberId}`);
  }

  /**
   * Get all relationships of a specific type for a member
   */
  async getMemberRelationships(
    memberId: string,
    edgeType: GraphEdgeType,
    direction: 'outgoing' | 'incoming' | 'both' = 'both'
  ): Promise<any[]> {
    const db = await this.getCompanyConnection();

    let query: string;
    if (direction === 'outgoing') {
      query = `SELECT * FROM ${edgeType} WHERE in = council_member:${memberId}`;
    } else if (direction === 'incoming') {
      query = `SELECT * FROM ${edgeType} WHERE out = council_member:${memberId}`;
    } else {
      query = `SELECT * FROM ${edgeType} WHERE in = council_member:${memberId} OR out = council_member:${memberId}`;
    }

    const result = await db.query(query);
    return Array.isArray(result) ? result.flat() : [];
  }

  /**
   * Share an item from personal database to company database
   */
  async shareToCompany(
    memberId: string,
    itemType: string,
    itemId: string,
    visibility: SharingVisibility = 'council',
    sharedWith?: string[]
  ): Promise<string> {
    const personalDb = await this.getMemberConnection(memberId);
    const companyDb = await this.getCompanyConnection();

    // Get the item from personal database
    const itemResult = await personalDb.query(`SELECT * FROM ${itemType} WHERE id = $id`, { id: itemId });
    const item = Array.isArray(itemResult) && itemResult.length > 0 ? itemResult[0] : null;

    if (!item) {
      throw new Error(`Item not found: ${itemType}:${itemId}`);
    }

    // Create shared item in company database
    const sharedItemId = `shared_${memberId}_${itemType}_${Date.now()}`;

    await companyDb.query(`
      CREATE shared_item SET
        id = $id,
        source_database = $source_database,
        source_member_id = $source_member_id,
        item_type = $item_type,
        source_item_id = $source_item_id,
        visibility = $visibility,
        shared_with = $shared_with,
        shared_at = time::now(),
        snapshot = $snapshot
    `, {
      id: sharedItemId,
      source_database: this.getMemberDatabaseName(memberId),
      source_member_id: memberId,
      item_type: itemType,
      source_item_id: itemId,
      visibility: visibility,
      shared_with: sharedWith || [],
      snapshot: item
    });

    // Update the original item to mark as shared
    await personalDb.query(`
      UPDATE ${itemType} SET
        shared_to_company = true,
        shared_item_id = $shared_item_id,
        updated_at = time::now()
      WHERE id = $id
    `, {
      id: itemId,
      shared_item_id: sharedItemId
    });

    // Create audit log
    await companyDb.query(`
      CREATE audit_log SET
        id = $id,
        actor_id = $actor_id,
        action = 'share_item',
        target_type = $target_type,
        target_id = $target_id,
        details = $details,
        timestamp = time::now()
    `, {
      id: `audit_${Date.now()}`,
      actor_id: memberId,
      target_type: 'shared_item',
      target_id: sharedItemId,
      details: {
        item_type: itemType,
        source_item_id: itemId,
        visibility: visibility,
        shared_with: sharedWith
      }
    });

    this.logger.info(`Shared item: ${itemType}:${itemId} from ${memberId} to company with visibility: ${visibility}`);
    return sharedItemId;
  }

  /**
   * Unshare an item (remove from company database)
   */
  async unshareFromCompany(memberId: string, sharedItemId: string): Promise<void> {
    const companyDb = await this.getCompanyConnection();

    // Verify ownership
    const result = await companyDb.query(
      `SELECT * FROM shared_item WHERE id = $id AND source_member_id = $member_id`,
      { id: sharedItemId, member_id: memberId }
    );

    const sharedItem = Array.isArray(result) && result.length > 0 ? result[0] : null;
    if (!sharedItem) {
      throw new Error('Shared item not found or unauthorized');
    }

    // Delete from company database
    await companyDb.query(`DELETE shared_item WHERE id = $id`, { id: sharedItemId });

    // Update personal database to remove shared reference
    const personalDb = await this.getMemberConnection(memberId);
    await personalDb.query(`
      UPDATE type::table($item_type) SET
        shared_to_company = false,
        shared_item_id = NONE,
        updated_at = time::now()
      WHERE shared_item_id = $shared_item_id
    `, {
      item_type: (sharedItem as any).item_type,
      shared_item_id: sharedItemId
    });

    this.logger.info(`Unshared item: ${sharedItemId}`);
  }

  /**
   * Get all shared items visible to a member
   */
  async getVisibleSharedItems(memberId: string): Promise<any[]> {
    const db = await this.getCompanyConnection();

    const result = await db.query(`
      SELECT * FROM shared_item
      WHERE visibility = 'council'
         OR visibility = 'public'
         OR source_member_id = $member_id
         OR $member_id IN shared_with
      ORDER BY shared_at DESC
    `, { member_id: memberId });

    return Array.isArray(result) ? result.flat() : [];
  }

  /**
   * Close all connections
   */
  async closeAll(): Promise<void> {
    for (const [key, db] of this.connections) {
      await db.close();
      this.logger.info(`Closed connection: ${key}`);
    }
    this.connections.clear();
  }
}

// Export singleton factory
export function createMultiDatabaseService(config: DatabaseConfig): MultiDatabaseService {
  return new MultiDatabaseService(config);
}

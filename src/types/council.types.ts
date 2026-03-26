import { Request } from 'express';

export interface User {
	id: string;
	username: string;
	email: string;
	role: string;
	active: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface CouncilMessage {
	id: string;
	title: string;
	content: string;
	authorId: string;
	author?: User;
	priority?: 'low' | 'medium' | 'high' | 'urgent';
	tags?: string[];
	status: 'active' | 'archived' | 'deleted';
	createdAt: Date;
	updatedAt: Date;
}

export interface CouncilProposal {
	id: string;
	title: string;
	description: string;
	proposerId: string;
	proposer?: User;
	category: 'policy' | 'budget' | 'infrastructure' | 'social' | 'environmental';
	status: 'draft' | 'active' | 'voting' | 'approved' | 'rejected' | 'withdrawn';
	votingDeadline: Date;
	votes?: ProposalVote[];
	attachments?: string[];
	createdAt: Date;
	updatedAt: Date;
}

export interface ProposalVote {
	id: string;
	proposalId: string;
	voterId: string;
	voter?: User;
	vote: 'yes' | 'no' | 'abstain';
	reason?: string;
	createdAt: Date;
}

export interface CouncilStatus {
	activeProposals: number;
	totalMembers: number;
	recentMessages: number;
	upcomingDeadlines: number;
	lastActivity?: Date;
	systemHealth: 'healthy' | 'degraded' | 'critical';
}

export interface CreateMessageRequest {
	title: string;
	content: string;
	authorId: string;
	priority?: 'low' | 'medium' | 'high' | 'urgent';
	tags?: string[];
}

export interface CreateProposalRequest {
	title: string;
	description: string;
	proposerId: string;
	category: 'policy' | 'budget' | 'infrastructure' | 'social' | 'environmental';
	votingDeadline: Date;
	attachments?: string[];
}

export interface CouncilHistoryOptions {
	page: number;
	limit: number;
	type?: 'message' | 'proposal' | 'vote' | 'decision';
	startDate?: Date;
	endDate?: Date;
	authorId?: string;
	category?: string;
}

export interface CouncilHistoryResult {
	items: (CouncilMessage | CouncilProposal)[];
	total: number;
	page: number;
	limit: number;
}

export interface AuthenticatedRequest extends Request {
	user?: User;
}

export interface CouncilMeetingSchedule {
	id: string;
	title: string;
	description?: string;
	scheduledAt: Date;
	duration: number; // in minutes
	participants: string[]; // user IDs
	agenda?: string[];
	status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
	meetingType: 'regular' | 'emergency' | 'committee' | 'workshop';
	location?: string;
	virtualMeetingLink?: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface CouncilDecision {
	id: string;
	proposalId: string;
	decision: 'approved' | 'rejected';
	reasoning: string;
	decidedAt: Date;
	decidedBy: string; // user ID
	effectiveDate?: Date;
	implementationNotes?: string;
}

export interface CouncilAuditLog {
	id: string;
	action: string;
	entityType: 'message' | 'proposal' | 'vote' | 'decision' | 'meeting';
	entityId: string;
	performedBy: string; // user ID
	details?: Record<string, any>;
	timestamp: Date;
	ipAddress?: string;
	userAgent?: string;
}
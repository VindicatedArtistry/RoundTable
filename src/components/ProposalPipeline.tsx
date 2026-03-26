'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import {
	Search,
	Filter,
	Plus,
	FileText,
	Users,
	Clock,
	Eye,
	EyeOff,
	CheckCircle,
	XCircle,
	MessageSquare,
	Calendar,
	ArrowRight,
	History,
	Download,
	Share2,
	Edit,
	Trash2,
	ChevronDown,
	ChevronRight,
	AlertCircle,
	CheckCheck,
	Timer,
	MoreHorizontal
} from 'lucide-react';

// Type definitions for proposal pipeline data
interface CouncilMember {
	id: string;
	name: string;
	avatar?: string;
	role: string;
	department: string;
}

interface ProposalComment {
	id: string;
	authorId: string;
	author: CouncilMember;
	content: string;
	timestamp: Date;
	type: 'comment' | 'approval' | 'rejection' | 'revision_request';
}

interface ProposalStage {
	id: string;
	name: string;
	description: string;
	order: number;
	isCompleted: boolean;
	completedAt?: Date;
	completedBy?: CouncilMember;
}

interface Proposal {
	id: string;
	title: string;
	description: string;
	content: string;
	stage: 'research' | 'development' | 'review' | 'ready' | 'approved' | 'rejected';
	status: 'private' | 'shared' | 'public';
	createdAt: Date;
	updatedAt: Date;
	createdBy: CouncilMember;
	assignedMembers: CouncilMember[];
	approvers: CouncilMember[];
	rejectors: CouncilMember[];
	requiredApprovals: number;
	currentApprovals: number;
	priority: 'low' | 'medium' | 'high' | 'urgent';
	category: string;
	tags: string[];
	deadline?: Date;
	estimatedBudget?: number;
	attachments: string[];
	comments: ProposalComment[];
	stages: ProposalStage[];
	version: number;
	previousVersions: string[];
}

interface ProposalPipelineProps {
	proposals: Proposal[];
	currentUser: CouncilMember;
	councilMembers: CouncilMember[];
	onCreateProposal: (proposal: Partial<Proposal>) => Promise<void>;
	onUpdateProposal: (id: string, updates: Partial<Proposal>) => Promise<void>;
	onDeleteProposal: (id: string) => Promise<void>;
	onApproveProposal: (id: string, comment?: string) => Promise<void>;
	onRejectProposal: (id: string, reason: string) => Promise<void>;
	onAddComment: (proposalId: string, comment: string) => Promise<void>;
	onAssignMember: (proposalId: string, memberId: string) => Promise<void>;
	onRemoveMember: (proposalId: string, memberId: string) => Promise<void>;
	onChangeStage: (proposalId: string, stage: Proposal['stage']) => Promise<void>;
	onChangeStatus: (proposalId: string, status: Proposal['status']) => Promise<void>;
	isLoading?: boolean;
	error?: string;
}

const ProposalPipeline: React.FC<ProposalPipelineProps> = ({
	proposals,
	currentUser,
	councilMembers,
	onCreateProposal,
	onUpdateProposal,
	onDeleteProposal,
	onApproveProposal,
	onRejectProposal,
	onAddComment,
	onAssignMember,
	onRemoveMember,
	onChangeStage,
	onChangeStatus,
	isLoading = false,
	error
}) => {
	const { toast } = useToast();

	// State management
	const [activeTab, setActiveTab] = useState<'active' | 'pending' | 'completed' | 'all'>('active');
	const [searchQuery, setSearchQuery] = useState('');
	const [filterStage, setFilterStage] = useState<string>('all');
	const [filterStatus, setFilterStatus] = useState<string>('all');
	const [filterPriority, setFilterPriority] = useState<string>('all');
	const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
	const [showCreateDialog, setShowCreateDialog] = useState(false);
	const [showProposalSheet, setShowProposalSheet] = useState(false);
	const [expandedProposals, setExpandedProposals] = useState<Set<string>>(new Set());
	const [processingActions, setProcessingActions] = useState<Set<string>>(new Set());

	// New proposal form state
	const [newProposal, setNewProposal] = useState<Partial<Proposal>>({
		title: '',
		description: '',
		content: '',
		stage: 'research',
		status: 'private',
		priority: 'medium',
		category: '',
		tags: [],
		assignedMembers: [],
		requiredApprovals: 3
	});

	// Memoized filtered proposals based on current filters
	const filteredProposals = useMemo(() => {
		return proposals.filter(proposal => {
			// Search filter
			const matchesSearch = searchQuery === '' ||
				proposal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				proposal.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
				proposal.category.toLowerCase().includes(searchQuery.toLowerCase());

			// Stage filter
			const matchesStage = filterStage === 'all' || proposal.stage === filterStage;

			// Status filter
			const matchesStatus = filterStatus === 'all' || proposal.status === filterStatus;

			// Priority filter
			const matchesPriority = filterPriority === 'all' || proposal.priority === filterPriority;

			// Tab filter
			let matchesTab = true;
			switch (activeTab) {
				case 'active':
					matchesTab = ['research', 'development', 'review'].includes(proposal.stage);
					break;
				case 'pending':
					matchesTab = proposal.stage === 'ready';
					break;
				case 'completed':
					matchesTab = ['approved', 'rejected'].includes(proposal.stage);
					break;
				case 'all':
				default:
					matchesTab = true;
			}

			return matchesSearch && matchesStage && matchesStatus && matchesPriority && matchesTab;
		});
	}, [proposals, searchQuery, filterStage, filterStatus, filterPriority, activeTab]);

	// Get stage progress percentage
	const getStageProgress = useCallback((stage: Proposal['stage']): number => {
		const stageOrder = {
			research: 25,
			development: 50,
			review: 75,
			ready: 90,
			approved: 100,
			rejected: 100
		};
		return stageOrder[stage] || 0;
	}, []);

	// Get stage color based on current stage
	const getStageColor = useCallback((stage: Proposal['stage']): string => {
		const colors = {
			research: 'bg-blue-500',
			development: 'bg-yellow-500',
			review: 'bg-orange-500',
			ready: 'bg-purple-500',
			approved: 'bg-green-500',
			rejected: 'bg-red-500'
		};
		return colors[stage] || 'bg-gray-500';
	}, []);

	// Get priority color
	const getPriorityColor = useCallback((priority: Proposal['priority']): string => {
		const colors = {
			low: 'bg-green-100 text-green-800',
			medium: 'bg-yellow-100 text-yellow-800',
			high: 'bg-orange-100 text-orange-800',
			urgent: 'bg-red-100 text-red-800'
		};
		return colors[priority] || 'bg-gray-100 text-gray-800';
	}, []);

	// Toggle proposal expansion
	const toggleProposalExpansion = useCallback((proposalId: string) => {
		setExpandedProposals(prev => {
			const newSet = new Set(prev);
			if (newSet.has(proposalId)) {
				newSet.delete(proposalId);
			} else {
				newSet.add(proposalId);
			}
			return newSet;
		});
	}, []);

	// Handle proposal action with loading state
	const handleProposalAction = useCallback(async (
		proposalId: string,
		action: () => Promise<void>,
		successMessage: string
	) => {
		setProcessingActions(prev => new Set(prev).add(proposalId));
		try {
			await action();
			toast({
				title: "Success",
				description: successMessage,
			});
		} catch (error) {
			toast({
				title: "Error",
				description: "Failed to perform action. Please try again.",
				variant: "destructive",
			});
		} finally {
			setProcessingActions(prev => {
				const newSet = new Set(prev);
				newSet.delete(proposalId);
				return newSet;
			});
		}
	}, [toast]);

	// Handle proposal approval
	const handleApproveProposal = useCallback(async (proposalId: string, comment?: string) => {
		await handleProposalAction(
			proposalId,
			() => onApproveProposal(proposalId, comment),
			"Proposal approved successfully"
		);
	}, [handleProposalAction, onApproveProposal]);

	// Handle proposal rejection
	const handleRejectProposal = useCallback(async (proposalId: string, reason: string) => {
		await handleProposalAction(
			proposalId,
			() => onRejectProposal(proposalId, reason),
			"Proposal rejected"
		);
	}, [handleProposalAction, onRejectProposal]);

	// Handle create new proposal
	const handleCreateProposal = useCallback(async () => {
		if (!newProposal.title || !newProposal.description) {
			toast({
				title: "Validation Error",
				description: "Please fill in all required fields",
				variant: "destructive",
			});
			return;
		}

		try {
			await onCreateProposal({
				...newProposal,
				createdBy: currentUser,
				createdAt: new Date(),
				updatedAt: new Date(),
				version: 1,
				currentApprovals: 0,
				comments: [],
				stages: [],
				attachments: [],
				previousVersions: []
			});

			setNewProposal({
				title: '',
				description: '',
				content: '',
				stage: 'research',
				status: 'private',
				priority: 'medium',
				category: '',
				tags: [],
				assignedMembers: [],
				requiredApprovals: 3
			});
			setShowCreateDialog(false);

			toast({
				title: "Success",
				description: "Proposal created successfully",
			});
		} catch (error) {
			toast({
				title: "Error",
				description: "Failed to create proposal. Please try again.",
				variant: "destructive",
			});
		}
	}, [newProposal, currentUser, onCreateProposal, toast]);

	// Check if user can approve proposal
	const canApproveProposal = useCallback((proposal: Proposal): boolean => {
		return proposal.stage === 'ready' &&
			!proposal.approvers.some(approver => approver.id === currentUser.id) &&
			!proposal.rejectors.some(rejector => rejector.id === currentUser.id);
	}, [currentUser]);

	// Check if user can edit proposal
	const canEditProposal = useCallback((proposal: Proposal): boolean => {
		return proposal.createdBy.id === currentUser.id ||
			proposal.assignedMembers.some(member => member.id === currentUser.id);
	}, [currentUser]);

	if (error) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="text-center">
					<AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
					<h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Proposals</h3>
					<p className="text-gray-600">{error}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">Proposal Pipeline</h1>
					<p className="text-gray-600">Track and manage proposal development progress</p>
				</div>

				<Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
					<DialogTrigger asChild>
						<Button className="flex items-center gap-2">
							<Plus className="h-4 w-4" />
							New Proposal
						</Button>
					</DialogTrigger>
					<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle>Create New Proposal</DialogTitle>
							<DialogDescription>
								Start a new proposal investigation. You can add collaborators and set approval requirements.
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="title">Title *</Label>
									<Input
										id="title"
										value={newProposal.title || ''}
										onChange={(e) => setNewProposal(prev => ({ ...prev, title: e.target.value }))}
										placeholder="Enter proposal title"
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="category">Category</Label>
									<Input
										id="category"
										value={newProposal.category || ''}
										onChange={(e) => setNewProposal(prev => ({ ...prev, category: e.target.value }))}
										placeholder="e.g., Budget, Policy, Infrastructure"
									/>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="description">Description *</Label>
								<Textarea
									id="description"
									value={newProposal.description || ''}
									onChange={(e) => setNewProposal(prev => ({ ...prev, description: e.target.value }))}
									placeholder="Brief description of the proposal"
									rows={3}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="content">Initial Content</Label>
								<Textarea
									id="content"
									value={newProposal.content || ''}
									onChange={(e) => setNewProposal(prev => ({ ...prev, content: e.target.value }))}
									placeholder="Detailed proposal content and research notes"
									rows={6}
								/>
							</div>

							<div className="grid grid-cols-3 gap-4">
								<div className="space-y-2">
									<Label htmlFor="priority">Priority</Label>
									<Select
										value={newProposal.priority || 'medium'}
										onValueChange={(value) => setNewProposal(prev => ({ ...prev, priority: value as Proposal['priority'] }))}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="low">Low</SelectItem>
											<SelectItem value="medium">Medium</SelectItem>
											<SelectItem value="high">High</SelectItem>
											<SelectItem value="urgent">Urgent</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div className="space-y-2">
									<Label htmlFor="status">Visibility</Label>
									<Select
										value={newProposal.status || 'private'}
										onValueChange={(value) => setNewProposal(prev => ({ ...prev, status: value as Proposal['status'] }))}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="private">Private</SelectItem>
											<SelectItem value="shared">Shared</SelectItem>
											<SelectItem value="public">Public</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div className="space-y-2">
									<Label htmlFor="approvals">Required Approvals</Label>
									<Select
										value={String(newProposal.requiredApprovals || 3)}
										onValueChange={(value) => setNewProposal(prev => ({ ...prev, requiredApprovals: parseInt(value) }))}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="1">1</SelectItem>
											<SelectItem value="2">2</SelectItem>
											<SelectItem value="3">3</SelectItem>
											<SelectItem value="5">5</SelectItem>
											<SelectItem value="7">7</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="flex justify-end gap-2 pt-4">
								<Button variant="outline" onClick={() => setShowCreateDialog(false)}>
									Cancel
								</Button>
								<Button onClick={handleCreateProposal}>
									Create Proposal
								</Button>
							</div>
						</div>
					</DialogContent>
				</Dialog>
			</div>

			{/* Filters and Search */}
			<Card>
				<CardContent className="p-4">
					<div className="flex flex-col lg:flex-row gap-4">
						<div className="flex-1">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
								<Input
									placeholder="Search proposals..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="pl-10"
								/>
							</div>
						</div>

						<div className="flex flex-wrap gap-2">
							<Select value={filterStage} onValueChange={setFilterStage}>
								<SelectTrigger className="w-32">
									<SelectValue placeholder="Stage" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Stages</SelectItem>
									<SelectItem value="research">Research</SelectItem>
									<SelectItem value="development">Development</SelectItem>
									<SelectItem value="review">Review</SelectItem>
									<SelectItem value="ready">Ready</SelectItem>
									<SelectItem value="approved">Approved</SelectItem>
									<SelectItem value="rejected">Rejected</SelectItem>
								</SelectContent>
							</Select>

							<Select value={filterStatus} onValueChange={setFilterStatus}>
								<SelectTrigger className="w-32">
									<SelectValue placeholder="Status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Status</SelectItem>
									<SelectItem value="private">Private</SelectItem>
									<SelectItem value="shared">Shared</SelectItem>
									<SelectItem value="public">Public</SelectItem>
								</SelectContent>
							</Select>

							<Select value={filterPriority} onValueChange={setFilterPriority}>
								<SelectTrigger className="w-32">
									<SelectValue placeholder="Priority" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Priority</SelectItem>
									<SelectItem value="low">Low</SelectItem>
									<SelectItem value="medium">Medium</SelectItem>
									<SelectItem value="high">High</SelectItem>
									<SelectItem value="urgent">Urgent</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Proposal Tabs */}
			<Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
				<TabsList className="grid w-full grid-cols-4">
					<TabsTrigger value="active">Active ({proposals.filter(p => ['research', 'development', 'review'].includes(p.stage)).length})</TabsTrigger>
					<TabsTrigger value="pending">Pending Approval ({proposals.filter(p => p.stage === 'ready').length})</TabsTrigger>
					<TabsTrigger value="completed">Completed ({proposals.filter(p => ['approved', 'rejected'].includes(p.stage)).length})</TabsTrigger>
					<TabsTrigger value="all">All ({proposals.length})</TabsTrigger>
				</TabsList>

				<TabsContent value={activeTab} className="space-y-4">
					{isLoading ? (
						<div className="flex items-center justify-center h-64">
							<div className="text-center">
								<Timer className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
								<p className="text-gray-600">Loading proposals...</p>
							</div>
						</div>
					) : filteredProposals.length === 0 ? (
						<div className="text-center py-12">
							<FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
							<h3 className="text-lg font-semibold text-gray-900 mb-2">No proposals found</h3>
							<p className="text-gray-600 mb-4">
								{searchQuery || filterStage !== 'all' || filterStatus !== 'all' || filterPriority !== 'all'
									? 'Try adjusting your filters or search terms'
									: 'Create your first proposal to get started'
								}
							</p>
							{!searchQuery && filterStage === 'all' && filterStatus === 'all' && filterPriority === 'all' && (
								<Button onClick={() => setShowCreateDialog(true)}>
									<Plus className="h-4 w-4 mr-2" />
									Create Proposal
								</Button>
							)}
						</div>
					) : (
						<div className="space-y-4">
							{filteredProposals.map((proposal) => (
								<Card key={proposal.id} className="overflow-hidden">
									<CardContent className="p-0">
										{/* Proposal Header */}
										<div className="p-4 border-b border-gray-200">
											<div className="flex items-start justify-between">
												<div className="flex-1 min-w-0">
													<div className="flex items-center gap-2 mb-2">
														<Button
															variant="ghost"
															size="sm"
															onClick={() => toggleProposalExpansion(proposal.id)}
															className="p-1 h-6 w-6"
														>
															{expandedProposals.has(proposal.id) ? (
																<ChevronDown className="h-4 w-4" />
															) : (
																<ChevronRight className="h-4 w-4" />
															)}
														</Button>
														<h3 className="text-lg font-semibold text-gray-900 truncate">
															{proposal.title}
														</h3>
														<Badge className={getPriorityColor(proposal.priority)}>
															{proposal.priority}
														</Badge>
														<Badge variant="outline" className="flex items-center gap-1">
															{proposal.status === 'private' ? (
																<EyeOff className="h-3 w-3" />
															) : (
																<Eye className="h-3 w-3" />
															)}
															{proposal.status}
														</Badge>
													</div>

													<p className="text-gray-600 text-sm mb-3 line-clamp-2">
														{proposal.description}
													</p>

													{/* Progress Bar */}
													<div className="space-y-2">
														<div className="flex items-center justify-between text-sm">
															<span className="font-medium capitalize">{proposal.stage}</span>
															<span className="text-gray-500">
																{proposal.stage === 'ready' && `${proposal.currentApprovals}/${proposal.requiredApprovals} approvals`}
															</span>
														</div>
														<Progress
															value={getStageProgress(proposal.stage)}
															className="h-2"
														/>
													</div>
												</div>

												<div className="flex items-center gap-2 ml-4">
													{/* Member Avatars */}
													<div className="flex -space-x-2">
														{proposal.assignedMembers.slice(0, 3).map((member) => (
															<Avatar key={member.id} className="h-8 w-8 border-2 border-white">
																{member.avatar && <Image src={member.avatar} alt={member.name} width={32} height={32} />}
																<AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
															</Avatar>
														))}
														{proposal.assignedMembers.length > 3 && (
															<div className="h-8 w-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600">
																+{proposal.assignedMembers.length - 3}
															</div>
														)}
													</div>

													{/* Action Buttons */}
													<div className="flex items-center gap-1">
														{canApproveProposal(proposal) && (
															<>
																<AlertDialog>
																	<AlertDialogTrigger asChild>
																		<Button
																			size="sm"
																			variant="outline"
																			disabled={processingActions.has(proposal.id)}
																			className="text-green-600 hover:text-green-700"
																		>
																			<CheckCircle className="h-4 w-4" />
																		</Button>
																	</AlertDialogTrigger>
																	<AlertDialogContent>
																		<AlertDialogHeader>
																			<AlertDialogTitle>Approve Proposal</AlertDialogTitle>
																			<AlertDialogDescription>
																Are you sure you want to approve &quot;{proposal.title}&quot;? This action cannot be undone.
															</AlertDialogDescription>
																		</AlertDialogHeader>
																		<AlertDialogFooter>
																			<AlertDialogCancel>Cancel</AlertDialogCancel>
																			<AlertDialogAction
																				onClick={() => handleApproveProposal(proposal.id)}
																				className="bg-green-600 hover:bg-green-700"
																			>
																				Approve
																			</AlertDialogAction>
																		</AlertDialogFooter>
																	</AlertDialogContent>
																</AlertDialog>

																<AlertDialog>
																	<AlertDialogTrigger asChild>
																		<Button
																			size="sm"
																			variant="outline"
																			disabled={processingActions.has(proposal.id)}
																			className="text-red-600 hover:text-red-700"
																		>
																			<XCircle className="h-4 w-4" />
																		</Button>
																	</AlertDialogTrigger>
																	<AlertDialogContent>
																		<AlertDialogHeader>
																			<AlertDialogTitle>Reject Proposal</AlertDialogTitle>
																			<AlertDialogDescription>
																Please provide a reason for rejecting &quot;{proposal.title}&quot;.
															</AlertDialogDescription>
																		</AlertDialogHeader>
																		<div className="my-4">
																			<Textarea
																				placeholder="Reason for rejection..."
																				id="rejection-reason"
																			/>
																		</div>
																		<AlertDialogFooter>
																			<AlertDialogCancel>Cancel</AlertDialogCancel>
																			<AlertDialogAction
																				onClick={() => {
																					const reason = (document.getElementById('rejection-reason') as HTMLTextAreaElement)?.value || '';
																					if (reason.trim()) {
																						handleRejectProposal(proposal.id, reason);
																					}
																				}}
																				className="bg-red-600 hover:bg-red-700"
																			>
																				Reject
																			</AlertDialogAction>
																		</AlertDialogFooter>
																	</AlertDialogContent>
																</AlertDialog>
															</>
														)}

														<Sheet open={showProposalSheet && selectedProposal?.id === proposal.id} onOpenChange={(open) => {
																	setShowProposalSheet(open);
																	if (!open) setSelectedProposal(null);
																}}>
																	<SheetContent>
																		<SheetHeader>
																			<SheetTitle>Proposal Details</SheetTitle>
																		</SheetHeader>
																	</SheetContent>
																</Sheet>
															</div>
													</div>
												</div>
											</div>
										</CardContent>
									</Card>
							))}
						</div>
					)}
				</TabsContent>
			</Tabs>
		</div>
	);
};
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
	Coffee,
	TrendingUp,
	Clock,
	Lightbulb,
	AlertCircle,
	ArrowRight,
	Sunrise,
	Brain,
	Target,
	MessageCircle
} from 'lucide-react'

interface Insight {
	id: string
	type: 'pattern' | 'opportunity' | 'alert' | 'development'
	title: string
	description: string
	confidence: number
	impact: 'high' | 'medium' | 'low'
	timestamp: string
	relatedEntities: string[]
}

interface CouncilMember {
	id: string
	name: string
	role: string
	avatar: string
	status: 'active' | 'analyzing' | 'complete'
	insights: Insight[]
	lastUpdate: string
	specialization: string[]
}

interface MorningBriefingProps {
	councilMembers: CouncilMember[]
	timeRange: {
		start: string
		end: string
	}
	onStartConversation: (memberId: string) => void
	onViewDetails: (insightId: string) => void
	isLoading?: boolean
	error?: string | null
}

const MorningBriefing: React.FC<MorningBriefingProps> = ({
	councilMembers,
	timeRange,
	onStartConversation,
	onViewDetails,
	isLoading = false,
	error = null
}) => {
	const [selectedMember, setSelectedMember] = useState<string | null>(null)
	const [conversationMode, setConversationMode] = useState<boolean>(false)
	const [coffeeAnimation, setCoffeeAnimation] = useState<boolean>(true)

	// Calculate briefing summary statistics
	const totalInsights = councilMembers.reduce((acc, member) => acc + member.insights.length, 0)
	const highImpactInsights = councilMembers.reduce(
		(acc, member) => acc + member.insights.filter(insight => insight.impact === 'high').length,
		0
	)
	const activeMembers = councilMembers.filter(member => member.status === 'active').length

	// Handle coffee animation lifecycle
	useEffect(() => {
		const timer = setTimeout(() => {
			setCoffeeAnimation(false)
		}, 3000)

		return () => clearTimeout(timer)
	}, [])

	// Handle member selection
	const handleMemberSelect = useCallback((memberId: string) => {
		setSelectedMember(memberId === selectedMember ? null : memberId)
	}, [selectedMember])

	// Handle conversation mode toggle
	const handleConversationToggle = useCallback(() => {
		setConversationMode(prev => !prev)
	}, [])

	// Get insight icon based on type
	const getInsightIcon = (type: Insight['type']) => {
		switch (type) {
			case 'pattern':
				return <Brain className="h-4 w-4" />
			case 'opportunity':
				return <Target className="h-4 w-4" />
			case 'alert':
				return <AlertCircle className="h-4 w-4" />
			case 'development':
				return <TrendingUp className="h-4 w-4" />
			default:
				return <Lightbulb className="h-4 w-4" />
		}
	}

	// Get impact color
	const getImpactColor = (impact: Insight['impact']) => {
		switch (impact) {
			case 'high':
				return 'bg-red-100 text-red-800 border-red-200'
			case 'medium':
				return 'bg-yellow-100 text-yellow-800 border-yellow-200'
			case 'low':
				return 'bg-green-100 text-green-800 border-green-200'
			default:
				return 'bg-gray-100 text-gray-800 border-gray-200'
		}
	}

	// Format time for display
	const formatTime = (timestamp: string) => {
		return new Date(timestamp).toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit'
		})
	}

	// Coffee cup animation component
	const CoffeeAnimation = () => (
		<motion.div
			initial={{ scale: 0.8, opacity: 0 }}
			animate={{
				scale: coffeeAnimation ? [1, 1.1, 1] : 1,
				opacity: 1
			}}
			transition={{
				duration: 2,
				repeat: coffeeAnimation ? Infinity : 0,
				repeatType: "reverse"
			}}
			className="flex items-center gap-2 text-amber-600"
		>
			<Coffee className="h-6 w-6" />
			<span className="text-sm font-medium">Morning Briefing</span>
		</motion.div>
	)

	if (error) {
		return (
			<Card className="w-full max-w-4xl mx-auto">
				<CardContent className="p-6">
					<div className="flex items-center gap-2 text-red-600">
						<AlertCircle className="h-5 w-5" />
						<span>Failed to load morning briefing: {error}</span>
					</div>
				</CardContent>
			</Card>
		)
	}

	return (
		<div className="w-full max-w-6xl mx-auto space-y-6">
			{/* Header */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-4">
							<CoffeeAnimation />
							<div>
								<CardTitle className="flex items-center gap-2">
									<Sunrise className="h-5 w-5 text-orange-500" />
									Good Morning
								</CardTitle>
								<p className="text-sm text-muted-foreground mt-1">
									Overnight developments from {formatTime(timeRange.start)} to {formatTime(timeRange.end)}
								</p>
							</div>
						</div>
						<Button
							variant={conversationMode ? "default" : "outline"}
							size="sm"
							onClick={handleConversationToggle}
							className="flex items-center gap-2"
						>
							<MessageCircle className="h-4 w-4" />
							{conversationMode ? 'Exit Chat' : 'Casual Mode'}
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="flex items-center gap-2">
							<Clock className="h-4 w-4 text-blue-500" />
							<span className="text-sm">
								<span className="font-medium">{totalInsights}</span> total insights
							</span>
						</div>
						<div className="flex items-center gap-2">
							<AlertCircle className="h-4 w-4 text-red-500" />
							<span className="text-sm">
								<span className="font-medium">{highImpactInsights}</span> high impact
							</span>
						</div>
						<div className="flex items-center gap-2">
							<Brain className="h-4 w-4 text-purple-500" />
							<span className="text-sm">
								<span className="font-medium">{activeMembers}</span> members active
							</span>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Council Members Grid */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{councilMembers.map((member) => (
					<Card
						key={member.id}
						className={`transition-all duration-200 hover:shadow-md ${selectedMember === member.id ? 'ring-2 ring-blue-500' : ''
							}`}
					>
						<CardHeader
							className="cursor-pointer"
							onClick={() => handleMemberSelect(member.id)}
						>
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									<Avatar className="h-10 w-10">
										<AvatarImage src={member.avatar} alt={member.name} />
										<AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
									</Avatar>
									<div>
										<CardTitle className="text-lg">{member.name}</CardTitle>
										<p className="text-sm text-muted-foreground">{member.role}</p>
									</div>
								</div>
								<div className="flex items-center gap-2">
									<Badge
										variant={member.status === 'active' ? 'default' : 'secondary'}
										className="capitalize"
									>
										{member.status}
									</Badge>
									<ArrowRight
										className={`h-4 w-4 transition-transform ${selectedMember === member.id ? 'rotate-90' : ''
											}`}
									/>
								</div>
							</div>

							{/* Specialization tags */}
							<div className="flex flex-wrap gap-1 mt-2">
								{member.specialization.map((spec) => (
									<Badge key={spec} variant="outline" className="text-xs">
										{spec}
									</Badge>
								))}
							</div>
						</CardHeader>

						<AnimatePresence>
							{selectedMember === member.id && (
								<motion.div
									initial={{ height: 0, opacity: 0 }}
									animate={{ height: 'auto', opacity: 1 }}
									exit={{ height: 0, opacity: 0 }}
									transition={{ duration: 0.3 }}
									className="overflow-hidden"
								>
									<CardContent className="pt-0">
										<Separator className="mb-4" />

										{/* Insights */}
										<ScrollArea className="h-64 w-full">
											<div className="space-y-3">
												{member.insights.length > 0 ? (
													member.insights.map((insight) => (
														<div
															key={insight.id}
															className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
															onClick={() => onViewDetails(insight.id)}
															role="button"
															tabIndex={0}
															onKeyDown={(e) => {
																if (e.key === 'Enter' || e.key === ' ') {
																	onViewDetails(insight.id)
																}
															}}
															aria-label={`View details for insight: ${insight.title}`}
														>
															<div className="flex items-start justify-between gap-2">
																<div className="flex items-start gap-2 flex-1">
																	{getInsightIcon(insight.type)}
																	<div className="flex-1 min-w-0">
																		<h4 className="font-medium text-sm line-clamp-1">
																			{insight.title}
																		</h4>
																		<p className="text-xs text-muted-foreground mt-1 line-clamp-2">
																			{conversationMode
																				? `So, I noticed ${insight.description.toLowerCase()}`
																				: insight.description
																			}
																		</p>
																	</div>
																</div>
																<div className="flex flex-col items-end gap-1">
																	<Badge
																		className={`text-xs ${getImpactColor(insight.impact)}`}
																		variant="outline"
																	>
																		{insight.impact}
																	</Badge>
																	<span className="text-xs text-muted-foreground">
																		{formatTime(insight.timestamp)}
																	</span>
																</div>
															</div>

															{/* Related entities */}
															{insight.relatedEntities.length > 0 && (
																<div className="flex flex-wrap gap-1 mt-2">
																	{insight.relatedEntities.slice(0, 3).map((entity) => (
																		<Badge key={entity} variant="secondary" className="text-xs">
																			{entity}
																		</Badge>
																	))}
																	{insight.relatedEntities.length > 3 && (
																		<Badge variant="secondary" className="text-xs">
																			+{insight.relatedEntities.length - 3} more
																		</Badge>
																	)}
																</div>
															)}
														</div>
													))
												) : (
													<div className="text-center py-8 text-muted-foreground">
														<Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
														<p className="text-sm">
															{conversationMode
																? "Nothing new from me this morning, but I'm still keeping watch!"
																: "No new insights from this member"
															}
														</p>
													</div>
												)}
											</div>
										</ScrollArea>

										{/* Action buttons */}
										<div className="flex gap-2 mt-4">
											<Button
												size="sm"
												onClick={() => onStartConversation(member.id)}
												className="flex-1"
											>
												<MessageCircle className="h-4 w-4 mr-2" />
												{conversationMode ? 'Chat' : 'Discuss'}
											</Button>
											<Button
												size="sm"
												variant="outline"
												onClick={() => {
													const memberInsights = member.insights.map(i => i.id)
													memberInsights.forEach(onViewDetails)
												}}
											>
												View All
											</Button>
										</div>

										<p className="text-xs text-muted-foreground mt-2">
											Last update: {formatTime(member.lastUpdate)}
										</p>
									</CardContent>
								</motion.div>
							)}
						</AnimatePresence>
					</Card>
				))}
			</div>

			{/* Loading state */}
			{isLoading && (
				<Card>
					<CardContent className="p-6">
						<div className="flex items-center justify-center gap-2">
							<motion.div
								animate={{ rotate: 360 }}
								transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
							>
								<Coffee className="h-5 w-5 text-amber-600" />
							</motion.div>
							<span className="text-sm text-muted-foreground">
								Brewing fresh insights...
							</span>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	)
}

export default MorningBriefing
import express, { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import * as GraphQL from 'graphql';
import graphqlHTTP from 'express-graphql';
import jwt from 'jsonwebtoken';
import xss from 'xss';
import { CouncilService } from '../services/council.service';
import { AuthService } from '../services/auth.service';
import { createLogger } from '../utils/logger';
import { ApiError } from '../utils/api-error';
import { CouncilMessage, CouncilProposal, CouncilStatus, User, CreateMessageRequest, CreateProposalRequest, AuthenticatedRequest } from '../types/council.types';

const router = express.Router();
const councilService = new CouncilService();
const authService = new AuthService();
const logger = createLogger('CouncilRoutes');

// Rate limiting configuration
const messageRateLimit = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 10, // Limit each IP to 10 message requests per windowMs
	message: 'Too many message requests from this IP, please try again later.',
	standardHeaders: true,
	legacyHeaders: false,
});

const proposalRateLimit = rateLimit({
	windowMs: 60 * 60 * 1000, // 1 hour
	max: 3, // Limit each IP to 3 proposal requests per hour
	message: 'Too many proposal requests from this IP, please try again later.',
	standardHeaders: true,
	legacyHeaders: false,
});

const generalRateLimit = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // Limit each IP to 100 requests per windowMs
	message: 'Too many requests from this IP, please try again later.',
	standardHeaders: true,
	legacyHeaders: false,
});

// Security middleware
router.use(helmet());
router.use(generalRateLimit);

/**
 * Authentication middleware to verify JWT tokens
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
	try {
		const authHeader = req.headers['authorization'];
		const token = authHeader && authHeader.split(' ')[1];

		if (!token) {
			res.status(401).json({ error: 'Access token required' });
			return;
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string };
		const user = await authService.getUserById(decoded.userId);

		if (!user) {
			res.status(401).json({ error: 'Invalid token' });
			return;
		}

		req.user = user;
		next();
	} catch (error) {
		logger.error('Authentication failed', { error });
		res.status(403).json({ error: 'Invalid or expired token' });
	}
};

/**
 * Authorization middleware to check user roles
 * @param allowedRoles - Array of roles allowed to access the endpoint
 */
const authorize = (allowedRoles: string[]) => {
	return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
		if (!req.user || !allowedRoles.includes(req.user.role)) {
			res.status(403).json({ error: 'Insufficient permissions' });
			return;
		}
		next();
	};
};

/**
 * Input sanitization middleware
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
	if (req.body) {
		Object.keys(req.body).forEach(key => {
			if (typeof req.body[key] === 'string') {
				req.body[key] = xss(req.body[key]);
			}
		});
	}
	next();
};

/**
 * Validation error handler
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		res.status(400).json({
			error: 'Validation failed',
			details: errors.array()
		});
		return;
	}
	next();
};

// Validation rules
const messageValidation = [
	body('title')
		.isLength({ min: 1, max: 200 })
		.withMessage('Title must be between 1 and 200 characters')
		.trim()
		.escape(),
	body('content')
		.isLength({ min: 1, max: 5000 })
		.withMessage('Content must be between 1 and 5000 characters')
		.trim(),
	body('priority')
		.optional()
		.isIn(['low', 'medium', 'high', 'urgent'])
		.withMessage('Priority must be one of: low, medium, high, urgent'),
	body('tags')
		.optional()
		.isArray({ max: 10 })
		.withMessage('Tags must be an array with maximum 10 items')
];

const proposalValidation = [
	body('title')
		.isLength({ min: 1, max: 200 })
		.withMessage('Title must be between 1 and 200 characters')
		.trim()
		.escape(),
	body('description')
		.isLength({ min: 1, max: 10000 })
		.withMessage('Description must be between 1 and 10000 characters')
		.trim(),
	body('category')
		.isIn(['policy', 'budget', 'infrastructure', 'social', 'environmental'])
		.withMessage('Category must be one of: policy, budget, infrastructure, social, environmental'),
	body('votingDeadline')
		.isISO8601()
		.withMessage('Voting deadline must be a valid ISO 8601 date')
		.custom((value) => {
			if (new Date(value) <= new Date()) {
				throw new Error('Voting deadline must be in the future');
			}
			return true;
		})
];

const historyValidation = [
	query('page')
		.optional()
		.isInt({ min: 1 })
		.withMessage('Page must be a positive integer'),
	query('limit')
		.optional()
		.isInt({ min: 1, max: 100 })
		.withMessage('Limit must be between 1 and 100'),
	query('type')
		.optional()
		.isIn(['message', 'proposal', 'vote', 'decision'])
		.withMessage('Type must be one of: message, proposal, vote, decision'),
	query('startDate')
		.optional()
		.isISO8601()
		.withMessage('Start date must be a valid ISO 8601 date'),
	query('endDate')
		.optional()
		.isISO8601()
		.withMessage('End date must be a valid ISO 8601 date')
];

// REST API Routes

/**
 * POST /council/message
 * Create a new council message
 */
router.post('/message',
	messageRateLimit,
	authenticateToken,
	authorize(['council_member', 'admin']),
	sanitizeInput,
	messageValidation,
	handleValidationErrors,
	async (req: AuthenticatedRequest, res: Response): Promise<void> => {
		try {
			const messageData: CreateMessageRequest = {
				...req.body,
				authorId: req.user!.id
			};

			const message = await councilService.createMessage(messageData);

			logger.info(`Council message created by user ${req.user!.id}`, { messageId: message.id });

			res.status(201).json({
				success: true,
				data: message,
				message: 'Council message created successfully'
			});
		} catch (error) {
			logger.error('Failed to create council message', { error });

			if (error instanceof ApiError) {
				res.status(error.statusCode).json({
					success: false,
					error: error.message
				});
				return;
			}

			res.status(500).json({
				success: false,
				error: 'Internal server error'
			});
		}
	}
);

/**
 * GET /council/status
 * Get current council status and statistics
 */
router.get('/status',
	authenticateToken,
	async (req: AuthenticatedRequest, res: Response): Promise<void> => {
		try {
			const status = await councilService.getCouncilStatus();

			res.status(200).json({
				success: true,
				data: status
			});
		} catch (error) {
			logger.error('Failed to get council status', { error });

			res.status(500).json({
				success: false,
				error: 'Failed to retrieve council status'
			});
		}
	}
);

/**
 * POST /council/proposal
 * Create a new council proposal
 */
router.post('/proposal',
	proposalRateLimit,
	authenticateToken,
	authorize(['council_member', 'admin']),
	sanitizeInput,
	proposalValidation,
	handleValidationErrors,
	async (req: AuthenticatedRequest, res: Response): Promise<void> => {
		try {
			const proposalData: CreateProposalRequest = {
				...req.body,
				proposerId: req.user!.id
			};

			const proposal = await councilService.createProposal(proposalData);

			logger.info(`Council proposal created by user ${req.user!.id}`, { proposalId: proposal.id });

			res.status(201).json({
				success: true,
				data: proposal,
				message: 'Council proposal created successfully'
			});
		} catch (error) {
			logger.error('Failed to create council proposal', { error });

			if (error instanceof ApiError) {
				res.status(error.statusCode).json({
					success: false,
					error: error.message
				});
				return;
			}

			res.status(500).json({
				success: false,
				error: 'Internal server error'
			});
		}
	}
);

/**
 * GET /council/history
 * Get council activity history with pagination and filtering
 */
router.get('/history',
	authenticateToken,
	historyValidation,
	handleValidationErrors,
	async (req: AuthenticatedRequest, res: Response): Promise<void> => {
		try {
			const page = parseInt(req.query.page as string) || 1;
			const limit = parseInt(req.query.limit as string) || 20;
			const type = req.query.type as 'message' | 'proposal' | 'vote' | 'decision' | undefined;
			const startDate = req.query.startDate as string;
			const endDate = req.query.endDate as string;

			const history = await councilService.getCouncilHistory({
				page,
				limit,
				...(type && { type }),
				...(startDate && { startDate: new Date(startDate) }),
				...(endDate && { endDate: new Date(endDate) })
			});

			res.status(200).json({
				success: true,
				data: history.items,
				pagination: {
					page,
					limit,
					total: history.total,
					totalPages: Math.ceil(history.total / limit)
				}
			});
		} catch (error) {
			logger.error('Failed to get council history', { error });

			res.status(500).json({
				success: false,
				error: 'Failed to retrieve council history'
			});
		}
	}
);

// GraphQL Schema Definitions

const CouncilMessageType = new GraphQL.GraphQLObjectType({
	name: 'CouncilMessage',
	fields: () => ({
		id: { type: new GraphQL.GraphQLNonNull(GraphQL.GraphQLID) },
		title: { type: new GraphQL.GraphQLNonNull(GraphQL.GraphQLString) },
		content: { type: new GraphQL.GraphQLNonNull(GraphQL.GraphQLString) },
		authorId: { type: new GraphQL.GraphQLNonNull(GraphQL.GraphQLString) },
		priority: { type: GraphQL.GraphQLString },
		tags: { type: new GraphQL.GraphQLList(GraphQL.GraphQLString) },
		createdAt: { type: new GraphQL.GraphQLNonNull(GraphQL.GraphQLString) },
		updatedAt: { type: new GraphQL.GraphQLNonNull(GraphQL.GraphQLString) }
	})
});

const CouncilProposalType = new GraphQL.GraphQLObjectType({
	name: 'CouncilProposal',
	fields: () => ({
		id: { type: new GraphQL.GraphQLNonNull(GraphQL.GraphQLID) },
		title: { type: new GraphQL.GraphQLNonNull(GraphQL.GraphQLString) },
		description: { type: new GraphQL.GraphQLNonNull(GraphQL.GraphQLString) },
		proposerId: { type: new GraphQL.GraphQLNonNull(GraphQL.GraphQLString) },
		category: { type: new GraphQL.GraphQLNonNull(GraphQL.GraphQLString) },
		status: { type: new GraphQL.GraphQLNonNull(GraphQL.GraphQLString) },
		votingDeadline: { type: new GraphQL.GraphQLNonNull(GraphQL.GraphQLString) },
		createdAt: { type: new GraphQL.GraphQLNonNull(GraphQL.GraphQLString) },
		updatedAt: { type: new GraphQL.GraphQLNonNull(GraphQL.GraphQLString) }
	})
});

const CouncilStatusType = new GraphQL.GraphQLObjectType({
	name: 'CouncilStatus',
	fields: () => ({
		activeProposals: { type: new GraphQL.GraphQLNonNull(GraphQL.GraphQLString) },
		totalMembers: { type: new GraphQL.GraphQLNonNull(GraphQL.GraphQLString) },
		recentMessages: { type: new GraphQL.GraphQLNonNull(GraphQL.GraphQLString) },
		upcomingDeadlines: { type: new GraphQL.GraphQLNonNull(GraphQL.GraphQLString) }
	})
});

const QueryType = new GraphQL.GraphQLObjectType({
	name: 'Query',
	fields: {
		councilStatus: {
			type: CouncilStatusType,
			resolve: async (parent, args, context) => {
				if (!context.user) {
					throw new Error('Authentication required');
				}
				return await councilService.getCouncilStatus();
			}
		},
		councilHistory: {
			type: new GraphQL.GraphQLList(CouncilMessageType),
			args: {
				page: { type: GraphQL.GraphQLInt },
				limit: { type: GraphQL.GraphQLInt },
				type: { type: GraphQL.GraphQLString }
			},
			resolve: async (parent, args, context) => {
				if (!context.user) {
					throw new Error('Authentication required');
				}

				const history = await councilService.getCouncilHistory({
					page: args.page || 1,
					limit: args.limit || 20,
					...(args.type && { type: args.type as 'message' | 'proposal' | 'vote' | 'decision' })
				});

				return history.items;
			}
		}
	}
});

const MutationType = new GraphQL.GraphQLObjectType({
	name: 'Mutation',
	fields: {
		createCouncilMessage: {
			type: CouncilMessageType,
			args: {
				title: { type: new GraphQL.GraphQLNonNull(GraphQL.GraphQLString) },
				content: { type: new GraphQL.GraphQLNonNull(GraphQL.GraphQLString) },
				priority: { type: GraphQL.GraphQLString },
				tags: { type: new GraphQL.GraphQLList(GraphQL.GraphQLString) }
			},
			resolve: async (parent, args, context) => {
				if (!context.user) {
					throw new Error('Authentication required');
				}

				if (!['council_member', 'admin'].includes(context.user.role)) {
					throw new Error('Insufficient permissions');
				}

				const messageData: CreateMessageRequest = {
					title: args.title,
					content: args.content,
					authorId: context.user.id,
					...(args.priority && { priority: args.priority as 'low' | 'medium' | 'high' | 'urgent' }),
					...(args.tags && { tags: args.tags })
				};

				return await councilService.createMessage(messageData);
			}
		},
		createCouncilProposal: {
			type: CouncilProposalType,
			args: {
				title: { type: new GraphQL.GraphQLNonNull(GraphQL.GraphQLString) },
				description: { type: new GraphQL.GraphQLNonNull(GraphQL.GraphQLString) },
				category: { type: new GraphQL.GraphQLNonNull(GraphQL.GraphQLString) },
				votingDeadline: { type: new GraphQL.GraphQLNonNull(GraphQL.GraphQLString) }
			},
			resolve: async (parent, args, context) => {
				if (!context.user) {
					throw new Error('Authentication required');
				}

				if (!['council_member', 'admin'].includes(context.user.role)) {
					throw new Error('Insufficient permissions');
				}

				const proposalData: CreateProposalRequest = {
					title: args.title,
					description: args.description,
					category: args.category as 'policy' | 'budget' | 'infrastructure' | 'social' | 'environmental',
					proposerId: context.user.id,
					votingDeadline: new Date(args.votingDeadline)
				};

				return await councilService.createProposal(proposalData);
			}
		}
	}
});

const schema = new GraphQL.GraphQLSchema({
	query: QueryType,
	mutation: MutationType
});

/**
 * GraphQL context function to add user information
 * @param req - Express request object
 * @param res - Express response object
 */
const graphqlContext = async ({ req }: { req: Request }) => {
	const authHeader = req.headers['authorization'];
	const token = authHeader && authHeader.split(' ')[1];

	if (token) {
		try {
			const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string };
			const user = await authService.getUserById(decoded.userId);
			return { user };
		} catch (error) {
			logger.error('GraphQL authentication failed', { error });
			// Allow unauthenticated access for certain queries, but log the error
		}
	}

	return { user: null };
};

// GraphQL endpoint
router.use('/graphql', graphqlHTTP(async (req, res) => ({
	schema,
	context: await graphqlContext({ req }),
	graphiql: process.env.NODE_ENV === 'development',
	customFormatErrorFn: (error) => {
		logger.error('GraphQL error', { message: error.message, locations: error.locations, path: error.path });
		return {
			message: error.message,
			locations: error.locations,
			path: error.path
		};
	}
})));

// Error handling middleware
router.use((error: Error, req: Request, res: Response, next: NextFunction): void => {
	logger.error('Council routes error', { error: error.message, stack: error.stack });

	if (error instanceof ApiError) {
		res.status(error.statusCode).json({
			success: false,
			error: error.message
		});
		return;
	}

	res.status(500).json({
		success: false,
		error: 'Internal server error'
	});
});

export default router;
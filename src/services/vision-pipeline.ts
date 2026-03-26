import { EventEmitter } from 'events';
import { WebSocket } from 'ws';
import sharp from 'sharp';
import cv from 'opencv4nodejs';
import * as tf from '@tensorflow/tfjs-node';
import Tesseract from 'tesseract.js';
import { createHash } from 'crypto';
import { performance } from 'perf_hooks';
import { z } from 'zod';
import { createLogger, LoggerInterface } from '@/utils/logger';
import rateLimit from 'express-rate-limit';

// Type definitions for TensorFlow types (simplified for compilation)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Tensor3D = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Tensor = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GraphModel = any;

interface VisionFrame {
	id: string;
	timestamp: number;
	imageData: Buffer;
	metadata: FrameMetadata;
}

interface FrameMetadata {
	width: number;
	height: number;
	format: string;
	source: string;
	cameraId: string;
}

interface DetectedObject {
	id: string;
	class: string;
	confidence: number;
	boundingBox: BoundingBox;
	timestamp: number;
}

interface BoundingBox {
	x: number;
	y: number;
	width: number;
	height: number;
}

interface SafetyHazard {
	id: string;
	type: SafetyHazardType;
	severity: 'low' | 'medium' | 'high' | 'critical';
	location: BoundingBox;
	description: string;
	timestamp: number;
	recommendations: string[];
}

interface ExtractedText {
	text: string;
	confidence: number;
	boundingBox: BoundingBox;
	language: string;
}

interface SceneAnalysis {
	frameId: string;
	timestamp: number;
	objects: DetectedObject[];
	text: ExtractedText[];
	safetyHazards: SafetyHazard[];
	complianceViolations: ComplianceViolation[];
	sceneDescription: string;
	qualityScore: number;
}

interface ComplianceViolation {
	id: string;
	type: ComplianceType;
	severity: 'minor' | 'major' | 'critical';
	description: string;
	location: BoundingBox;
	regulationReference: string;
	timestamp: number;
}

interface StreamConfig {
	quality: 'low' | 'medium' | 'high';
	fps: number;
	resolution: { width: number; height: number };
	compression: number;
}

interface CouncilMember {
	id: string;
	ws: WebSocket;
	permissions: string[];
	lastActivity: number;
	streamConfig: StreamConfig;
}

enum SafetyHazardType {
	NO_HELMET = 'no_helmet',
	NO_SAFETY_VEST = 'no_safety_vest',
	UNSAFE_SCAFFOLDING = 'unsafe_scaffolding',
	EXPOSED_WIRING = 'exposed_wiring',
	BLOCKED_EXIT = 'blocked_exit',
	UNSECURED_MATERIALS = 'unsecured_materials',
	MACHINERY_HAZARD = 'machinery_hazard',
	FALL_RISK = 'fall_risk'
}

enum ComplianceType {
	OSHA_VIOLATION = 'osha_violation',
	BUILDING_CODE = 'building_code',
	ENVIRONMENTAL = 'environmental',
	FIRE_SAFETY = 'fire_safety',
	ACCESSIBILITY = 'accessibility'
}

const FrameSchema = z.object({
	imageData: z.instanceof(Buffer),
	metadata: z.object({
		width: z.number().positive(),
		height: z.number().positive(),
		format: z.string(),
		source: z.string(),
		cameraId: z.string()
	})
});

const StreamConfigSchema = z.object({
	quality: z.enum(['low', 'medium', 'high']),
	fps: z.number().min(1).max(60),
	resolution: z.object({
		width: z.number().positive().max(4096),
		height: z.number().positive().max(2160)
	}),
	compression: z.number().min(0).max(100)
});

export class VisionPipelineService extends EventEmitter {
	private readonly logger = createLogger('VisionPipeline');
	private readonly modelCache: Map<string, GraphModel>;
	private readonly councilMembers: Map<string, CouncilMember>;
	private readonly frameBuffer: Map<string, VisionFrame>;
	private readonly processingQueue: VisionFrame[];
	private readonly streamLimiter: any;

	private isProcessing: boolean = false;
	private readonly maxFrameAge: number = 30000; // 30 seconds
	private readonly maxBufferSize: number = 100;
	private readonly processingInterval: number = 100; // 10 FPS processing

	constructor() {
		super();

		this.modelCache = new Map();
		this.councilMembers = new Map();
		this.frameBuffer = new Map();
		this.processingQueue = [];

		this.streamLimiter = rateLimit({
			windowMs: 1000, // 1 second
			max: 30, // Max 30 frames per second per IP
			message: 'Frame rate limit exceeded'
		});

		this.initializeModels();
		this.startProcessingLoop();
		this.startCleanupScheduler();
	}

	/**
	 * Initialize AI models for object detection, text recognition, and safety analysis
	 */
	private async initializeModels(): Promise<void> {
		try {
			this.logger.info('Loading AI models...');

			// Load object detection model (COCO-SSD or YOLOv5)
			const objectDetectionModel = await tf.loadGraphModel(
				process.env.OBJECT_DETECTION_MODEL_URL || 'file://./models/object-detection/model.json'
			);
			this.modelCache.set('objectDetection', objectDetectionModel);

			// Load safety equipment detection model
			const safetyModel = await tf.loadGraphModel(
				process.env.SAFETY_MODEL_URL || 'file://./models/safety-detection/model.json'
			);
			this.modelCache.set('safetyDetection', safetyModel);

			// Load compliance detection model
			const complianceModel = await tf.loadGraphModel(
				process.env.COMPLIANCE_MODEL_URL || 'file://./models/compliance/model.json'
			);
			this.modelCache.set('complianceDetection', complianceModel);

			this.logger.info('AI models loaded successfully');
		} catch (error) {
			this.logger.error('Failed to load AI models', { error });
			throw new Error('Model initialization failed');
		}
	}

	/**
	 * Register a council member for receiving vision streams
	 */
	public registerCouncilMember(
		memberId: string,
		ws: WebSocket,
		permissions: string[],
		streamConfig: StreamConfig
	): void {
		try {
			const validatedConfig = StreamConfigSchema.parse(streamConfig);

			const member: CouncilMember = {
				id: memberId,
				ws,
				permissions,
				lastActivity: Date.now(),
				streamConfig: validatedConfig
			};

			this.councilMembers.set(memberId, member);

			ws.on('close', () => {
				this.councilMembers.delete(memberId);
				this.logger.info(`Council member ${memberId} disconnected`);
			});

			ws.on('error', (error) => {
				this.logger.error(`WebSocket error for member ${memberId}`, { error });
				this.councilMembers.delete(memberId);
			});

			this.logger.info(`Council member ${memberId} registered for vision stream`);
		} catch (error) {
			this.logger.error('Failed to register council member', { error });
			throw new Error('Registration failed');
		}
	}

	/**
	 * Process incoming video frame through the vision pipeline
	 */
	public async processFrame(frameData: Buffer, metadata: FrameMetadata): Promise<string> {
		try {
			const validatedData = FrameSchema.parse({ imageData: frameData, metadata });

			const frameId = this.generateFrameId();
			const frame: VisionFrame = {
				id: frameId,
				timestamp: Date.now(),
				imageData: validatedData.imageData,
				metadata: validatedData.metadata
			};

			// Add to processing queue
			this.processingQueue.push(frame);
			this.frameBuffer.set(frameId, frame);

			// Limit buffer size
			if (this.processingQueue.length > this.maxBufferSize) {
				const oldFrame = this.processingQueue.shift();
				if (oldFrame) {
					this.frameBuffer.delete(oldFrame.id);
				}
			}

			this.logger.debug(`Frame ${frameId} added to processing queue`);
			return frameId;
		} catch (error) {
			this.logger.error('Frame processing failed', { error });
			throw new Error('Invalid frame data');
		}
	}

	/**
	 * Main processing loop for vision analysis
	 */
	private startProcessingLoop(): void {
		setInterval(async () => {
			if (this.isProcessing || this.processingQueue.length === 0) {
				return;
			}

			this.isProcessing = true;
			const frame = this.processingQueue.shift();

			if (frame) {
				try {
					const analysis = await this.analyzeFrame(frame);
					await this.broadcastToCouncil(frame, analysis);

					this.emit('frameAnalyzed', { frameId: frame.id, analysis });
				} catch (error) {
					this.logger.error(`Frame analysis failed for ${frame.id}`, { error });
					this.emit('analysisError', { frameId: frame.id, error });
				}
			}

			this.isProcessing = false;
		}, this.processingInterval);
	}

	/**
	 * Comprehensive frame analysis including all vision tasks
	 */
	private async analyzeFrame(frame: VisionFrame): Promise<SceneAnalysis> {
		const startTime = performance.now();

		try {
			// Preprocess image
			const preprocessedImage = await this.preprocessImage(frame.imageData);

			// Run parallel analysis tasks
			const [objects, text, safetyHazards, complianceViolations] = await Promise.all([
				this.detectObjects(preprocessedImage),
				this.extractText(preprocessedImage),
				this.detectSafetyHazards(preprocessedImage),
				this.checkCompliance(preprocessedImage)
			]);

			// Generate scene description
			const sceneDescription = this.generateSceneDescription(objects, text);

			// Calculate quality score
			const qualityScore = this.calculateQualityScore(frame, objects.length);

			const analysis: SceneAnalysis = {
				frameId: frame.id,
				timestamp: frame.timestamp,
				objects,
				text,
				safetyHazards,
				complianceViolations,
				sceneDescription,
				qualityScore
			};

			const processingTime = performance.now() - startTime;
			this.logger.debug(`Frame ${frame.id} analyzed in ${processingTime.toFixed(2)}ms`);

			return analysis;
		} catch (error) {
			this.logger.error(`Analysis failed for frame ${frame.id}`, { error });
			throw error;
		}
	}

	/**
	 * Preprocess image for optimal AI model performance
	 */
	private async preprocessImage(imageData: Buffer): Promise<Tensor3D> {
		try {
			// Resize and normalize image using Sharp
			const processedBuffer = await sharp(imageData)
				.resize(640, 640, { fit: 'contain', background: { r: 0, g: 0, b: 0 } })
				.jpeg({ quality: 90 })
				.toBuffer();

			// Convert to tensor
			const tensor = tf.node.decodeImage(processedBuffer, 3) as Tensor3D;
			return tensor.div(255.0); // Normalize to [0, 1]
		} catch (error) {
			this.logger.error('Image preprocessing failed', { error });
			throw new Error('Preprocessing failed');
		}
	}

	/**
	 * Detect objects in the frame using AI model
	 */
	private async detectObjects(imageTensor: Tensor3D): Promise<DetectedObject[]> {
		try {
			const model = this.modelCache.get('objectDetection');
			if (!model) {
				throw new Error('Object detection model not loaded');
			}

			const expandedTensor = imageTensor.expandDims(0);
			const predictions = await model.executeAsync(expandedTensor) as Tensor[];

			const boxes = await predictions[0].data();
			const classes = await predictions[1].data();
			const scores = await predictions[2].data();

			const objects: DetectedObject[] = [];
			const confidenceThreshold = 0.5;

			for (let i = 0; i < scores.length; i++) {
				if (scores[i] > confidenceThreshold) {
					objects.push({
						id: this.generateObjectId(),
						class: this.getClassLabel(classes[i]),
						confidence: scores[i],
						boundingBox: {
							x: boxes[i * 4],
							y: boxes[i * 4 + 1],
							width: boxes[i * 4 + 2] - boxes[i * 4],
							height: boxes[i * 4 + 3] - boxes[i * 4 + 1]
						},
						timestamp: Date.now()
					});
				}
			}

			// Cleanup tensors
			expandedTensor.dispose();
			predictions.forEach(tensor => tensor.dispose());

			return objects;
		} catch (error) {
			this.logger.error('Object detection failed', { error });
			return [];
		}
	}

	/**
	 * Extract text from the frame using OCR
	 */
	private async extractText(imageTensor: Tensor3D): Promise<ExtractedText[]> {
		try {
			// Convert tensor back to buffer for Tesseract
			const imageBuffer = await tf.node.encodeJpeg(imageTensor.mul(255).cast('int32'));

			const result = await Tesseract.recognize(imageBuffer, 'eng');

			const extractedText: ExtractedText[] = [];
			const data = (result as unknown as { data: { words?: { text: string; confidence: number; bbox: { x0: number; y0: number; x1: number; y1: number } }[] } }).data;

			if (data.words) {
				for (const word of data.words) {
					if (word.confidence > 60) { // Only include confident text
						extractedText.push({
							text: word.text,
							confidence: word.confidence / 100,
							boundingBox: {
								x: word.bbox.x0,
								y: word.bbox.y0,
								width: word.bbox.x1 - word.bbox.x0,
								height: word.bbox.y1 - word.bbox.y0
							},
							language: 'en'
						});
					}
				}
			}

			return extractedText;
		} catch (error) {
			this.logger.error('Text extraction failed', { error });
			return [];
		}
	}

	/**
	 * Detect safety hazards using specialized AI model
	 */
	private async detectSafetyHazards(imageTensor: Tensor3D): Promise<SafetyHazard[]> {
		try {
			const model = this.modelCache.get('safetyDetection');
			if (!model) {
				return [];
			}

			const expandedTensor = imageTensor.expandDims(0);
			const predictions = await model.executeAsync(expandedTensor) as Tensor[];

			const hazards: SafetyHazard[] = [];
			const hazardData = await predictions[0].data();
			const confidenceThreshold = 0.7;

			for (let i = 0; i < hazardData.length; i += 6) { // [x, y, w, h, class, confidence]
				const confidence = hazardData[i + 5];
				if (confidence > confidenceThreshold) {
					const hazardType = this.mapToSafetyHazardType(hazardData[i + 4]);
					const severity = this.calculateHazardSeverity(hazardType, confidence);

					hazards.push({
						id: this.generateHazardId(),
						type: hazardType,
						severity,
						location: {
							x: hazardData[i],
							y: hazardData[i + 1],
							width: hazardData[i + 2],
							height: hazardData[i + 3]
						},
						description: this.getHazardDescription(hazardType),
						timestamp: Date.now(),
						recommendations: this.getHazardRecommendations(hazardType)
					});
				}
			}

			expandedTensor.dispose();
			predictions.forEach(tensor => tensor.dispose());

			return hazards;
		} catch (error) {
			this.logger.error('Safety hazard detection failed', { error });
			return [];
		}
	}

	/**
	 * Check for compliance violations
	 */
	private async checkCompliance(imageTensor: Tensor3D): Promise<ComplianceViolation[]> {
		try {
			const model = this.modelCache.get('complianceDetection');
			if (!model) {
				return [];
			}

			const expandedTensor = imageTensor.expandDims(0);
			const predictions = await model.executeAsync(expandedTensor) as Tensor[];

			const violations: ComplianceViolation[] = [];
			const complianceData = await predictions[0].data();
			const confidenceThreshold = 0.6;

			for (let i = 0; i < complianceData.length; i += 6) {
				const confidence = complianceData[i + 5];
				if (confidence > confidenceThreshold) {
					const violationType = this.mapToComplianceType(complianceData[i + 4]);

					violations.push({
						id: this.generateViolationId(),
						type: violationType,
						severity: this.calculateViolationSeverity(violationType, confidence),
						description: this.getViolationDescription(violationType),
						location: {
							x: complianceData[i],
							y: complianceData[i + 1],
							width: complianceData[i + 2],
							height: complianceData[i + 3]
						},
						regulationReference: this.getRegulationReference(violationType),
						timestamp: Date.now()
					});
				}
			}

			expandedTensor.dispose();
			predictions.forEach(tensor => tensor.dispose());

			return violations;
		} catch (error) {
			this.logger.error('Compliance checking failed', { error });
			return [];
		}
	}

	/**
	 * Broadcast processed frame and analysis to all council members
	 */
	private async broadcastToCouncil(frame: VisionFrame, analysis: SceneAnalysis): Promise<void> {
		const broadcastPromises = Array.from(this.councilMembers.values()).map(async (member) => {
			try {
				if (member.ws.readyState !== WebSocket.OPEN) {
					return;
				}

				// Resize frame based on member's stream config
				const resizedFrame = await this.resizeFrame(frame, member.streamConfig);

				const streamData = {
					type: 'vision_stream',
					frameId: frame.id,
					timestamp: frame.timestamp,
					imageData: resizedFrame.toString('base64'),
					analysis: this.filterAnalysisForPermissions(analysis, member.permissions),
					metadata: frame.metadata
				};

				member.ws.send(JSON.stringify(streamData));
				member.lastActivity = Date.now();
			} catch (error) {
				this.logger.error(`Failed to broadcast to member ${member.id}`, { error });
				this.councilMembers.delete(member.id);
			}
		});

		await Promise.allSettled(broadcastPromises);
	}

	/**
	 * Resize frame based on stream configuration
	 */
	private async resizeFrame(frame: VisionFrame, config: StreamConfig): Promise<Buffer> {
		try {
			return await sharp(frame.imageData)
				.resize(config.resolution.width, config.resolution.height, { fit: 'contain' })
				.jpeg({ quality: 100 - config.compression })
				.toBuffer();
		} catch (error) {
			this.logger.error('Frame resizing failed', { error });
			return frame.imageData;
		}
	}

	/**
	 * Filter analysis data based on member permissions
	 */
	private filterAnalysisForPermissions(analysis: SceneAnalysis, permissions: string[]): Partial<SceneAnalysis> {
		const filtered: Partial<SceneAnalysis> = {
			frameId: analysis.frameId,
			timestamp: analysis.timestamp,
			qualityScore: analysis.qualityScore
		};

		if (permissions.includes('view_objects')) {
			filtered.objects = analysis.objects;
		}

		if (permissions.includes('view_text')) {
			filtered.text = analysis.text;
		}

		if (permissions.includes('view_safety')) {
			filtered.safetyHazards = analysis.safetyHazards;
		}

		if (permissions.includes('view_compliance')) {
			filtered.complianceViolations = analysis.complianceViolations;
		}

		if (permissions.includes('view_description')) {
			filtered.sceneDescription = analysis.sceneDescription;
		}

		return filtered;
	}

	/**
	 * Clean up old frames and inactive connections
	 */
	private startCleanupScheduler(): void {
		setInterval(() => {
			const now = Date.now();

			// Clean up old frames
			for (const [frameId, frame] of this.frameBuffer.entries()) {
				if (now - frame.timestamp > this.maxFrameAge) {
					this.frameBuffer.delete(frameId);
				}
			}

			// Clean up inactive council members
			for (const [memberId, member] of this.councilMembers.entries()) {
				if (now - member.lastActivity > 300000) { // 5 minutes inactive
					member.ws.close();
					this.councilMembers.delete(memberId);
					this.logger.info(`Removed inactive council member: ${memberId}`);
				}
			}
		}, 60000); // Run every minute
	}

	// Utility methods
	private generateFrameId(): string {
		return createHash('sha256').update(`${Date.now()}-${Math.random()}`).digest('hex').substring(0, 16);
	}

	private generateObjectId(): string {
		return `obj_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
	}

	private generateHazardId(): string {
		return `hazard_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
	}

	private generateViolationId(): string {
		return `violation_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
	}

	private getClassLabel(classIndex: number): string {
		const labels = ['person', 'vehicle', 'equipment', 'material', 'structure', 'tool'];
		return labels[Math.floor(classIndex)] || 'unknown';
	}

	private mapToSafetyHazardType(classIndex: number): SafetyHazardType {
		const types = [
			SafetyHazardType.NO_HELMET,
			SafetyHazardType.NO_SAFETY_VEST,
			SafetyHazardType.UNSAFE_SCAFFOLDING,
			SafetyHazardType.EXPOSED_WIRING,
			SafetyHazardType.BLOCKED_EXIT,
			SafetyHazardType.UNSECURED_MATERIALS,
			SafetyHazardType.MACHINERY_HAZARD,
			SafetyHazardType.FALL_RISK
		];
		return types[Math.floor(classIndex)] || SafetyHazardType.NO_HELMET;
	}

	private mapToComplianceType(classIndex: number): ComplianceType {
		const types = [
			ComplianceType.OSHA_VIOLATION,
			ComplianceType.BUILDING_CODE,
			ComplianceType.ENVIRONMENTAL,
			ComplianceType.FIRE_SAFETY,
			ComplianceType.ACCESSIBILITY
		];
		return types[Math.floor(classIndex)] || ComplianceType.OSHA_VIOLATION;
	}

	private calculateHazardSeverity(type: SafetyHazardType, confidence: number): 'low' | 'medium' | 'high' | 'critical' {
		const criticalTypes = [SafetyHazardType.EXPOSED_WIRING, SafetyHazardType.FALL_RISK];
		const highTypes = [SafetyHazardType.MACHINERY_HAZARD, SafetyHazardType.UNSAFE_SCAFFOLDING];

		if (criticalTypes.includes(type) && confidence > 0.8) return 'critical';
		if (highTypes.includes(type) && confidence > 0.7) return 'high';
		if (confidence > 0.8) return 'medium';
		return 'low';
	}

	private calculateViolationSeverity(type: ComplianceType, confidence: number): 'minor' | 'major' | 'critical' {
		if (type === ComplianceType.FIRE_SAFETY && confidence > 0.8) return 'critical';
		if (confidence > 0.8) return 'major';
		return 'minor';
	}

	private getHazardDescription(type: SafetyHazardType): string {
		const descriptions = {
			[SafetyHazardType.NO_HELMET]: 'Worker not wearing required safety helmet',
			[SafetyHazardType.NO_SAFETY_VEST]: 'Worker not wearing required safety vest',
			[SafetyHazardType.UNSAFE_SCAFFOLDING]: 'Scaffolding structure appears unsafe or improperly secured',
			[SafetyHazardType.EXPOSED_WIRING]: 'Electrical wiring exposed and potentially dangerous',
			[SafetyHazardType.BLOCKED_EXIT]: 'Emergency exit blocked or obstructed',
			[SafetyHazardType.UNSECURED_MATERIALS]: 'Construction materials not properly secured',
			[SafetyHazardType.MACHINERY_HAZARD]: 'Heavy machinery operating without proper safety measures',
			[SafetyHazardType.FALL_RISK]: 'Elevated work area without proper fall protection'
		};
		return descriptions[type] || 'Unknown safety hazard detected';
	}

	private getHazardRecommendations(type: SafetyHazardType): string[] {
		const recommendations = {
			[SafetyHazardType.NO_HELMET]: ['Ensure all workers wear OSHA-approved helmets', 'Implement helmet check at site entry'],
			[SafetyHazardType.NO_SAFETY_VEST]: ['Provide high-visibility safety vests', 'Enforce PPE requirements'],
			[SafetyHazardType.UNSAFE_SCAFFOLDING]: ['Inspect scaffolding structure', 'Ensure proper assembly and securing'],
			[SafetyHazardType.EXPOSED_WIRING]: ['Cover or secure electrical wiring', 'Contact qualified electrician'],
			[SafetyHazardType.BLOCKED_EXIT]: ['Clear emergency exit immediately', 'Mark exit paths clearly'],
			[SafetyHazardType.UNSECURED_MATERIALS]: ['Secure loose materials', 'Implement material management protocol'],
			[SafetyHazardType.MACHINERY_HAZARD]: ['Establish machinery safety perimeter', 'Ensure operator certification'],
			[SafetyHazardType.FALL_RISK]: ['Install fall protection equipment', 'Provide safety harnesses']
		};
		return recommendations[type] || ['Investigate and address safety concern'];
	}

	private getViolationDescription(type: ComplianceType): string {
		const descriptions = {
			[ComplianceType.OSHA_VIOLATION]: 'OSHA safety regulation violation detected',
			[ComplianceType.BUILDING_CODE]: 'Building code violation identified',
			[ComplianceType.ENVIRONMENTAL]: 'Environmental regulation violation',
			[ComplianceType.FIRE_SAFETY]: 'Fire safety code violation',
			[ComplianceType.ACCESSIBILITY]: 'ADA accessibility requirement violation'
		};
		return descriptions[type] || 'Compliance violation detected';
	}

	private getRegulationReference(type: ComplianceType): string {
		const references = {
			[ComplianceType.OSHA_VIOLATION]: '29 CFR 1926 - Construction Standards',
			[ComplianceType.BUILDING_CODE]: 'International Building Code (IBC)',
			[ComplianceType.ENVIRONMENTAL]: 'EPA Environmental Regulations',
			[ComplianceType.FIRE_SAFETY]: 'NFPA Fire Safety Codes',
			[ComplianceType.ACCESSIBILITY]: 'Americans with Disabilities Act (ADA)'
		};
		return references[type] || 'General Compliance Requirements';
	}

	private generateSceneDescription(objects: DetectedObject[], text: ExtractedText[]): string {
		const objectCounts = objects.reduce((acc, obj) => {
			acc[obj.class] = (acc[obj.class] || 0) + 1;
			return acc;
		}, {} as Record<string, number>);

		const descriptions = Object.entries(objectCounts)
			.map(([cls, count]) => `${count} ${cls}${count > 1 ? 's' : ''}`)
			.join(', ');

		const textContent = text.length > 0 ? ` Text visible: ${text.slice(0, 3).map(t => t.text).join(', ')}` : '';

		return `Construction site with ${descriptions}.${textContent}`;
	}

	private calculateQualityScore(frame: VisionFrame, objectCount: number): number {
		// Basic quality scoring based on image properties and detection count
		const baseScore = 50;
		const objectBonus = Math.min(objectCount * 5, 30);
		const resolutionBonus = Math.min((frame.metadata.width * frame.metadata.height) / 100000, 20);

		return Math.min(baseScore + objectBonus + resolutionBonus, 100);
	}

	/**
	 * Get current pipeline statistics
	 */
	public getStats(): object {
		return {
			activeConnections: this.councilMembers.size,
			queueLength: this.processingQueue.length,
			bufferSize: this.frameBuffer.size,
			isProcessing: this.isProcessing,
			modelsLoaded: this.modelCache.size
		};
	}

	/**
	 * Shutdown the vision pipeline gracefully
	 */
	public async shutdown(): Promise<void> {
		this.logger.info('Shutting down vision pipeline...');

		// Close all WebSocket connections
		for (const member of this.councilMembers.values()) {
			member.ws.close();
		}

		// Dispose of AI models
		for (const model of this.modelCache.values()) {
			model.dispose();
		}

		this.councilMembers.clear();
		this.frameBuffer.clear();
		this.processingQueue.length = 0;
	}
}

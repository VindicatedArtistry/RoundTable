import { EventEmitter } from 'events';
import WebSocket from 'ws';
import { Transform } from 'stream';
import ffmpeg from 'fluent-ffmpeg';
import { v4 as uuidv4 } from 'uuid';
import rateLimit from 'express-rate-limit';
import { createLogger, Logger } from '@/utils/logger';
import joi from 'joi';
import crypto from 'crypto';

interface VoiceCharacteristics {
	pitch: number; // 0.5 - 2.0
	speed: number; // 0.5 - 2.0
	tone: 'warm' | 'neutral' | 'authoritative' | 'calm';
	volume: number; // 0.0 - 1.0
	language: string;
	accent?: string;
}

interface CouncilMember {
	id: string;
	name: string;
	role: string;
	voiceProfile: VoiceCharacteristics;
	isActive: boolean;
	emergencyPriority: number; // 1-10, 10 being highest
}

interface AudioStreamConfig {
	sampleRate: number;
	channels: number;
	bitRate: number;
	codec: 'opus' | 'pcm' | 'aac';
}

interface TranscriptionResult {
	text: string;
	confidence: number;
	timestamp: Date;
	speakerId?: string;
	language: string;
}

interface TTSRequest {
	text: string;
	memberId: string;
	priority: 'normal' | 'high' | 'emergency';
	sessionId: string;
}

interface NoiseFilter {
	enabled: boolean;
	aggressiveness: number; // 1-3
	constructionMode: boolean;
	windSuppression: boolean;
}

const voiceCharacteristicsSchema = joi.object({
	pitch: joi.number().min(0.5).max(2.0).required(),
	speed: joi.number().min(0.5).max(2.0).required(),
	tone: joi.string().valid('warm', 'neutral', 'authoritative', 'calm').required(),
	volume: joi.number().min(0.0).max(1.0).required(),
	language: joi.string().required(),
	accent: joi.string().optional()
});

const ttsRequestSchema = joi.object({
	text: joi.string().max(5000).required(),
	memberId: joi.string().uuid().required(),
	priority: joi.string().valid('normal', 'high', 'emergency').required(),
	sessionId: joi.string().uuid().required()
});

export class VoiceSynthesisService extends EventEmitter {
	private logger = createLogger('VoiceSynthesis');
	private activeStreams: Map<string, WebSocket> = new Map();
	private councilMembers: Map<string, CouncilMember> = new Map();
	private audioConfig: AudioStreamConfig;
	private noiseFilter: NoiseFilter;
	private rateLimiter: any;
	private emergencyInterruptActive: boolean = false;
	private currentSpeaker?: string;

	constructor() {
		super();

		this.audioConfig = {
			sampleRate: parseInt(process.env.AUDIO_SAMPLE_RATE || '48000'),
			channels: parseInt(process.env.AUDIO_CHANNELS || '2'),
			bitRate: parseInt(process.env.AUDIO_BITRATE || '128000'),
			codec: (process.env.AUDIO_CODEC as 'opus' | 'pcm' | 'aac') || 'opus'
		};

		this.noiseFilter = {
			enabled: process.env.NOISE_FILTER_ENABLED === 'true',
			aggressiveness: parseInt(process.env.NOISE_FILTER_LEVEL || '2'),
			constructionMode: process.env.CONSTRUCTION_MODE === 'true',
			windSuppression: process.env.WIND_SUPPRESSION === 'true'
		};

		this.rateLimiter = rateLimit({
			windowMs: 60 * 1000, // 1 minute
			max: parseInt(process.env.VOICE_RATE_LIMIT || '100'),
			message: 'Too many voice synthesis requests',
			standardHeaders: true,
			legacyHeaders: false
		});

		this.initializeDefaultVoices();
	}

	/**
	 * Initialize default voice profiles for council members
	 */
	private initializeDefaultVoices(): void {
		const defaultMembers: CouncilMember[] = [
			{
				id: uuidv4(),
				name: 'Site Supervisor',
				role: 'supervisor',
				voiceProfile: {
					pitch: 1.0,
					speed: 1.1,
					tone: 'authoritative',
					volume: 0.9,
					language: 'en-US'
				},
				isActive: true,
				emergencyPriority: 9
			},
			{
				id: uuidv4(),
				name: 'Safety Officer',
				role: 'safety',
				voiceProfile: {
					pitch: 1.1,
					speed: 1.0,
					tone: 'calm',
					volume: 0.95,
					language: 'en-US'
				},
				isActive: true,
				emergencyPriority: 10
			},
			{
				id: uuidv4(),
				name: 'Project Manager',
				role: 'manager',
				voiceProfile: {
					pitch: 0.9,
					speed: 1.2,
					tone: 'neutral',
					volume: 0.85,
					language: 'en-US'
				},
				isActive: true,
				emergencyPriority: 7
			}
		];

		defaultMembers.forEach(member => {
			this.councilMembers.set(member.id, member);
		});

		this.logger.info('Default voice profiles initialized', {
			memberCount: defaultMembers.length
		});
	}

	/**
	 * Create a new WebRTC audio stream for real-time communication
	 */
	public async createAudioStream(sessionId: string, ws: WebSocket): Promise<void> {
		try {
			if (!sessionId || !ws) {
				throw new Error('Invalid session ID or WebSocket connection');
			}

			const streamId = `${sessionId}-${Date.now()}`;
			this.activeStreams.set(streamId, ws);

			// Configure WebSocket for binary audio data
			ws.binaryType = 'arraybuffer';

			ws.on('message', async (data: Buffer) => {
				try {
					await this.handleIncomingAudio(streamId, data);
				} catch (error) {
					this.logger.error('Error processing incoming audio', {
						streamId,
						error: error instanceof Error ? error.message : 'Unknown error'
					});
				}
			});

			ws.on('close', () => {
				this.activeStreams.delete(streamId);
				this.logger.info('Audio stream closed', { streamId });
			});

			ws.on('error', (error) => {
				this.logger.error('WebSocket error', { streamId, error: error.message });
				this.activeStreams.delete(streamId);
			});

			this.logger.info('Audio stream created', { streamId, sessionId });
		} catch (error) {
			this.logger.error('Failed to create audio stream', {
				sessionId,
				error: error instanceof Error ? error.message : 'Unknown error'
			});
			throw error;
		}
	}

	/**
	 * Process incoming audio data for speech-to-text conversion
	 */
	private async handleIncomingAudio(streamId: string, audioData: Buffer): Promise<void> {
		try {
			// Apply noise cancellation if enabled
			const processedAudio = this.noiseFilter.enabled
				? await this.applyNoiseFilter(audioData)
				: audioData;

			// Perform speech-to-text transcription
			const transcription = await this.transcribeAudio(processedAudio);

			if (transcription.confidence > 0.7) {
				this.emit('transcription', {
					streamId,
					transcription,
					timestamp: new Date()
				});

				// Check for emergency keywords
				if (this.detectEmergencyKeywords(transcription.text)) {
					await this.handleEmergencyInterrupt(transcription);
				}
			}
		} catch (error) {
			this.logger.error('Error handling incoming audio', {
				streamId,
				error: error instanceof Error ? error.message : 'Unknown error'
			});
		}
	}

	/**
	 * Apply noise cancellation and filtering for construction site usage
	 */
	private async applyNoiseFilter(audioData: Buffer): Promise<Buffer> {
		return new Promise((resolve, reject) => {
			const inputStream = new Transform({
				transform(chunk, encoding, callback) {
					callback(null, chunk);
				}
			});

			const outputChunks: Buffer[] = [];

			const ffmpegCommand = ffmpeg()
				.input(inputStream)
				.inputFormat('s16le')
				.audioFilters([
					`highpass=f=200`, // Remove low-frequency construction noise
					`lowpass=f=8000`, // Remove high-frequency noise
					`volume=${this.noiseFilter.aggressiveness * 0.3}`, // Adjust based on aggressiveness
					...(this.noiseFilter.constructionMode ? ['anlmdn=s=10:p=0.002:r=0.002'] : []),
					...(this.noiseFilter.windSuppression ? ['afftdn=nr=20:nf=-25'] : [])
				])
				.format('s16le')
				.on('error', reject)
				.on('end', () => {
					resolve(Buffer.concat(outputChunks));
				});

			ffmpegCommand.pipe().on('data', (chunk: Buffer) => {
				outputChunks.push(chunk);
			});

			inputStream.write(audioData);
			inputStream.end();
		});
	}

	/**
	 * Convert audio to text using speech recognition
	 */
	private async transcribeAudio(audioData: Buffer): Promise<TranscriptionResult> {
		try {
			// Mock implementation - replace with actual STT service
			const mockTranscription: TranscriptionResult = {
				text: this.mockSpeechRecognition(audioData),
				confidence: Math.random() * 0.3 + 0.7, // 0.7-1.0
				timestamp: new Date(),
				language: 'en-US'
			};

			return mockTranscription;
		} catch (error) {
			this.logger.error('Transcription failed', {
				error: error instanceof Error ? error.message : 'Unknown error'
			});
			throw error;
		}
	}

	/**
	 * Mock speech recognition for development
	 */
	private mockSpeechRecognition(audioData: Buffer): string {
		const phrases = [
			'Equipment status update requested',
			'Safety inspection complete',
			'Weather conditions changing',
			'Emergency: worker needs assistance',
			'Material delivery arriving',
			'Construction progress on schedule'
		];

		return phrases[Math.floor(Math.random() * phrases.length)];
	}

	/**
	 * Detect emergency keywords in transcribed text
	 */
	private detectEmergencyKeywords(text: string): boolean {
		const emergencyKeywords = [
			'emergency', 'help', 'accident', 'injury', 'fire', 'evacuation',
			'danger', 'urgent', 'medical', 'stop', 'halt', 'alert'
		];

		const lowerText = text.toLowerCase();
		return emergencyKeywords.some(keyword => lowerText.includes(keyword));
	}

	/**
	 * Handle emergency interrupt and prioritize communication
	 */
	private async handleEmergencyInterrupt(transcription: TranscriptionResult): Promise<void> {
		try {
			this.emergencyInterruptActive = true;
			this.logger.warn('Emergency interrupt activated', {
				transcription: transcription.text,
				timestamp: transcription.timestamp
			});

			// Find highest priority safety officer
			const safetyOfficer = Array.from(this.councilMembers.values())
				.filter(member => member.role === 'safety' && member.isActive)
				.sort((a, b) => b.emergencyPriority - a.emergencyPriority)[0];

			if (safetyOfficer) {
				const emergencyResponse = `Emergency detected: ${transcription.text}. Immediate response required.`;
				await this.synthesizeSpeech({
					text: emergencyResponse,
					memberId: safetyOfficer.id,
					priority: 'emergency',
					sessionId: uuidv4()
				});
			}

			this.emit('emergency', {
				type: 'voice_activated',
				transcription,
				responderId: safetyOfficer?.id,
				timestamp: new Date()
			});

			// Auto-disable after 5 minutes
			setTimeout(() => {
				this.emergencyInterruptActive = false;
				this.logger.info('Emergency interrupt auto-disabled');
			}, 5 * 60 * 1000);
		} catch (error) {
			this.logger.error('Error handling emergency interrupt', {
				error: error instanceof Error ? error.message : 'Unknown error'
			});
		}
	}

	/**
	 * Synthesize speech with council member's voice characteristics
	 */
	public async synthesizeSpeech(request: TTSRequest): Promise<Buffer> {
		try {
			const { error } = ttsRequestSchema.validate(request);
			if (error) {
				throw new Error(`Invalid TTS request: ${error.details[0].message}`);
			}

			const member = this.councilMembers.get(request.memberId);
			if (!member || !member.isActive) {
				throw new Error('Invalid or inactive council member');
			}

			// Check for emergency priority
			if (request.priority === 'emergency' || this.emergencyInterruptActive) {
				await this.interruptCurrentSpeech();
			}

			this.currentSpeaker = request.memberId;

			const audioBuffer = await this.generateSpeechAudio(request.text, member.voiceProfile);

			// Broadcast to all active streams
			this.broadcastAudio(audioBuffer, request.priority);

			this.logger.info('Speech synthesized', {
				memberId: request.memberId,
				textLength: request.text.length,
				priority: request.priority,
				sessionId: request.sessionId
			});

			return audioBuffer;
		} catch (error) {
			this.logger.error('Speech synthesis failed', {
				request,
				error: error instanceof Error ? error.message : 'Unknown error'
			});
			throw error;
		}
	}

	/**
	 * Generate audio buffer from text using voice characteristics
	 */
	private async generateSpeechAudio(text: string, voiceProfile: VoiceCharacteristics): Promise<Buffer> {
		return new Promise((resolve, reject) => {
			// Mock TTS implementation - replace with actual TTS service
			const mockAudio = this.generateMockAudio(text, voiceProfile);
			setTimeout(() => resolve(mockAudio), 100);
		});
	}

	/**
	 * Generate mock audio data for development
	 */
	private generateMockAudio(text: string, voiceProfile: VoiceCharacteristics): Buffer {
		const duration = text.length * 50; // Mock duration calculation
		const sampleCount = (this.audioConfig.sampleRate * duration) / 1000;
		const buffer = Buffer.alloc(sampleCount * 2); // 16-bit samples

		// Generate mock audio waveform based on voice characteristics
		for (let i = 0; i < sampleCount; i++) {
			const frequency = 440 * voiceProfile.pitch;
			const amplitude = 32767 * voiceProfile.volume;
			const sample = Math.sin(2 * Math.PI * frequency * i / this.audioConfig.sampleRate) * amplitude;
			buffer.writeInt16LE(sample, i * 2);
		}

		return buffer;
	}

	/**
	 * Interrupt current speech for emergency messages
	 */
	private async interruptCurrentSpeech(): Promise<void> {
		if (this.currentSpeaker) {
			this.logger.info('Interrupting current speech', {
				currentSpeaker: this.currentSpeaker
			});

			// Send interrupt signal to all streams
			this.activeStreams.forEach((ws) => {
				if (ws.readyState === WebSocket.OPEN) {
					ws.send(JSON.stringify({ type: 'interrupt', timestamp: Date.now() }));
				}
			});

			this.currentSpeaker = undefined;
		}
	}

	/**
	 * Broadcast audio to all active streams
	 */
	private broadcastAudio(audioBuffer: Buffer, priority: string): void {
		const message = {
			type: 'audio',
			data: audioBuffer.toString('base64'),
			priority,
			timestamp: Date.now()
		};

		this.activeStreams.forEach((ws, streamId) => {
			if (ws.readyState === WebSocket.OPEN) {
				try {
					ws.send(JSON.stringify(message));
				} catch (error) {
					this.logger.error('Failed to send audio to stream', {
						streamId,
						error: error instanceof Error ? error.message : 'Unknown error'
					});
					this.activeStreams.delete(streamId);
				}
			} else {
				this.activeStreams.delete(streamId);
			}
		});
	}

	/**
	 * Add or update council member voice profile
	 */
	public async updateCouncilMember(member: CouncilMember): Promise<void> {
		try {
			const { error } = voiceCharacteristicsSchema.validate(member.voiceProfile);
			if (error) {
				throw new Error(`Invalid voice characteristics: ${error.details[0].message}`);
			}

			this.councilMembers.set(member.id, {
				...member,
				id: member.id || uuidv4()
			});

			this.logger.info('Council member updated', {
				memberId: member.id,
				name: member.name,
				role: member.role
			});
		} catch (error) {
			this.logger.error('Failed to update council member', {
				member,
				error: error instanceof Error ? error.message : 'Unknown error'
			});
			throw error;
		}
	}

	/**
	 * Get active council members
	 */
	public getActiveMembers(): CouncilMember[] {
		return Array.from(this.councilMembers.values()).filter(member => member.isActive);
	}

	/**
	 * Update noise filter configuration
	 */
	public updateNoiseFilter(config: Partial<NoiseFilter>): void {
		this.noiseFilter = { ...this.noiseFilter, ...config };
		this.logger.info('Noise filter configuration updated', { config: this.noiseFilter });
	}

	/**
	 * Get current audio stream statistics
	 */
	public getStreamStats(): any {
		return {
			activeStreams: this.activeStreams.size,
			emergencyActive: this.emergencyInterruptActive,
			currentSpeaker: this.currentSpeaker,
			noiseFilterEnabled: this.noiseFilter.enabled,
			activeMemberCount: this.getActiveMembers().length
		};
	}

	/**
	 * Cleanup resources and close connections
	 */
	public async cleanup(): Promise<void> {
		this.activeStreams.forEach((ws) => {
			if (ws.readyState === WebSocket.OPEN) {
				ws.close();
			}
		});

		this.activeStreams.clear();
		this.emergencyInterruptActive = false;
		this.currentSpeaker = undefined;

		this.logger.info('Voice synthesis service cleaned up');
	}
}

export const voiceSynthesisService = new VoiceSynthesisService();

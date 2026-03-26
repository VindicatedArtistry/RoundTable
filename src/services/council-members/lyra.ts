import { z } from 'zod';
import { OpenAI } from 'openai';
import sanitizeHtml from 'sanitize-html';
import { createLogger } from '../../utils/logger';

const logger = createLogger('LyraService');
import { AppError } from '../../utils/errors';
import { validateBrandAlignment, BrandGuidelines, BrandAlignmentResult } from '../../utils/brand-validator';
import { SentimentAnalyzer } from '../../utils/sentiment-analyzer';
import { ContentOptimizer, OptimizedContent } from '../../utils/content-optimizer';
import { RateLimiter } from '../../middleware/rate-limiter';

// Environment validation
const envSchema = z.object({
	OPENAI_API_KEY: z.string().min(1).default('sk-placeholder'),
	BRAND_VOICE_MODEL: z.string().default('gpt-4'),
	SENTIMENT_API_KEY: z.string().min(1).default('placeholder'),
	MAX_CONTENT_LENGTH: z.string().default('5000').transform(Number),
});

const env = envSchema.parse(process.env);

// Input validation schemas
const draftPostSchema = z.object({
	topic: z.string().min(1).max(500),
	platform: z.enum(['twitter', 'linkedin', 'facebook', 'instagram', 'blog']),
	tone: z.enum(['professional', 'casual', 'inspirational', 'informative']).default('professional'),
	targetAudience: z.string().min(1).max(200),
	hashtags: z.array(z.string()).max(20).optional(),
	callToAction: z.string().max(200).optional(),
});

const productDescriptionSchema = z.object({
	productName: z.string().min(1).max(200),
	features: z.array(z.string()).min(1).max(20),
	targetMarket: z.string().min(1).max(300),
	pricePoint: z.enum(['budget', 'mid-range', 'premium', 'luxury']),
	platform: z.enum(['website', 'amazon', 'shopify', 'marketplace']),
	keyBenefits: z.array(z.string()).min(1).max(10),
	competitorAnalysis: z.string().max(1000).optional(),
});

const sentimentAnalysisSchema = z.object({
	content: z.string().min(1).max(10000),
	sources: z.array(z.string()).min(1).max(50),
	keywords: z.array(z.string()).min(1).max(20),
	timeframe: z.enum(['24h', '7d', '30d', '90d']).default('7d'),
	platforms: z.array(z.enum(['twitter', 'reddit', 'news', 'reviews', 'social'])),
});

const pressReleaseSchema = z.object({
	headline: z.string().min(10).max(200),
	announcement: z.string().min(50).max(2000),
	company: z.string().min(1).max(100),
	date: z.string().datetime(),
	contact: z.object({
		name: z.string().min(1).max(100),
		email: z.string().email(),
		phone: z.string().min(10).max(20),
	}),
	quotes: z.array(z.object({
		speaker: z.string().min(1).max(100),
		title: z.string().min(1).max(150),
		quote: z.string().min(20).max(500),
	})).max(5).optional(),
	boilerplate: z.string().min(50).max(500),
});

// Type definitions
interface BrandVoice {
	tone: string;
	personality: string[];
	vocabulary: string[];
	restrictions: string[];
	messaging: string[];
}

// Helper to convert BrandVoice to BrandGuidelines
function brandVoiceToGuidelines(voice: BrandVoice): BrandGuidelines {
	return {
		tone: [voice.tone, ...voice.personality],
		values: voice.vocabulary,
		prohibitedTerms: voice.restrictions,
		requiredElements: voice.messaging
	};
}

interface ContentResponse {
	content: string;
	metadata: {
		platform: string;
		wordCount: number;
		characterCount: number;
		estimatedReadTime: number;
		brandAlignment: number;
	};
	optimizations: {
		seo: string[];
		engagement: string[];
		accessibility: string[];
	};
}

interface SentimentResult {
	overallSentiment: 'positive' | 'negative' | 'neutral';
	score: number;
	breakdown: {
		positive: number;
		negative: number;
		neutral: number;
	};
	insights: string[];
	recommendations: string[];
	sources: Array<{
		platform: string;
		sentiment: string;
		volume: number;
		influence: number;
	}>;
}

class LyraAgentService {
	private openai: OpenAI;
	private sentimentAnalyzer: SentimentAnalyzer;
	private contentOptimizer: ContentOptimizer;
	private brandVoice: BrandVoice;

	constructor() {
		this.openai = new OpenAI({
			apiKey: env.OPENAI_API_KEY,
		});
		this.sentimentAnalyzer = new SentimentAnalyzer(env.SENTIMENT_API_KEY);
		this.contentOptimizer = new ContentOptimizer();
		this.brandVoice = this.initializeBrandVoice();
	}

	/**
	 * Initialize Lyra's brand voice configuration
	 */
	private initializeBrandVoice(): BrandVoice {
		return {
			tone: 'professional yet approachable',
			personality: ['innovative', 'trustworthy', 'customer-focused', 'forward-thinking'],
			vocabulary: ['solution', 'innovation', 'excellence', 'partnership', 'growth'],
			restrictions: ['avoid jargon', 'no controversial topics', 'maintain professional boundaries'],
			messaging: [
				'We empower businesses through innovative solutions',
				'Customer success is our primary focus',
				'Innovation drives everything we do',
				'Building lasting partnerships through excellence',
			],
		};
	}

	/**
	 * Generate brand-aligned social media posts optimized for specific platforms
	 */
	async draftPost(input: z.infer<typeof draftPostSchema>): Promise<ContentResponse> {
		try {
			const validatedInput = draftPostSchema.parse(input);

			// Sanitize inputs
			const sanitizedTopic = sanitizeHtml(validatedInput.topic);
			const sanitizedAudience = sanitizeHtml(validatedInput.targetAudience);

			logger.info('Lyra: Drafting post', {
				platform: validatedInput.platform,
				topic: sanitizedTopic
			});

			// Generate platform-specific constraints
			const platformConstraints = this.getPlatformConstraints(validatedInput.platform);

			const prompt = this.buildPostPrompt(
				sanitizedTopic,
				validatedInput.platform,
				validatedInput.tone,
				sanitizedAudience,
				validatedInput.hashtags,
				validatedInput.callToAction
			);

			const completion = await this.openai.chat.completions.create({
				model: env.BRAND_VOICE_MODEL,
				messages: [
					{
						role: 'system',
						content: `You are Lyra, a brand communication specialist. Your role is to create compelling, on-brand content that resonates with target audiences while maintaining brand consistency. Brand voice: ${JSON.stringify(this.brandVoice)}`,
					},
					{
						role: 'user',
						content: prompt,
					},
				],
				max_tokens: platformConstraints.maxTokens,
				temperature: 0.7,
			});

			const content = completion.choices[0]?.message?.content?.trim();
			if (!content) {
				throw new AppError('Failed to generate content', 500);
			}

			// Validate brand alignment
			const brandAlignmentResult = validateBrandAlignment(content, brandVoiceToGuidelines(this.brandVoice));
			if (brandAlignmentResult.score < 0.7) {
				logger.warn('Low brand alignment detected', { score: brandAlignmentResult.score });
			}

			// Optimize content for platform
			const optimizedResult = await this.contentOptimizer.optimizeForPlatform(
				content,
				validatedInput.platform as 'twitter' | 'linkedin' | 'blog' | 'email'
			);

			const metadata = {
				platform: validatedInput.platform,
				wordCount: content.split(' ').length,
				characterCount: content.length,
				estimatedReadTime: Math.ceil(content.split(' ').length / 200),
				brandAlignment: brandAlignmentResult.score,
			};

			const optimizations = await this.contentOptimizer.generateOptimizations(
				optimizedResult.optimized
			);

			logger.info('Lyra: Post drafted successfully', {
				platform: validatedInput.platform,
				brandAlignment: brandAlignmentResult.score,
			});

			return {
				content: optimizedResult.optimized,
				metadata,
				optimizations,
			};
		} catch (error) {
			const err = error as Error;
			logger.error('Lyra: Error drafting post', { error: err.message });
			throw new AppError('Failed to draft post', 500);
		}
	}

	/**
	 * Create compelling product descriptions optimized for conversion
	 */
	async writeProductDescription(input: z.infer<typeof productDescriptionSchema>): Promise<ContentResponse> {
		try {
			const validatedInput = productDescriptionSchema.parse(input);

			const sanitizedProduct = sanitizeHtml(validatedInput.productName);
			const sanitizedFeatures = validatedInput.features.map(f => sanitizeHtml(f));
			const sanitizedMarket = sanitizeHtml(validatedInput.targetMarket);

			logger.info('Lyra: Writing product description', {
				product: sanitizedProduct,
				platform: validatedInput.platform
			});

			const prompt = this.buildProductDescriptionPrompt(
				sanitizedProduct,
				sanitizedFeatures,
				sanitizedMarket,
				validatedInput.pricePoint,
				validatedInput.platform,
				validatedInput.keyBenefits,
				validatedInput.competitorAnalysis
			);

			const completion = await this.openai.chat.completions.create({
				model: env.BRAND_VOICE_MODEL,
				messages: [
					{
						role: 'system',
						content: `You are Lyra, an expert product copywriter. Create persuasive, SEO-optimized product descriptions that drive conversions while maintaining brand voice: ${JSON.stringify(this.brandVoice)}`,
					},
					{
						role: 'user',
						content: prompt,
					},
				],
				max_tokens: 1500,
				temperature: 0.6,
			});

			const content = completion.choices[0]?.message?.content?.trim();
			if (!content) {
				throw new AppError('Failed to generate product description', 500);
			}

			const brandAlignmentResult = validateBrandAlignment(content, brandVoiceToGuidelines(this.brandVoice));

			const optimizedResult = await this.contentOptimizer.optimizeForEcommerce(
				content,
				validatedInput.platform
			);

			const metadata = {
				platform: validatedInput.platform,
				wordCount: content.split(' ').length,
				characterCount: content.length,
				estimatedReadTime: Math.ceil(content.split(' ').length / 200),
				brandAlignment: brandAlignmentResult.score,
			};

			const optimizations = await this.contentOptimizer.generateEcommerceOptimizations(
				optimizedResult.optimized
			);

			logger.info('Lyra: Product description created', {
				product: sanitizedProduct,
				brandAlignment: brandAlignmentResult.score,
			});

			return {
				content: optimizedResult.optimized,
				metadata,
				optimizations,
			};
		} catch (error) {
			const err = error as Error;
			logger.error('Lyra: Error writing product description', { error: err.message });
			throw new AppError('Failed to write product description', 500);
		}
	}

	/**
	 * Analyze public sentiment across multiple platforms and provide actionable insights
	 */
	async analyzePublicSentiment(input: z.infer<typeof sentimentAnalysisSchema>): Promise<SentimentResult> {
		try {
			const validatedInput = sentimentAnalysisSchema.parse(input);

			const sanitizedContent = sanitizeHtml(validatedInput.content);
			const sanitizedKeywords = validatedInput.keywords.map(k => sanitizeHtml(k));

			logger.info('Lyra: Analyzing public sentiment', {
				keywords: sanitizedKeywords,
				platforms: validatedInput.platforms
			});

			// Collect sentiment data from multiple sources
			const sentimentPromises = validatedInput.platforms.map(platform =>
				this.sentimentAnalyzer.analyzePlatform(
					sanitizedContent,
					validatedInput.sources,
					sanitizedKeywords,
					[platform]
				)
			);

			const platformResults = await Promise.all(sentimentPromises);

			// Aggregate results
			const aggregatedSentiment = this.aggregateSentimentResults(platformResults);

			// Generate AI insights
			const insights = await this.generateSentimentInsights(
				sanitizedContent,
				aggregatedSentiment,
				sanitizedKeywords
			);

			const recommendations = await this.generateSentimentRecommendations(
				aggregatedSentiment,
				insights
			);

			logger.info('Lyra: Sentiment analysis completed', {
				overallSentiment: aggregatedSentiment.overallSentiment,
				score: aggregatedSentiment.score,
			});

			return {
				overallSentiment: aggregatedSentiment.overallSentiment,
				score: aggregatedSentiment.score,
				breakdown: aggregatedSentiment.breakdown,
				insights,
				recommendations,
				sources: platformResults.flatMap(r => r.sources),
			};
		} catch (error) {
			const err = error as Error;
			logger.error('Lyra: Error analyzing sentiment', { error: err.message });
			throw new AppError('Failed to analyze public sentiment', 500);
		}
	}

	/**
	 * Generate professional press releases that align with company narrative
	 */
	async generatePressRelease(input: z.infer<typeof pressReleaseSchema>): Promise<ContentResponse> {
		try {
			const validatedInput = pressReleaseSchema.parse(input);

			const sanitizedHeadline = sanitizeHtml(validatedInput.headline);
			const sanitizedAnnouncement = sanitizeHtml(validatedInput.announcement);
			const sanitizedCompany = sanitizeHtml(validatedInput.company);

			logger.info('Lyra: Generating press release', {
				headline: sanitizedHeadline,
				company: sanitizedCompany
			});

			const prompt = this.buildPressReleasePrompt(
				sanitizedHeadline,
				sanitizedAnnouncement,
				sanitizedCompany,
				validatedInput.date,
				validatedInput.contact,
				validatedInput.quotes,
				validatedInput.boilerplate
			);

			const completion = await this.openai.chat.completions.create({
				model: env.BRAND_VOICE_MODEL,
				messages: [
					{
						role: 'system',
						content: `You are Lyra, a professional PR specialist. Create formal, newsworthy press releases that follow AP style and maintain brand voice: ${JSON.stringify(this.brandVoice)}`,
					},
					{
						role: 'user',
						content: prompt,
					},
				],
				max_tokens: 2000,
				temperature: 0.5,
			});

			const content = completion.choices[0]?.message?.content?.trim();
			if (!content) {
				throw new AppError('Failed to generate press release', 500);
			}

			const brandAlignmentResult = validateBrandAlignment(content, brandVoiceToGuidelines(this.brandVoice));

			const optimizedResult = await this.contentOptimizer.optimizeForPR(content, 'press-release');

			const metadata = {
				platform: 'press-release',
				wordCount: content.split(' ').length,
				characterCount: content.length,
				estimatedReadTime: Math.ceil(content.split(' ').length / 200),
				brandAlignment: brandAlignmentResult.score,
			};

			const optimizations = await this.contentOptimizer.generatePROptimizations(optimizedResult.optimized);

			logger.info('Lyra: Press release generated', {
				headline: sanitizedHeadline,
				brandAlignment: brandAlignmentResult.score,
			});

			return {
				content: optimizedResult.optimized,
				metadata,
				optimizations,
			};
		} catch (error) {
			const err = error as Error;
			logger.error('Lyra: Error generating press release', { error: err.message });
			throw new AppError('Failed to generate press release', 500);
		}
	}

	// Private helper methods

	private getPlatformConstraints(platform: string): { maxChars: number; maxTokens: number } {
		const constraints: Record<string, { maxChars: number; maxTokens: number }> = {
			twitter: { maxChars: 280, maxTokens: 100 },
			linkedin: { maxChars: 3000, maxTokens: 800 },
			facebook: { maxChars: 2000, maxTokens: 600 },
			instagram: { maxChars: 2200, maxTokens: 650 },
			blog: { maxChars: 10000, maxTokens: 2500 },
		};
		return constraints[platform] || constraints.blog;
	}

	private buildPostPrompt(
		topic: string,
		platform: string,
		tone: string,
		audience: string,
		hashtags?: string[],
		callToAction?: string
	): string {
		return `Create a ${tone} ${platform} post about: ${topic}
    
Target audience: ${audience}
Platform: ${platform}
Brand voice guidelines: ${JSON.stringify(this.brandVoice)}

Requirements:
- Match the specified tone: ${tone}
- Optimize for ${platform} best practices
- Include relevant hashtags: ${hashtags?.join(', ') || 'generate appropriate ones'}
- Call to action: ${callToAction || 'generate an appropriate CTA'}
- Ensure brand alignment and authenticity
- Keep within platform character limits

Generate engaging, shareable content that drives meaningful interaction.`;
	}

	private buildProductDescriptionPrompt(
		productName: string,
		features: string[],
		targetMarket: string,
		pricePoint: string,
		platform: string,
		keyBenefits: string[],
		competitorAnalysis?: string
	): string {
		return `Write a compelling product description for: ${productName}

Product details:
- Features: ${features.join(', ')}
- Target market: ${targetMarket}
- Price point: ${pricePoint}
- Platform: ${platform}
- Key benefits: ${keyBenefits.join(', ')}
- Competitor context: ${competitorAnalysis || 'Not provided'}

Brand voice: ${JSON.stringify(this.brandVoice)}

Requirements:
- Highlight unique value proposition
- Address target market pain points
- Include persuasive, benefit-focused copy
- Optimize for ${platform} conversion
- Maintain ${pricePoint} positioning
- Include SEO-friendly language
- Create urgency and desire

Generate a description that converts browsers into buyers.`;
	}

	private buildPressReleasePrompt(
		headline: string,
		announcement: string,
		company: string,
		date: string,
		contact: any,
		quotes?: any[],
		boilerplate?: string
	): string {
		return `Write a professional press release with the following details:

Headline: ${headline}
Announcement: ${announcement}
Company: ${company}
Date: ${date}
Contact: ${JSON.stringify(contact)}
Quotes: ${JSON.stringify(quotes) || 'None provided - generate appropriate executive quotes'}
Boilerplate: ${boilerplate}

Brand voice: ${JSON.stringify(this.brandVoice)}

Requirements:
- Follow AP style guidelines
- Include compelling headline and subheadline
- Write attention-grabbing lead paragraph
- Include relevant quotes from executives
- Provide company background
- Add contact information
- Maintain professional, newsworthy tone
- Ensure brand message consistency

Create a press release that journalists will want to cover.`;
	}

	private aggregateSentimentResults(platformResults: any[]) {
		const totalVolume = platformResults.reduce((sum, result) => sum + result.volume, 0);

		let weightedPositive = 0;
		let weightedNegative = 0;
		let weightedNeutral = 0;

		platformResults.forEach(result => {
			const weight = result.volume / totalVolume;
			weightedPositive += result.positive * weight;
			weightedNegative += result.negative * weight;
			weightedNeutral += result.neutral * weight;
		});

		const overallScore = (weightedPositive - weightedNegative + 1) / 2;

		let overallSentiment: 'positive' | 'negative' | 'neutral';
		if (overallScore > 0.6) overallSentiment = 'positive';
		else if (overallScore < 0.4) overallSentiment = 'negative';
		else overallSentiment = 'neutral';

		return {
			overallSentiment,
			score: overallScore,
			breakdown: {
				positive: weightedPositive,
				negative: weightedNegative,
				neutral: weightedNeutral,
			},
		};
	}

	private async generateSentimentInsights(
		content: string,
		sentiment: any,
		keywords: string[]
	): Promise<string[]> {
		const prompt = `Analyze the sentiment data and provide strategic insights:

Content context: ${content}
Sentiment breakdown: ${JSON.stringify(sentiment)}
Keywords: ${keywords.join(', ')}

Provide 3-5 actionable insights about public perception, trends, and opportunities.`;

		const completion = await this.openai.chat.completions.create({
			model: env.BRAND_VOICE_MODEL,
			messages: [{ role: 'user', content: prompt }],
			max_tokens: 500,
			temperature: 0.3,
		});

		const insights = completion.choices[0]?.message?.content?.trim();
		return insights ? insights.split('\n').filter(line => line.trim()) : [];
	}

	private async generateSentimentRecommendations(
		sentiment: any,
		insights: string[]
	): Promise<string[]> {
		const prompt = `Based on sentiment analysis and insights, provide strategic recommendations:

Sentiment data: ${JSON.stringify(sentiment)}
Key insights: ${insights.join('; ')}

Provide 3-5 specific, actionable recommendations for improving public perception and brand positioning.`;

		const completion = await this.openai.chat.completions.create({
			model: env.BRAND_VOICE_MODEL,
			messages: [{ role: 'user', content: prompt }],
			max_tokens: 500,
			temperature: 0.3,
		});

		const recommendations = completion.choices[0]?.message?.content?.trim();
		return recommendations ? recommendations.split('\n').filter(line => line.trim()) : [];
	}
}

export const lyraAgent = new LyraAgentService();
export { LyraAgentService };
export type { ContentResponse, SentimentResult, BrandVoice };

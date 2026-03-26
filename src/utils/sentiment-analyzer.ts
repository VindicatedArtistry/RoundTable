/**
 * Sentiment analysis utilities for content optimization
 */

export interface SentimentResult {
  score: number; // -1 to 1, where -1 is very negative, 1 is very positive
  magnitude: number; // 0 to 1, emotional intensity
  label: 'positive' | 'negative' | 'neutral';
  confidence: number;
  emotions: {
    joy: number;
    trust: number;
    fear: number;
    surprise: number;
    sadness: number;
    disgust: number;
    anger: number;
    anticipation: number;
  };
}

export interface ContentAnalysis {
  sentiment: SentimentResult;
  readability: number;
  engagement: number;
  brandAlignment: number;
  recommendations: string[];
}

/**
 * Mock sentiment analyzer for demo purposes
 * In production, this would integrate with services like Google Cloud Natural Language API
 */
export class SentimentAnalyzer {
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  private positiveWords = [
    'amazing', 'excellent', 'wonderful', 'fantastic', 'great', 'good', 'positive',
    'innovative', 'breakthrough', 'revolutionary', 'inspiring', 'empowering',
    'regenerative', 'symbiotic', 'collaborative', 'transformative', 'visionary'
  ];

  private negativeWords = [
    'terrible', 'awful', 'horrible', 'bad', 'negative', 'disappointing',
    'frustrating', 'broken', 'failed', 'problematic', 'concerning', 'destructive'
  ];

  private brandPositiveWords = [
    'regenerative', 'symbiotic', 'collaborative', 'authentic', 'purposeful',
    'sustainable', 'ethical', 'transparent', 'innovative', 'empowering'
  ];

  /**
   * Analyze sentiment of text content
   */
  async analyzeSentiment(text: string): Promise<SentimentResult> {
    const words = text.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;
    let brandPositiveCount = 0;

    // Count positive and negative words
    for (const word of words) {
      if (this.positiveWords.some(pw => word.includes(pw))) {
        positiveCount++;
      }
      if (this.negativeWords.some(nw => word.includes(nw))) {
        negativeCount++;
      }
      if (this.brandPositiveWords.some(bp => word.includes(bp))) {
        brandPositiveCount++;
      }
    }

    // Calculate sentiment score
    const totalSentimentWords = positiveCount + negativeCount;
    let score = 0;
    
    if (totalSentimentWords > 0) {
      score = (positiveCount - negativeCount) / totalSentimentWords;
    }

    // Add brand alignment bonus
    score += (brandPositiveCount / words.length) * 0.5;
    score = Math.max(-1, Math.min(1, score));

    // Calculate magnitude (emotional intensity)
    const magnitude = Math.min(1, totalSentimentWords / words.length * 5);

    // Determine label
    let label: 'positive' | 'negative' | 'neutral';
    if (score > 0.1) label = 'positive';
    else if (score < -0.1) label = 'negative';
    else label = 'neutral';

    // Calculate confidence
    const confidence = Math.min(1, Math.abs(score) + (magnitude * 0.3));

    // Mock emotion analysis
    const emotions = {
      joy: Math.max(0, score * 0.8 + Math.random() * 0.2),
      trust: brandPositiveCount > 0 ? 0.7 + Math.random() * 0.3 : Math.random() * 0.5,
      fear: Math.max(0, -score * 0.6 + Math.random() * 0.2),
      surprise: Math.random() * 0.4,
      sadness: Math.max(0, -score * 0.7 + Math.random() * 0.2),
      disgust: Math.max(0, -score * 0.5 + Math.random() * 0.2),
      anger: Math.max(0, -score * 0.8 + Math.random() * 0.2),
      anticipation: positiveCount > 0 ? 0.6 + Math.random() * 0.4 : Math.random() * 0.5
    };

    return {
      score,
      magnitude,
      label,
      confidence,
      emotions
    };
  }

  /**
   * Analyze content comprehensively
   */
  async analyzeContent(text: string): Promise<ContentAnalysis> {
    const sentiment = await this.analyzeSentiment(text);
    
    // Calculate readability (simplified)
    const words = text.split(/\s+/).length;
    const sentences = text.split(/[.!?]+/).length;
    const avgWordsPerSentence = words / sentences;
    const readability = Math.max(0, Math.min(1, 1 - (avgWordsPerSentence - 15) / 20));

    // Calculate engagement potential
    const engagementFactors = [
      text.includes('?') ? 0.2 : 0, // Questions increase engagement
      text.includes('!') ? 0.1 : 0, // Exclamations add energy
      /\b(you|your)\b/gi.test(text) ? 0.2 : 0, // Direct address
      sentiment.score > 0.3 ? 0.3 : 0, // Positive sentiment
      sentiment.emotions.anticipation > 0.6 ? 0.2 : 0 // Anticipation
    ];
    const engagement = engagementFactors.reduce((sum, factor) => sum + factor, 0);

    // Calculate brand alignment
    const brandWords = this.brandPositiveWords.filter(word => 
      text.toLowerCase().includes(word)
    ).length;
    const brandAlignment = Math.min(1, brandWords / 5); // Max score with 5+ brand words

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (sentiment.score < 0.2) {
      recommendations.push('Consider adding more positive language to improve sentiment');
    }
    
    if (readability < 0.6) {
      recommendations.push('Simplify sentence structure for better readability');
    }
    
    if (engagement < 0.5) {
      recommendations.push('Add questions or calls-to-action to increase engagement');
    }
    
    if (brandAlignment < 0.3) {
      recommendations.push('Include more brand-aligned terminology like "regenerative" or "symbiotic"');
    }

    if (sentiment.emotions.trust < 0.5) {
      recommendations.push('Add credibility indicators to build trust');
    }

    return {
      sentiment,
      readability,
      engagement,
      brandAlignment,
      recommendations
    };
  }

  /**
   * Compare sentiment across multiple pieces of content
   */
  async compareSentiments(contents: string[]): Promise<{
    averageSentiment: number;
    consistencyScore: number;
    outliers: number[];
    recommendation: string;
  }> {
    const sentiments = await Promise.all(
      contents.map(content => this.analyzeSentiment(content))
    );

    const scores = sentiments.map(s => s.score);
    const averageSentiment = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    // Calculate consistency (how similar all scores are)
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - averageSentiment, 2), 0) / scores.length;
    const consistencyScore = Math.max(0, 1 - variance);

    // Identify outliers (scores more than 1 standard deviation away)
    const stdDev = Math.sqrt(variance);
    const outliers = scores
      .map((score, index) => ({ score, index }))
      .filter(({ score }) => Math.abs(score - averageSentiment) > stdDev)
      .map(({ index }) => index);

    let recommendation = '';
    if (consistencyScore < 0.7) {
      recommendation = 'Consider maintaining more consistent tone across all content';
    } else if (averageSentiment < 0.2) {
      recommendation = 'Overall sentiment could be more positive';
    } else {
      recommendation = 'Sentiment analysis looks good across all content';
    }

    return {
      averageSentiment,
      consistencyScore,
      outliers,
      recommendation
    };
  }

  /**
   * Analyze sentiment across multiple platforms
   */
  async analyzePlatform(content: string, sources: string[], _keywords: string[], _platforms: string[]): Promise<{
    overallSentiment: 'positive' | 'negative' | 'neutral';
    score: number;
    breakdown: { positive: number; negative: number; neutral: number };
    insights: string[];
    recommendations: string[];
    sources: Array<{ platform: string; sentiment: string; volume: number; influence: number }>;
  }> {
    const sentiment = await this.analyzeSentiment(content);

    return {
      overallSentiment: sentiment.label,
      score: sentiment.score,
      breakdown: {
        positive: sentiment.emotions.joy,
        negative: sentiment.emotions.anger,
        neutral: 1 - sentiment.emotions.joy - sentiment.emotions.anger
      },
      insights: [
        `Overall sentiment is ${sentiment.label} with ${Math.round(sentiment.confidence * 100)}% confidence`,
        `Emotional magnitude: ${Math.round(sentiment.magnitude * 100)}%`
      ],
      recommendations: [
        sentiment.score < 0.3 ? 'Consider more positive framing' : 'Good sentiment levels',
        'Monitor social channels for changes'
      ],
      sources: sources.map(source => ({
        platform: source,
        sentiment: sentiment.label,
        volume: Math.floor(Math.random() * 1000) + 100,
        influence: Math.random() * 0.8 + 0.2
      }))
    };
  }
}
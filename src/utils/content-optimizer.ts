/**
 * Content optimization utilities for Lyra's communications
 */

export interface OptimizationSuggestion {
  type: 'tone' | 'structure' | 'engagement' | 'seo' | 'accessibility' | 'brand';
  priority: 'low' | 'medium' | 'high';
  description: string;
  original: string;
  suggested: string;
  impact: number; // 0-1 scale
}

export interface ContentMetrics {
  readabilityScore: number;
  engagementScore: number;
  seoScore: number;
  brandAlignmentScore: number;
  accessibilityScore: number;
  overallScore: number;
}

export interface OptimizedContent {
  original: string;
  optimized: string;
  metrics: ContentMetrics;
  suggestions: OptimizationSuggestion[];
  improvements: {
    readability: number;
    engagement: number;
    seo: number;
    brandAlignment: number;
    accessibility: number;
  };
}

/**
 * Content optimizer for creating compelling, brand-aligned communications
 */
export class ContentOptimizer {
  private brandKeywords = [
    'regenerative', 'symbiotic', 'collaborative', 'sustainable',
    'authentic', 'transparent', 'innovative', 'empowering'
  ];

  private engagementWords = [
    'discover', 'transform', 'achieve', 'unlock', 'revolutionize',
    'experience', 'imagine', 'create', 'build', 'inspire'
  ];

  private powerWords = [
    'breakthrough', 'game-changing', 'cutting-edge', 'pioneering',
    'unprecedented', 'remarkable', 'extraordinary', 'visionary'
  ];

  /**
   * Analyze content and provide optimization suggestions
   */
  async optimizeContent(content: string, targetAudience: string = 'general'): Promise<OptimizedContent> {
    const originalMetrics = this.calculateMetrics(content);
    const suggestions = this.generateSuggestions(content, originalMetrics, targetAudience);
    
    // Apply suggestions to create optimized version
    let optimizedContent = content;
    const appliedSuggestions = suggestions.filter(s => s.priority === 'high' || s.priority === 'medium');
    
    for (const suggestion of appliedSuggestions) {
      if (suggestion.type === 'tone' || suggestion.type === 'engagement') {
        optimizedContent = optimizedContent.replace(suggestion.original, suggestion.suggested);
      }
    }

    // Add brand keywords if missing
    if (!this.brandKeywords.some(keyword => content.toLowerCase().includes(keyword))) {
      optimizedContent = this.addBrandContext(optimizedContent);
    }

    // Improve structure if needed
    if (originalMetrics.readabilityScore < 0.6) {
      optimizedContent = this.improveStructure(optimizedContent);
    }

    const optimizedMetrics = this.calculateMetrics(optimizedContent);
    
    const improvements = {
      readability: optimizedMetrics.readabilityScore - originalMetrics.readabilityScore,
      engagement: optimizedMetrics.engagementScore - originalMetrics.engagementScore,
      seo: optimizedMetrics.seoScore - originalMetrics.seoScore,
      brandAlignment: optimizedMetrics.brandAlignmentScore - originalMetrics.brandAlignmentScore,
      accessibility: optimizedMetrics.accessibilityScore - originalMetrics.accessibilityScore
    };

    return {
      original: content,
      optimized: optimizedContent,
      metrics: optimizedMetrics,
      suggestions,
      improvements
    };
  }

  /**
   * Calculate various content metrics
   */
  private calculateMetrics(content: string): ContentMetrics {
    // Readability score (simplified Flesch-Kincaid style)
    const words = content.split(/\s+/);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgWordsPerSentence = words.length / sentences.length;
    const longWords = words.filter(word => word.length > 6).length;
    const readabilityScore = Math.max(0, Math.min(1, 1 - (avgWordsPerSentence / 20) - (longWords / words.length)));

    // Engagement score
    const engagementFactors = [
      /\?/.test(content) ? 0.2 : 0, // Questions
      /!/.test(content) ? 0.1 : 0, // Exclamations
      /\b(you|your|we|us|our)\b/gi.test(content) ? 0.3 : 0, // Personal pronouns
      this.engagementWords.some(word => content.toLowerCase().includes(word)) ? 0.2 : 0,
      /\b(action|click|discover|learn|explore)\b/gi.test(content) ? 0.2 : 0 // Action words
    ];
    const engagementScore = Math.min(1, engagementFactors.reduce((sum, factor) => sum + factor, 0));

    // SEO score (simplified)
    const hasTitle = /^.{1,60}/.test(content);
    const hasKeywords = this.brandKeywords.some(keyword => content.toLowerCase().includes(keyword));
    const hasCallToAction = /\b(contact|learn more|discover|get started|sign up)\b/gi.test(content);
    const seoScore = (hasTitle ? 0.3 : 0) + (hasKeywords ? 0.4 : 0) + (hasCallToAction ? 0.3 : 0);

    // Brand alignment score
    const brandWordCount = this.brandKeywords.filter(keyword => 
      content.toLowerCase().includes(keyword)
    ).length;
    const brandAlignmentScore = Math.min(1, brandWordCount / 3);

    // Accessibility score
    const hasAltTextReference = /alt[\s=]|alternative text|screen reader/gi.test(content);
    const hasStructure = /\b(heading|section|list|table)\b/gi.test(content);
    const hasPlainLanguage = words.filter(word => word.length <= 6).length / words.length;
    const accessibilityScore = (hasAltTextReference ? 0.3 : 0) + 
                              (hasStructure ? 0.3 : 0) + 
                              (hasPlainLanguage * 0.4);

    // Overall score
    const overallScore = (
      readabilityScore * 0.25 +
      engagementScore * 0.25 +
      seoScore * 0.2 +
      brandAlignmentScore * 0.2 +
      accessibilityScore * 0.1
    );

    return {
      readabilityScore,
      engagementScore,
      seoScore,
      brandAlignmentScore,
      accessibilityScore,
      overallScore
    };
  }

  /**
   * Generate optimization suggestions
   */
  private generateSuggestions(content: string, metrics: ContentMetrics, targetAudience: string): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // Readability suggestions
    if (metrics.readabilityScore < 0.6) {
      suggestions.push({
        type: 'structure',
        priority: 'high',
        description: 'Break up long sentences for better readability',
        original: 'long sentences',
        suggested: 'shorter, clearer sentences',
        impact: 0.8
      });
    }

    // Engagement suggestions
    if (metrics.engagementScore < 0.5) {
      if (!/\?/.test(content)) {
        suggestions.push({
          type: 'engagement',
          priority: 'medium',
          description: 'Add questions to increase engagement',
          original: 'statement',
          suggested: 'question to engage reader',
          impact: 0.6
        });
      }

      if (!this.engagementWords.some(word => content.toLowerCase().includes(word))) {
        suggestions.push({
          type: 'engagement',
          priority: 'medium',
          description: 'Use more engaging action words',
          original: 'passive language',
          suggested: 'active, engaging language',
          impact: 0.7
        });
      }
    }

    // Brand alignment suggestions
    if (metrics.brandAlignmentScore < 0.4) {
      suggestions.push({
        type: 'brand',
        priority: 'high',
        description: 'Include more brand-aligned terminology',
        original: 'generic terms',
        suggested: 'regenerative, symbiotic, collaborative terms',
        impact: 0.9
      });
    }

    // SEO suggestions
    if (metrics.seoScore < 0.6) {
      if (!this.brandKeywords.some(keyword => content.toLowerCase().includes(keyword))) {
        suggestions.push({
          type: 'seo',
          priority: 'medium',
          description: 'Include relevant keywords for better SEO',
          original: 'content without keywords',
          suggested: 'content with strategic keyword placement',
          impact: 0.7
        });
      }
    }

    // Accessibility suggestions
    if (metrics.accessibilityScore < 0.6) {
      suggestions.push({
        type: 'accessibility',
        priority: 'medium',
        description: 'Improve accessibility with clearer structure',
        original: 'complex structure',
        suggested: 'clear headings and simple language',
        impact: 0.6
      });
    }

    // Audience-specific suggestions
    if (targetAudience === 'technical') {
      suggestions.push({
        type: 'tone',
        priority: 'medium',
        description: 'Add technical depth for technical audience',
        original: 'general language',
        suggested: 'technical terminology and specifics',
        impact: 0.5
      });
    } else if (targetAudience === 'executive') {
      suggestions.push({
        type: 'tone',
        priority: 'medium',
        description: 'Focus on business value and ROI',
        original: 'feature-focused',
        suggested: 'business-value focused',
        impact: 0.7
      });
    }

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Add brand context to content
   */
  private addBrandContext(content: string): string {
    const brandContext = [
      "Through our regenerative approach,",
      "Building symbiotic relationships,",
      "With authentic collaboration,",
      "Creating sustainable innovation,"
    ];

    const randomContext = brandContext[Math.floor(Math.random() * brandContext.length)];
    return `${randomContext} ${content}`;
  }

  /**
   * Improve content structure
   */
  private improveStructure(content: string): string {
    // Split long sentences
    const sentences = content.split(/\. /).map(sentence => {
      if (sentence.split(' ').length > 20) {
        // Try to split at conjunctions
        return sentence.replace(/,\s+(and|but|or|however|therefore)\s+/g, '. $1 ');
      }
      return sentence;
    });

    return sentences.join('. ');
  }

  /**
   * Optimize for specific platforms
   */
  async optimizeForPlatform(content: string, platform: 'twitter' | 'linkedin' | 'blog' | 'email'): Promise<OptimizedContent> {
    let targetAudience = 'general';
    let maxLength = Infinity;

    switch (platform) {
      case 'twitter':
        maxLength = 280;
        targetAudience = 'general';
        break;
      case 'linkedin':
        targetAudience = 'professional';
        break;
      case 'blog':
        targetAudience = 'detailed';
        break;
      case 'email':
        targetAudience = 'personal';
        break;
    }

    let optimized = await this.optimizeContent(content, targetAudience);

    // Platform-specific adjustments
    if (platform === 'twitter' && optimized.optimized.length > maxLength) {
      optimized.optimized = this.shortenForTwitter(optimized.optimized);
    }

    if (platform === 'linkedin') {
      optimized.optimized = this.addLinkedInContext(optimized.optimized);
    }

    return optimized;
  }

  /**
   * Shorten content for Twitter
   */
  private shortenForTwitter(content: string): string {
    if (content.length <= 280) return content;

    // Remove unnecessary words and shorten
    let shortened = content
      .replace(/\b(very|really|quite|extremely)\s+/gi, '')
      .replace(/\b(that|which)\s+/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (shortened.length > 280) {
      shortened = shortened.substring(0, 276) + '...';
    }

    return shortened;
  }

  /**
   * Add LinkedIn professional context
   */
  private addLinkedInContext(content: string): string {
    if (!content.includes('professional') && !content.includes('industry')) {
      return `In today's evolving professional landscape, ${content}`;
    }
    return content;
  }

  /**
   * Generate optimizations for content
   */
  async generateOptimizations(content: string): Promise<{
    seo: string[];
    engagement: string[];
    accessibility: string[];
  }> {
    const optimized = await this.optimizeContent(content);
    return {
      seo: optimized.suggestions.filter(s => s.type === 'seo').map(s => s.description),
      engagement: optimized.suggestions.filter(s => s.type === 'engagement').map(s => s.description),
      accessibility: optimized.suggestions.filter(s => s.type === 'accessibility').map(s => s.description)
    };
  }

  /**
   * Optimize content for e-commerce platforms
   */
  async optimizeForEcommerce(content: string, _platform: string): Promise<OptimizedContent> {
    return this.optimizeContent(content, 'ecommerce');
  }

  /**
   * Generate e-commerce specific optimizations
   */
  async generateEcommerceOptimizations(content: string): Promise<{
    seo: string[];
    engagement: string[];
    accessibility: string[];
  }> {
    return this.generateOptimizations(content);
  }

  /**
   * Optimize content for PR purposes
   */
  async optimizeForPR(content: string, _platform: string): Promise<OptimizedContent> {
    return this.optimizeContent(content, 'professional');
  }

  /**
   * Generate PR-specific optimizations
   */
  async generatePROptimizations(content: string): Promise<{
    seo: string[];
    engagement: string[];
    accessibility: string[];
  }> {
    return this.generateOptimizations(content);
  }
}
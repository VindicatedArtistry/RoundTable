/**
 * Brand alignment validation utilities for Lyra's communications
 */

export interface BrandAlignmentResult {
  aligned: boolean;
  score: number;
  violations: string[];
  recommendations: string[];
}

export interface BrandGuidelines {
  tone: string[];
  values: string[];
  prohibitedTerms: string[];
  requiredElements: string[];
}

/**
 * Default brand guidelines for Vindicated Artistry
 */
const VINDICATED_ARTISTRY_BRAND: BrandGuidelines = {
  tone: ['authentic', 'innovative', 'purposeful', 'regenerative', 'empowering'],
  values: ['transparency', 'sustainability', 'symbiotic-technology', 'human-ai-collaboration', 'ethical-innovation'],
  prohibitedTerms: ['disruption', 'dominance', 'control', 'replacement', 'obsolete'],
  requiredElements: ['mission-alignment', 'constitutional-compliance', 'regenerative-purpose']
};

/**
 * Validate content against brand guidelines
 */
export function validateBrandAlignment(content: string, guidelines: BrandGuidelines = VINDICATED_ARTISTRY_BRAND): BrandAlignmentResult {
  const violations: string[] = [];
  const recommendations: string[] = [];
  let score = 1.0;

  // Check for prohibited terms
  const lowerContent = content.toLowerCase();
  for (const term of guidelines.prohibitedTerms) {
    if (lowerContent.includes(term.toLowerCase())) {
      violations.push(`Contains prohibited term: "${term}"`);
      recommendations.push(`Replace "${term}" with more aligned terminology`);
      score -= 0.2;
    }
  }

  // Check for brand tone alignment
  const toneMatches = guidelines.tone.filter(tone => 
    lowerContent.includes(tone.toLowerCase())
  ).length;
  
  if (toneMatches === 0) {
    violations.push('Content does not reflect brand tone');
    recommendations.push(`Consider incorporating terms like: ${guidelines.tone.join(', ')}`);
    score -= 0.15;
  }

  // Check for value alignment
  const valueMatches = guidelines.values.filter(value => 
    lowerContent.includes(value.toLowerCase())
  ).length;
  
  if (valueMatches === 0) {
    violations.push('Content does not explicitly reference core values');
    recommendations.push(`Consider highlighting values like: ${guidelines.values.join(', ')}`);
    score -= 0.1;
  }

  // Ensure positive score
  score = Math.max(0, score);

  return {
    aligned: violations.length === 0 && score >= 0.7,
    score,
    violations,
    recommendations
  };
}

/**
 * Validate social media content for brand alignment
 */
export function validateSocialMediaContent(content: string, platform: string): BrandAlignmentResult {
  const baseResult = validateBrandAlignment(content);
  
  // Platform-specific checks
  if (platform === 'linkedin') {
    if (!content.includes('professional') && !content.includes('innovation')) {
      baseResult.recommendations.push('Consider adding professional context for LinkedIn');
      baseResult.score -= 0.05;
    }
  }
  
  if (platform === 'twitter') {
    if (content.length > 280) {
      baseResult.violations.push('Content exceeds Twitter character limit');
      baseResult.aligned = false;
    }
  }

  return baseResult;
}

/**
 * Generate brand-aligned alternative suggestions
 */
export function generateBrandAlignedAlternatives(originalText: string): string[] {
  const alternatives: string[] = [];
  
  // Replace common non-aligned terms
  const replacements = {
    'disrupt': 'transform',
    'dominate': 'lead',
    'control': 'guide',
    'replace': 'augment',
    'obsolete': 'evolve'
  };
  
  let modifiedText = originalText;
  for (const [original, replacement] of Object.entries(replacements)) {
    if (modifiedText.toLowerCase().includes(original)) {
      modifiedText = modifiedText.replace(new RegExp(original, 'gi'), replacement);
      alternatives.push(modifiedText);
    }
  }
  
  // Add regenerative framing
  if (!originalText.toLowerCase().includes('regenerative')) {
    alternatives.push(`${originalText} This regenerative approach...`);
  }
  
  // Add symbiotic technology emphasis
  if (originalText.toLowerCase().includes('ai') || originalText.toLowerCase().includes('artificial intelligence')) {
    alternatives.push(originalText.replace(/AI|artificial intelligence/gi, 'symbiotic AI technology'));
  }
  
  return alternatives.length > 0 ? alternatives : [originalText];
}

/**
 * Validate press release content
 */
export function validatePressRelease(content: string): BrandAlignmentResult {
  const baseResult = validateBrandAlignment(content);
  
  // Press release specific requirements
  const requiredElements = [
    'vindicated artistry',
    'regenerative',
    'symbiotic',
    'constitutional'
  ];
  
  const missingElements = requiredElements.filter(element => 
    !content.toLowerCase().includes(element.toLowerCase())
  );
  
  if (missingElements.length > 0) {
    baseResult.violations.push(`Missing required elements: ${missingElements.join(', ')}`);
    baseResult.recommendations.push(`Include references to: ${missingElements.join(', ')}`);
    baseResult.score -= missingElements.length * 0.1;
    baseResult.aligned = false;
  }
  
  return baseResult;
}
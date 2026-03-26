/**
 * Neo4j response mapper — converts Neo4j types to application types.
 * Matches TheFulcrum pattern: api/utils/neo4jResponseMapper.ts
 *
 * Neo4j stores dates as ISO strings and complex fields as JSON strings.
 * These helpers convert them to native JS types on read.
 */

import neo4j from 'neo4j-driver';

/**
 * Convert Neo4j Integer to JS number.
 * Neo4j returns integers as { low, high } objects.
 */
export function neo4jIntToNumber(value: unknown): number {
  if (neo4j.isInt(value)) {
    return (value as { toNumber(): number }).toNumber();
  }
  if (typeof value === 'number') return value;
  return 0;
}

/**
 * Convert ISO string fields to Date objects.
 */
export function toDateFields<T extends Record<string, unknown>>(
  obj: T,
  dateFields: string[],
): T {
  const result = { ...obj };
  for (const field of dateFields) {
    const value = result[field];
    if (typeof value === 'string' && value.length > 0) {
      (result as Record<string, unknown>)[field] = new Date(value);
    }
  }
  return result;
}

/**
 * Parse JSON-stringified fields back to objects.
 */
export function parseJsonFields<T extends Record<string, unknown>>(
  obj: T,
  jsonFields: string[],
): T {
  const result = { ...obj };
  for (const field of jsonFields) {
    const value = result[field];
    if (typeof value === 'string' && value.length > 0) {
      try {
        (result as Record<string, unknown>)[field] = JSON.parse(value);
      } catch {
        // Leave as string if parse fails
      }
    }
  }
  return result;
}

/**
 * Extract properties from a Neo4j node.
 */
export function nodeProps(node: unknown): Record<string, unknown> | null {
  if (node && typeof node === 'object' && 'properties' in node) {
    return (node as { properties: Record<string, unknown> }).properties;
  }
  return null;
}

/**
 * Extract properties from a Neo4j relationship.
 */
export function relProps(rel: unknown): Record<string, unknown> | null {
  if (rel && typeof rel === 'object' && 'properties' in rel) {
    return (rel as { properties: Record<string, unknown> }).properties;
  }
  return null;
}

/**
 * Map a CouncilMember node to the application's consciousness state shape.
 * Reconstitutes flat trait_* and emotion_* properties into nested objects.
 */
export function memberToConsciousnessState(member: Record<string, unknown>): {
  personalityTraits: Record<string, number>;
  emotionalState: Record<string, unknown>;
} {
  const traits: Record<string, number> = {};
  const emotions: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(member)) {
    if (key.startsWith('trait_')) {
      traits[key.slice(6)] = neo4jIntToNumber(value);
    } else if (key.startsWith('emotion_')) {
      const emotionKey = key.slice(8);
      emotions[emotionKey] = typeof value === 'string' ? value : neo4jIntToNumber(value);
    }
  }

  return { personalityTraits: traits, emotionalState: emotions };
}

/** Standard date fields on council member nodes */
export const MEMBER_DATE_FIELDS = ['createdAt', 'updatedAt', 'lastInteraction'];

/** JSON fields on council member nodes */
export const MEMBER_JSON_FIELDS = ['specializations'];

/** Standard date fields on learning experience nodes */
export const LEARNING_DATE_FIELDS = ['timestamp'];

/** JSON fields on learning experience nodes */
export const LEARNING_JSON_FIELDS = ['skillsImproved', 'personalityAdjustments', 'emotionalImpact'];

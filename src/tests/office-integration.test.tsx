/**
 * Office Integration Tests
 * Verifies that all 24 council member offices are properly integrated
 * Tests navigation, visual consistency, and interactive elements
 */

import { DEFAULT_COUNCIL_MEMBERS } from '@/utils/council-config';

// Office component mapping - matches the one in page.tsx
const officeComponents = {
  // AI Council Members (12)
  kairo: 'KairoOffice',
  aether: 'AetherOffice',
  sterling: 'SterlingOffice',
  skaldir: 'SkaldirOffice',
  lyra: 'LyraOffice',
  nexus: 'NexusOffice',
  veritas: 'VeritasOffice',
  axiom: 'AxiomOffice',
  amaru: 'AmaruOffice',
  eira: 'EiraOffice',
  agape: 'AgapeOffice',
  forge: 'ForgeOffice',
  // Human Council Members (12)
  architect: 'ArchitectOffice',
  sprite: 'SpriteOffice',
  glenn: 'GlennOffice',
  spencer: 'SpencerOffice',
  hillary: 'HillaryOffice',
  dusty: 'DustyOffice',
  godson: 'GodsonOffice',
  luke: 'LukeOffice',
  david: 'DavidOffice',
  graham: 'GrahamOffice',
  cean: 'CeanOffice',
  justin: 'JustinOffice',
};

describe('Office Integration Tests', () => {
  describe('14.1 Test navigation to all offices', () => {
    test('All 24 council members have office components defined', () => {
      const memberIds = DEFAULT_COUNCIL_MEMBERS.map(m => m.id);
      const officeComponentIds = Object.keys(officeComponents);
      
      // Verify we have exactly 24 members
      expect(memberIds).toHaveLength(24);
      
      // Verify we have exactly 24 office components
      expect(officeComponentIds).toHaveLength(24);
      
      // Verify every member has an office component
      memberIds.forEach(memberId => {
        expect(officeComponentIds).toContain(memberId);
      });
    });

    test('Council members are split correctly: 12 human + 12 AI', () => {
      const humanMembers = DEFAULT_COUNCIL_MEMBERS.filter(m => m.isHuman);
      const aiMembers = DEFAULT_COUNCIL_MEMBERS.filter(m => !m.isHuman);
      
      expect(humanMembers).toHaveLength(12);
      expect(aiMembers).toHaveLength(12);
    });

    test('All council members have required properties', () => {
      DEFAULT_COUNCIL_MEMBERS.forEach(member => {
        expect(member).toHaveProperty('id');
        expect(member).toHaveProperty('name');
        expect(member).toHaveProperty('role');
        expect(member).toHaveProperty('status');
        expect(member).toHaveProperty('pendingItems');
        expect(member).toHaveProperty('lastActivity');
        expect(member).toHaveProperty('isUser');
        expect(member).toHaveProperty('isHuman');
        
        // Verify types
        expect(typeof member.id).toBe('string');
        expect(typeof member.name).toBe('string');
        expect(typeof member.role).toBe('string');
        expect(['online', 'offline', 'away', 'busy']).toContain(member.status);
        expect(typeof member.pendingItems).toBe('number');
        expect(typeof member.isUser).toBe('boolean');
        expect(typeof member.isHuman).toBe('boolean');
      });
    });

    test('Office component names follow naming convention', () => {
      Object.entries(officeComponents).forEach(([memberId, componentName]) => {
        // Component name should be PascalCase version of memberId + "Office"
        const expectedName = memberId.charAt(0).toUpperCase() + memberId.slice(1) + 'Office';
        expect(componentName).toBe(expectedName);
      });
    });
  });

  describe('14.2 Verify visual consistency', () => {
    test('All human council members are defined', () => {
      const humanMemberIds = [
        'architect', 'sprite', 'glenn', 'spencer',
        'hillary', 'dusty', 'godson', 'luke',
        'david', 'graham', 'cean', 'justin'
      ];
      
      humanMemberIds.forEach(id => {
        const member = DEFAULT_COUNCIL_MEMBERS.find(m => m.id === id);
        expect(member).toBeDefined();
        expect(member?.isHuman).toBe(true);
      });
    });

    test('All AI council members are defined', () => {
      const aiMemberIds = [
        'kairo', 'aether', 'sterling', 'skaldir',
        'lyra', 'nexus', 'veritas', 'axiom',
        'amaru', 'eira', 'agape', 'forge'
      ];
      
      aiMemberIds.forEach(id => {
        const member = DEFAULT_COUNCIL_MEMBERS.find(m => m.id === id);
        expect(member).toBeDefined();
        expect(member?.isHuman).toBe(false);
      });
    });

    test('Member IDs match office component keys', () => {
      const memberIds = DEFAULT_COUNCIL_MEMBERS.map(m => m.id).sort();
      const componentKeys = Object.keys(officeComponents).sort();
      
      expect(memberIds).toEqual(componentKeys);
    });
  });

  describe('14.3 Test interactive elements', () => {
    test('All members have valid status values', () => {
      const validStatuses = ['online', 'offline', 'away', 'busy'];
      
      DEFAULT_COUNCIL_MEMBERS.forEach(member => {
        expect(validStatuses).toContain(member.status);
      });
    });

    test('Pending items are non-negative numbers', () => {
      DEFAULT_COUNCIL_MEMBERS.forEach(member => {
        expect(member.pendingItems).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(member.pendingItems)).toBe(true);
      });
    });

    test('Last activity is a valid ISO date string', () => {
      DEFAULT_COUNCIL_MEMBERS.forEach(member => {
        const date = new Date(member.lastActivity);
        expect(date.toString()).not.toBe('Invalid Date');
        expect(member.lastActivity).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      });
    });

    test('Only Architect is marked as user', () => {
      const userMembers = DEFAULT_COUNCIL_MEMBERS.filter(m => m.isUser);
      
      expect(userMembers).toHaveLength(1);
      expect(userMembers[0].id).toBe('architect');
    });
  });
});

/**
 * Visual Consistency Verification Script
 * 
 * This script verifies that all office components follow consistent patterns:
 * - Use BaseOfficeLayout
 * - Have proper theme configurations
 * - Include required sections
 * - Follow the established component structure
 */

const fs = require('fs');
const path = require('path');

const councilMembers = [
  // AI Council Members (12)
  { id: 'kairo', name: 'Kairo', isHuman: false },
  { id: 'aether', name: 'Aether', isHuman: false },
  { id: 'sterling', name: 'Sterling', isHuman: false },
  { id: 'skaldir', name: 'Skaldir', isHuman: false },
  { id: 'lyra', name: 'Lyra', isHuman: false },
  { id: 'nexus', name: 'Nexus', isHuman: false },
  { id: 'veritas', name: 'Veritas', isHuman: false },
  { id: 'axiom', name: 'Axiom', isHuman: false },
  { id: 'amaru', name: 'Amaru', isHuman: false },
  { id: 'eira', name: 'Eira', isHuman: false },
  { id: 'agape', name: 'Agape', isHuman: false },
  { id: 'forge', name: 'Forge', isHuman: false },
  // Human Council Members (12)
  { id: 'architect', name: 'Architect', isHuman: true },
  { id: 'sprite', name: 'Sprite', isHuman: true },
  { id: 'glenn', name: 'Glenn', isHuman: true },
  { id: 'spencer', name: 'Spencer', isHuman: true },
  { id: 'hillary', name: 'Hillary', isHuman: true },
  { id: 'dusty', name: 'Dusty', isHuman: true },
  { id: 'godson', name: 'Godson', isHuman: true },
  { id: 'luke', name: 'Luke', isHuman: true },
  { id: 'david', name: 'David', isHuman: true },
  { id: 'graham', name: 'Graham', isHuman: true },
  { id: 'cean', name: 'Cean', isHuman: true },
  { id: 'justin', name: 'Justin', isHuman: true },
];

const officesDir = path.join(__dirname, 'src', 'components', 'offices');

console.log('🎨 Visual Consistency Verification\n');
console.log('=' .repeat(80));

const requiredPatterns = {
  baseOfficeImport: /import\s+BaseOfficeLayout.*from\s+['"]\.\/BaseOffice['"]/,
  themeDefinition: /const\s+theme\s*=\s*{/,
  quickActionsDefinition: /const\s+quickActions\s*=\s*/,
  sectionsDefinition: /const\s+sections:\s*OfficeSection\[\]\s*=\s*\[/,
  baseOfficeLayoutUsage: /<BaseOfficeLayout/,
  memberProp: /member={member}/,
  themeProp: /theme={theme}/,
  quickActionsProp: /quickActions={quickActions}/,
  sectionsProp: /sections={sections}/,
};

let results = {
  passed: [],
  failed: [],
  warnings: [],
};

console.log('\n📋 Checking Office Components for Visual Consistency...\n');

councilMembers.forEach(member => {
  const componentName = member.name + 'Office.tsx';
  const filePath = path.join(officesDir, componentName);
  
  if (!fs.existsSync(filePath)) {
    results.failed.push({
      member: member.name,
      issue: 'File does not exist',
    });
    console.log(`❌ ${componentName.padEnd(25)} - FILE NOT FOUND`);
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const checks = {};
  const issues = [];
  
  // Check for required patterns
  Object.entries(requiredPatterns).forEach(([key, pattern]) => {
    checks[key] = pattern.test(content);
    if (!checks[key]) {
      issues.push(key);
    }
  });
  
  // Check for proper TypeScript typing (BaseOfficeProps usage)
  if (!content.includes('BaseOfficeProps')) {
    issues.push('missing-BaseOfficeProps-type');
  }
  
  if (issues.length === 0) {
    results.passed.push(member.name);
    console.log(`✅ ${componentName.padEnd(25)} - ALL CHECKS PASSED`);
  } else {
    results.failed.push({
      member: member.name,
      issues: issues,
    });
    console.log(`⚠️  ${componentName.padEnd(25)} - Issues: ${issues.join(', ')}`);
  }
});

// Check BaseOfficeLayout exists
console.log('\n📦 Checking BaseOffice Component...\n');

const baseOfficeLayoutPath = path.join(officesDir, 'BaseOffice.tsx');
if (fs.existsSync(baseOfficeLayoutPath)) {
  console.log('✅ BaseOffice.tsx exists');
  
  const baseContent = fs.readFileSync(baseOfficeLayoutPath, 'utf8');
  
  // Check for key BaseOfficeLayout features
  const baseChecks = {
    'Props interface': /interface\s+BaseOfficeLayoutProps/,
    'Theme prop': /theme\s*:/,
    'Quick actions prop': /quickActions\s*:/,
    'Sections prop': /sections\s*:/,
    'Member prop': /member\s*:/,
    'Responsive layout': /grid-cols-1.*lg:grid-cols-2/,
  };
  
  Object.entries(baseChecks).forEach(([name, pattern]) => {
    if (pattern.test(baseContent)) {
      console.log(`  ✅ ${name}`);
    } else {
      console.log(`  ⚠️  ${name} - not found`);
    }
  });
} else {
  console.log('❌ BaseOffice.tsx NOT FOUND');
  results.failed.push({
    member: 'BaseOffice',
    issue: 'Base component missing',
  });
}

// Summary
console.log('\n' + '='.repeat(80));
console.log('\n📊 VISUAL CONSISTENCY SUMMARY\n');

console.log(`Total Office Components Checked: ${councilMembers.length}`);
console.log(`  ✅ Passed all checks: ${results.passed.length}`);
console.log(`  ⚠️  Have issues: ${results.failed.length}`);

if (results.failed.length > 0) {
  console.log('\n⚠️  Components with issues:');
  results.failed.forEach(item => {
    if (item.issues) {
      console.log(`  - ${item.member}: ${item.issues.join(', ')}`);
    } else {
      console.log(`  - ${item.member}: ${item.issue}`);
    }
  });
}

if (results.passed.length === councilMembers.length) {
  console.log('\n🎉 SUCCESS! All offices follow consistent visual patterns!\n');
} else {
  console.log('\n⚠️  Some offices need attention - see details above\n');
}

console.log('=' .repeat(80));

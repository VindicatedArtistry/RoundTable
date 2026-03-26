/**
 * Office Integration Verification Script
 * 
 * This script verifies that all 24 council member offices are properly integrated:
 * - Checks that all office component files exist
 * - Verifies office components are imported in the routing page
 * - Lists all members and their office status
 */

const fs = require('fs');
const path = require('path');

// All 24 council members
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
const routingFile = path.join(__dirname, 'src', 'app', 'office', '[memberId]', 'page.tsx');

console.log('🔍 Office Integration Verification\n');
console.log('=' .repeat(80));

// Check 1: Verify all office component files exist
console.log('\n📁 Checking Office Component Files...\n');

let missingFiles = [];
let existingFiles = [];

councilMembers.forEach(member => {
  const componentName = member.name + 'Office.tsx';
  const filePath = path.join(officesDir, componentName);
  
  if (fs.existsSync(filePath)) {
    existingFiles.push(member);
    console.log(`✅ ${componentName.padEnd(25)} - EXISTS`);
  } else {
    missingFiles.push(member);
    console.log(`❌ ${componentName.padEnd(25)} - MISSING`);
  }
});

// Check 2: Verify routing file imports
console.log('\n📋 Checking Routing File Imports...\n');

let missingImports = [];
let existingImports = [];
let missingMappings = [];
let existingMappings = [];

if (fs.existsSync(routingFile)) {
  const routingContent = fs.readFileSync(routingFile, 'utf8');
  
  councilMembers.forEach(member => {
    const componentName = member.name + 'Office';
    const importStatement = `import ${componentName} from '@/components/offices/${componentName}';`;
    const mappingEntry = `${member.id}: ${componentName}`;
    
    if (routingContent.includes(importStatement)) {
      existingImports.push(member);
    } else {
      missingImports.push(member);
    }
    
    if (routingContent.includes(mappingEntry)) {
      existingMappings.push(member);
    } else {
      missingMappings.push(member);
    }
  });
  
  console.log('Import Statements:');
  existingImports.forEach(m => {
    console.log(`  ✅ ${m.name}Office imported`);
  });
  
  if (missingImports.length > 0) {
    console.log('\n  Missing Imports:');
    missingImports.forEach(m => {
      console.log(`  ❌ ${m.name}Office NOT imported`);
    });
  }
  
  console.log('\nOffice Component Mapping:');
  existingMappings.forEach(m => {
    console.log(`  ✅ ${m.id} → ${m.name}Office`);
  });
  
  if (missingMappings.length > 0) {
    console.log('\n  Missing Mappings:');
    missingMappings.forEach(m => {
      console.log(`  ❌ ${m.id} → ${m.name}Office NOT mapped`);
    });
  }
} else {
  console.log('❌ Routing file not found!');
}

// Summary
console.log('\n' + '='.repeat(80));
console.log('\n📊 SUMMARY\n');

console.log(`Total Council Members: ${councilMembers.length}`);
console.log(`  - Human Members: ${councilMembers.filter(m => m.isHuman).length}`);
console.log(`  - AI Members: ${councilMembers.filter(m => !m.isHuman).length}`);
console.log();
console.log(`Office Component Files:`);
console.log(`  ✅ Existing: ${existingFiles.length}`);
console.log(`  ❌ Missing: ${missingFiles.length}`);

if (missingFiles.length === 0 && missingImports.length === 0 && missingMappings.length === 0) {
  console.log('\n🎉 SUCCESS! All 24 offices are properly integrated!\n');
  console.log('Next steps:');
  console.log('  1. Start the development server: npm run dev');
  console.log('  2. Navigate to http://localhost:3000');
  console.log('  3. Click on each council member to test their office');
  console.log('  4. Verify visual themes and interactive elements work correctly');
} else {
  console.log('\n⚠️  ISSUES FOUND - Please review the missing items above\n');
}

console.log('=' .repeat(80));

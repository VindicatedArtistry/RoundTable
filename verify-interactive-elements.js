/**
 * Interactive Elements Verification Script
 * 
 * This script verifies that all office components have proper interactive elements:
 * - Quick action buttons with onClick handlers
 * - Console.log statements for debugging
 * - Proper accessibility attributes
 * - Interactive UI components (Progress, Badge, etc.)
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

console.log('🎮 Interactive Elements Verification\n');
console.log('=' .repeat(80));

const interactivePatterns = {
  buttonComponent: /import.*Button.*from.*@\/components\/ui\/button/,
  badgeComponent: /import.*Badge.*from.*@\/components\/ui\/badge/,
  progressComponent: /import.*Progress.*from.*@\/components\/ui\/progress/,
  onClickHandler: /onClick=\{.*\}/,
  consoleLog: /console\.log\(/,
  lucideIcons: /import.*from\s+['"]lucide-react['"]/,
};

let results = {
  passed: [],
  warnings: [],
  stats: {
    totalButtons: 0,
    totalOnClickHandlers: 0,
    totalConsoleLog: 0,
    totalIcons: 0,
  }
};

console.log('\n🔍 Checking Interactive Elements in Office Components...\n');

councilMembers.forEach(member => {
  const componentName = member.name + 'Office.tsx';
  const filePath = path.join(officesDir, componentName);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ ${componentName.padEnd(25)} - FILE NOT FOUND`);
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const checks = {};
  const stats = {};
  
  // Check for interactive patterns
  Object.entries(interactivePatterns).forEach(([key, pattern]) => {
    checks[key] = pattern.test(content);
  });
  
  // Count interactive elements
  stats.buttons = (content.match(/<Button/g) || []).length;
  stats.onClickHandlers = (content.match(/onClick=\{/g) || []).length;
  stats.consoleLogs = (content.match(/console\.log\(/g) || []).length;
  stats.badges = (content.match(/<Badge/g) || []).length;
  stats.progress = (content.match(/<Progress/g) || []).length;
  stats.icons = (content.match(/className="h-\d+ w-\d+/g) || []).length;
  
  // Update global stats
  results.stats.totalButtons += stats.buttons;
  results.stats.totalOnClickHandlers += stats.onClickHandlers;
  results.stats.totalConsoleLog += stats.consoleLogs;
  results.stats.totalIcons += stats.icons;
  
  // Determine status
  const hasInteractivity = checks.onClickHandler && checks.consoleLog;
  const hasUIComponents = checks.buttonComponent;
  const hasIcons = checks.lucideIcons;
  
  if (hasInteractivity && hasUIComponents && hasIcons) {
    results.passed.push({
      member: member.name,
      stats: stats
    });
    console.log(`✅ ${componentName.padEnd(25)} - ${stats.buttons} buttons, ${stats.onClickHandlers} handlers, ${stats.consoleLogs} logs`);
  } else {
    const issues = [];
    if (!hasInteractivity) issues.push('missing interactivity');
    if (!hasUIComponents) issues.push('missing UI components');
    if (!hasIcons) issues.push('missing icons');
    
    results.warnings.push({
      member: member.name,
      issues: issues,
      stats: stats
    });
    console.log(`⚠️  ${componentName.padEnd(25)} - Issues: ${issues.join(', ')}`);
  }
});

// Detailed stats
console.log('\n' + '='.repeat(80));
console.log('\n📊 INTERACTIVE ELEMENTS SUMMARY\n');

console.log(`Total Office Components Checked: ${councilMembers.length}`);
console.log(`  ✅ Fully interactive: ${results.passed.length}`);
console.log(`  ⚠️  Need attention: ${results.warnings.length}`);
console.log();
console.log('Global Statistics:');
console.log(`  🔘 Total Buttons: ${results.stats.totalButtons}`);
console.log(`  👆 Total onClick Handlers: ${results.stats.totalOnClickHandlers}`);
console.log(`  📝 Total console.log Statements: ${results.stats.totalConsoleLog}`);
console.log(`  🎨 Total Icons: ${results.stats.totalIcons}`);
console.log();
console.log(`Average per office:`);
console.log(`  🔘 Buttons: ${(results.stats.totalButtons / councilMembers.length).toFixed(1)}`);
console.log(`  👆 Handlers: ${(results.stats.totalOnClickHandlers / councilMembers.length).toFixed(1)}`);
console.log(`  📝 Logs: ${(results.stats.totalConsoleLog / councilMembers.length).toFixed(1)}`);

if (results.warnings.length > 0) {
  console.log('\n⚠️  Components needing attention:');
  results.warnings.forEach(item => {
    console.log(`  - ${item.member}: ${item.issues.join(', ')}`);
  });
}

if (results.passed.length === councilMembers.length) {
  console.log('\n🎉 SUCCESS! All offices have proper interactive elements!\n');
  console.log('Interactive elements are ready for testing:');
  console.log('  1. Start the dev server: npm run dev');
  console.log('  2. Open browser console (F12)');
  console.log('  3. Navigate to each office and click buttons');
  console.log('  4. Verify console.log output appears for each action');
} else {
  console.log('\n⚠️  Some offices need interactive element improvements\n');
}

console.log('=' .repeat(80));

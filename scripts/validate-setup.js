#!/usr/bin/env node

/**
 * Supabase Setup Validator
 * 
 * This script checks if your Supabase configuration is correct
 * Run: node scripts/validate-setup.js
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

function checkmark() {
  return colors.green + '✓' + colors.reset;
}

function cross() {
  return colors.red + '✗' + colors.reset;
}

async function validateSetup() {
  log('\n╔═══════════════════════════════════════════════════════╗', 'magenta');
  log('║       Supabase Configuration Validator              ║', 'magenta');
  log('╚═══════════════════════════════════════════════════════╝', 'magenta');
  
  let allGood = true;
  
  // Check 1: .env file exists
  log('\n📁 Checking .env file...', 'cyan');
  const envPath = path.join(process.cwd(), '.env');
  
  if (!fs.existsSync(envPath)) {
    log(`   ${cross()} .env file not found!`, 'red');
    log('   Create a .env file in the project root', 'yellow');
    allGood = false;
  } else {
    log(`   ${checkmark()} .env file exists`, 'green');
  }
  
  // Check 2: Load environment variables
  log('\n🔐 Checking environment variables...', 'cyan');
  
  require('dotenv').config({ path: envPath });
  
  const requiredVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_REDIRECT_URI',
  ];
  
  const optionalVars = [
    'NODE_ENV',
  ];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      log(`   ${cross()} ${varName} is missing!`, 'red');
      allGood = false;
    } else if (process.env[varName].includes('YOUR_') || process.env[varName].includes('_HERE')) {
      log(`   ${cross()} ${varName} needs to be replaced with actual value`, 'yellow');
      allGood = false;
    } else {
      const preview = process.env[varName].substring(0, 20) + '...';
      log(`   ${checkmark()} ${varName} = ${preview}`, 'green');
    }
  }
  
  // Check 3: Validate Supabase URL format
  log('\n🌐 Validating Supabase URL...', 'cyan');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  if (supabaseUrl && supabaseUrl.startsWith('https://') && supabaseUrl.includes('.supabase.co')) {
    log(`   ${checkmark()} URL format is correct`, 'green');
  } else {
    log(`   ${cross()} URL format is incorrect`, 'red');
    log('   Expected: https://xxx.supabase.co', 'yellow');
    allGood = false;
  }
  
  // Check 4: Validate API keys format
  log('\n🔑 Validating API keys...', 'cyan');
  
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (anonKey && anonKey.startsWith('eyJ')) {
    log(`   ${checkmark()} Anon key format looks correct (JWT)`, 'green');
  } else {
    log(`   ${cross()} Anon key format is incorrect`, 'red');
    log('   Should start with "eyJ" (JWT token)', 'yellow');
    allGood = false;
  }
  
  if (serviceKey && serviceKey.startsWith('eyJ')) {
    log(`   ${checkmark()} Service role key format looks correct (JWT)`, 'green');
  } else {
    log(`   ${cross()} Service role key format is incorrect`, 'red');
    log('   Should start with "eyJ" (JWT token)', 'yellow');
    allGood = false;
  }
  
  // Check 5: Test Supabase connection
  log('\n🔌 Testing Supabase connection...', 'cyan');
  
  if (supabaseUrl && anonKey && anonKey.startsWith('eyJ')) {
    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, anonKey);
      
      // Try a simple query
      const { data, error } = await supabase.from('User').select('id').limit(1);
      
      if (error) {
        if (error.message.includes('relation') || error.message.includes('does not exist')) {
          log(`   ${cross()} Connection works but table "User" not found`, 'yellow');
          log('   Make sure your database tables exist', 'yellow');
          log('   Run: npx prisma db push', 'yellow');
        } else {
          log(`   ${cross()} Connection error: ${error.message}`, 'red');
          allGood = false;
        }
      } else {
        log(`   ${checkmark()} Successfully connected to Supabase!`, 'green');
        log(`   ${checkmark()} Database tables are accessible`, 'green');
      }
    } catch (error) {
      log(`   ${cross()} Error testing connection: ${error.message}`, 'red');
      log('   Make sure @supabase/supabase-js is installed', 'yellow');
      log('   Run: npm install', 'yellow');
      allGood = false;
    }
  } else {
    log(`   ⊘ Skipping (missing required environment variables)`, 'yellow');
  }
  
  // Check 6: Verify files exist
  log('\n📄 Checking required files...', 'cyan');
  
  const requiredFiles = [
    'src/lib/supabase.ts',
    'src/app/api/shifts-fast/route.ts',
    'prisma/schema.prisma',
  ];
  
  for (const file of requiredFiles) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      log(`   ${checkmark()} ${file}`, 'green');
    } else {
      log(`   ${cross()} ${file} not found`, 'red');
      allGood = false;
    }
  }
  
  // Check 7: Verify package.json dependencies
  log('\n📦 Checking dependencies...', 'cyan');
  
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    const requiredDeps = [
      '@supabase/supabase-js',
      '@prisma/client',
      'next',
      'react',
    ];
    
    for (const dep of requiredDeps) {
      if (deps[dep]) {
        log(`   ${checkmark()} ${dep} v${deps[dep]}`, 'green');
      } else {
        log(`   ${cross()} ${dep} not installed`, 'red');
        log(`   Run: npm install ${dep}`, 'yellow');
        allGood = false;
      }
    }
  } else {
    log(`   ${cross()} package.json not found`, 'red');
    allGood = false;
  }
  
  // Final summary
  log('\n╔═══════════════════════════════════════════════════════╗', 'magenta');
  log('║                    SUMMARY                           ║', 'magenta');
  log('╚═══════════════════════════════════════════════════════╝', 'magenta');
  
  if (allGood) {
    log('\n✨ All checks passed! You\'re ready to go!', 'green');
    log('\nNext steps:', 'cyan');
    log('1. npm run dev', 'blue');
    log('2. Test: http://localhost:3000/api/shifts-fast', 'blue');
    log('3. Run: node scripts/test-performance.js', 'blue');
    log('\n🚀 Your app should now be 5-10x faster!', 'green');
  } else {
    log('\n⚠️  Some issues found. Please fix them and run again.', 'yellow');
    log('\nCommon fixes:', 'cyan');
    log('1. Add Supabase keys to .env file', 'blue');
    log('2. Run: npm install', 'blue');
    log('3. Run: npx prisma db push', 'blue');
    log('\nNeed help? Check MIGRATION_GUIDE.md', 'blue');
  }
  
  log('\n');
}

// Run validation
validateSetup().catch(error => {
  log(`\n❌ Validation failed: ${error.message}`, 'red');
  process.exit(1);
});

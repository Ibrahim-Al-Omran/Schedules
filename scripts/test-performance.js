#!/usr/bin/env node

/**
 * Performance Testing & Migration Script
 * 
 * This script helps you:
 * 1. Test Prisma vs Supabase performance
 * 2. Validate both approaches work correctly
 * 3. Compare response times
 * 
 * Usage:
 *   node scripts/test-performance.js
 */

const https = require('https');

const API_BASE = process.env.API_BASE || 'http://localhost:3000';

// Color codes for terminal
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

async function measureRequest(url, options = {}) {
  const start = Date.now();
  
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? require('https') : require('http');
    
    const req = protocol.request(
      {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        headers: options.headers || {},
      },
      (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          const duration = Date.now() - start;
          resolve({
            status: res.statusCode,
            duration,
            data: data ? JSON.parse(data) : null,
          });
        });
      }
    );
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function testEndpoint(name, url, options = {}) {
  log(`\n📊 Testing: ${name}`, 'cyan');
  log(`   URL: ${url}`, 'blue');
  
  try {
    const result = await measureRequest(url, options);
    
    if (result.status >= 200 && result.status < 300) {
      log(`   ✅ Success (${result.status})`, 'green');
      log(`   ⏱️  Time: ${result.duration}ms`, result.duration < 200 ? 'green' : result.duration < 500 ? 'yellow' : 'red');
      return { success: true, duration: result.duration, name };
    } else {
      log(`   ❌ Failed (${result.status})`, 'red');
      log(`   Error: ${JSON.stringify(result.data)}`, 'red');
      return { success: false, duration: result.duration, name };
    }
  } catch (error) {
    log(`   ❌ Error: ${error.message}`, 'red');
    return { success: false, duration: 0, name, error: error.message };
  }
}

async function runTests() {
  log('\n╔═══════════════════════════════════════════════════════╗', 'magenta');
  log('║   Performance Testing: Prisma vs Supabase           ║', 'magenta');
  log('╚═══════════════════════════════════════════════════════╝', 'magenta');
  
  const results = [];
  
  // Test 1: Health check (warm up)
  log('\n🔥 Warming up server...', 'yellow');
  await testEndpoint('Health Check', `${API_BASE}/api/health`);
  
  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Test 2: Prisma endpoint
  results.push(await testEndpoint('Shifts (Prisma)', `${API_BASE}/api/shifts`, {
    headers: {
      'Content-Type': 'application/json',
      // Add your auth token if needed
    },
  }));
  
  // Test 3: Supabase endpoint
  results.push(await testEndpoint('Shifts (Supabase)', `${API_BASE}/api/shifts-fast`, {
    headers: {
      'Content-Type': 'application/json',
      // Add your auth token if needed
    },
  }));
  
  // Test 4: Run multiple times for average
  log('\n\n📈 Running multiple requests for statistical analysis...', 'yellow');
  
  const prismaResults = [];
  const supabaseResults = [];
  
  for (let i = 0; i < 5; i++) {
    log(`\n   Round ${i + 1}/5`, 'blue');
    
    const prisma = await measureRequest(`${API_BASE}/api/shifts`, {
      headers: { 'Content-Type': 'application/json' },
    });
    prismaResults.push(prisma.duration);
    log(`   Prisma: ${prisma.duration}ms`, 'cyan');
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const supabase = await measureRequest(`${API_BASE}/api/shifts-fast`, {
      headers: { 'Content-Type': 'application/json' },
    });
    supabaseResults.push(supabase.duration);
    log(`   Supabase: ${supabase.duration}ms`, 'cyan');
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Calculate statistics
  const prismaAvg = prismaResults.reduce((a, b) => a + b, 0) / prismaResults.length;
  const supabaseAvg = supabaseResults.reduce((a, b) => a + b, 0) / supabaseResults.length;
  const improvement = ((prismaAvg - supabaseAvg) / prismaAvg * 100).toFixed(1);
  
  // Print summary
  log('\n\n╔═══════════════════════════════════════════════════════╗', 'magenta');
  log('║                    RESULTS SUMMARY                   ║', 'magenta');
  log('╚═══════════════════════════════════════════════════════╝', 'magenta');
  
  log('\n📊 Average Response Times:', 'cyan');
  log(`   Prisma:    ${prismaAvg.toFixed(0)}ms`, 'yellow');
  log(`   Supabase:  ${supabaseAvg.toFixed(0)}ms`, 'green');
  log(`   Improvement: ${improvement}% faster`, improvement > 0 ? 'green' : 'red');
  
  log('\n📉 Performance Breakdown:', 'cyan');
  log(`   Prisma    - Min: ${Math.min(...prismaResults)}ms, Max: ${Math.max(...prismaResults)}ms`, 'yellow');
  log(`   Supabase  - Min: ${Math.min(...supabaseResults)}ms, Max: ${Math.max(...supabaseResults)}ms`, 'green');
  
  if (improvement > 30) {
    log('\n✨ Supabase is SIGNIFICANTLY faster! Migration recommended.', 'green');
  } else if (improvement > 0) {
    log('\n👍 Supabase is faster. Migration would improve performance.', 'green');
  } else {
    log('\n⚠️  Results inconclusive. May need more testing or configuration.', 'yellow');
  }
  
  log('\n✅ Testing complete!\n', 'cyan');
}

// Run tests
runTests().catch(error => {
  log(`\n❌ Test failed: ${error.message}`, 'red');
  process.exit(1);
});

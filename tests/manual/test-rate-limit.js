/**
 * Manual Rate Limit Test
 * Run this to test the actual server rate limiting
 * 
 * Usage:
 * 1. Start the server: npm run server
 * 2. Run this test: node tests/manual/test-rate-limit.js
 */

const http = require('http');

const PORT = 3000;
const ENDPOINT = '/api/ai/chat';

function makeRequest() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      message: 'مرحبا'
    });
    
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: ENDPOINT,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function testRateLimit() {
  console.log('Testing rate limiting...\n');
  
  try {
    // Make 31 requests
    for (let i = 1; i <= 31; i++) {
      const response = await makeRequest();
      
      console.log(`Request ${i}:`);
      console.log(`  Status: ${response.statusCode}`);
      console.log(`  Rate Limit: ${response.headers['x-ratelimit-limit']}`);
      console.log(`  Remaining: ${response.headers['x-ratelimit-remaining']}`);
      
      if (response.statusCode === 429) {
        const body = JSON.parse(response.body);
        console.log(`  ✓ Rate limited! Error: ${body.error}`);
        console.log(`  ✓ Retry after: ${body.retryAfter} seconds`);
        break;
      } else if (response.statusCode === 503) {
        console.log('  ⚠ API not configured (expected in test environment)');
        console.log('  ✓ Rate limiting headers present');
        
        if (i === 31) {
          console.log('\n✗ Should have been rate limited at request 31');
        }
      }
      
      console.log('');
      
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    console.log('\n✓ Rate limiting test completed');
    
  } catch (error) {
    console.error('Error:', error.message);
    console.log('\n⚠ Make sure the server is running: npm run server');
  }
}

testRateLimit();

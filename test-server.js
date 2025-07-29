#!/usr/bin/env node

/**
 * Test script to demonstrate the OAuth-enabled MCP Weather Server
 * This script shows what happens when you try to access protected endpoints
 * without proper Auth0 configuration.
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function testEndpoint(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    
    console.log(`\n${method} ${endpoint}:`);
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    return { status: response.status, data };
  } catch (error) {
    console.log(`\n${method} ${endpoint}:`);
    console.log('Error:', error.message);
    return { error: error.message };
  }
}

async function runTests() {
  console.log('🧪 Testing MCP Weather Server with OAuth Authentication');
  console.log('=' .repeat(60));
  
  // Test public endpoints
  console.log('\n📋 Testing Public Endpoints:');
  await testEndpoint('/health');
  await testEndpoint('/');
  
  // Test protected endpoints (should fail without authentication)
  console.log('\n🔒 Testing Protected Endpoints (should require authentication):');
  await testEndpoint('/profile');
  await testEndpoint('/mcp', 'POST', {
    jsonrpc: '2.0',
    method: 'tools/list',
    id: 1
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Test completed!');
  console.log('\nTo test with authentication:');
  console.log('1. Set up Auth0 credentials in .env file');
  console.log('2. Start the server: npm run build && node build/http.js');
  console.log('3. Visit http://localhost:3000/login in your browser');
  console.log('4. Complete the Auth0 login process');
  console.log('5. Access protected endpoints with your authenticated session');
}

// Check if server is running
async function checkServer() {
  try {
    await fetch(`${BASE_URL}/health`);
    return true;
  } catch (error) {
    return false;
  }
}

async function main() {
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.log('❌ Server is not running on http://localhost:3000');
    console.log('\nTo start the server:');
    console.log('1. Configure your .env file with Auth0 credentials');
    console.log('2. Run: npm run build && node build/http.js');
    console.log('3. Then run this test script again');
    process.exit(1);
  }
  
  await runTests();
}

main().catch(console.error);
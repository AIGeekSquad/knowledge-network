// Simple debug script to test spatial indexer imports
console.log('Testing spatial indexer imports...');

try {
  console.log('1. Testing DEFAULT_SPATIAL_CONFIG import...');
  const types = require('./src/spatial/types.js');
  console.log('DEFAULT_SPATIAL_CONFIG exists:', !!types.DEFAULT_SPATIAL_CONFIG);
} catch (e) {
  console.log('Error importing types:', e.message);

  // Try TypeScript import in Node
  try {
    console.log('2. Trying with ts-node...');
    require('ts-node/register');
    const types = require('./src/spatial/types.ts');
    console.log('DEFAULT_SPATIAL_CONFIG exists:', !!types.DEFAULT_SPATIAL_CONFIG);
  } catch (e2) {
    console.log('TS-Node error:', e2.message);
  }
}

console.log('Testing complete.');
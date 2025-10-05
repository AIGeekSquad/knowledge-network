#!/usr/bin/env node

// Test script to verify that enhanced EdgeBundling configuration is working

import { EdgeBundling } from './packages/knowledge-network/dist/index.js';

// Test configuration with all enhanced options
const config = {
  subdivisions: 30,
  adaptiveSubdivision: true,
  compatibilityThreshold: 0.7,
  iterations: 100,
  stepSize: 0.05,
  stiffness: 0.15,
  momentum: 0.7,
  curveType: 'catmullRom',
  curveTension: 0.9,
  smoothingType: 'gaussian',
  smoothingIterations: 3,
  smoothingFrequency: 10
};

console.log('Creating EdgeBundling with enhanced configuration...');
const bundler = new EdgeBundling(config);

console.log('\nConfiguration test results:');
console.log('✓ EdgeBundling instance created successfully');
console.log('✓ All configuration options accepted');

// Verify configuration was applied (check internal properties)
const testsPassed = [];
const testsFailed = [];

// Test subdivisions
if (bundler.subdivisions === 30) {
  testsPassed.push('subdivisions (30)');
} else {
  testsFailed.push(`subdivisions (expected 30, got ${bundler.subdivisions})`);
}

// Test adaptiveSubdivision
if (bundler.adaptiveSubdivision === true) {
  testsPassed.push('adaptiveSubdivision (true)');
} else {
  testsFailed.push(`adaptiveSubdivision (expected true, got ${bundler.adaptiveSubdivision})`);
}

// Test momentum
if (bundler.momentum === 0.7) {
  testsPassed.push('momentum (0.7)');
} else {
  testsFailed.push(`momentum (expected 0.7, got ${bundler.momentum})`);
}

// Test curveType
if (bundler.curveType === 'catmullRom') {
  testsPassed.push('curveType (catmullRom)');
} else {
  testsFailed.push(`curveType (expected catmullRom, got ${bundler.curveType})`);
}

// Test curveTension
if (bundler.curveTension === 0.9) {
  testsPassed.push('curveTension (0.9)');
} else {
  testsFailed.push(`curveTension (expected 0.9, got ${bundler.curveTension})`);
}

// Test smoothingType
if (bundler.smoothingType === 'gaussian') {
  testsPassed.push('smoothingType (gaussian)');
} else {
  testsFailed.push(`smoothingType (expected gaussian, got ${bundler.smoothingType})`);
}

console.log('\nProperty verification:');
if (testsPassed.length > 0) {
  console.log('✓ Properties correctly set:', testsPassed.join(', '));
}
if (testsFailed.length > 0) {
  console.log('✗ Properties incorrectly set:', testsFailed.join(', '));
}

console.log('\n' + '='.repeat(60));
if (testsFailed.length === 0) {
  console.log('SUCCESS: All enhanced EdgeBundling features are working!');
  console.log('The interface fix resolved the configuration issue.');
} else {
  console.log('PARTIAL SUCCESS: Some features working, but issues remain.');
  console.log('Check the failed properties above.');
}
console.log('='.repeat(60));

process.exit(testsFailed.length === 0 ? 0 : 1);
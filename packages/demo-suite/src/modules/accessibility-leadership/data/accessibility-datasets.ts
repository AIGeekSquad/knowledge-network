/**
 * Accessibility Dataset Generator
 *
 * Generates graph datasets optimized for accessibility testing and demonstration.
 */

import type { GraphNode, GraphEdge } from '../../../shared/types.js';

/**
 * Generate accessibility-focused dataset
 */
export function generateAccessibleDataset(): any {
  const accessibilityFeatures = [
    'Screen Reader Support', 'Keyboard Navigation', 'Voice Control', 'High Contrast',
    'Focus Management', 'ARIA Labels', 'Semantic Markup', 'Color Contrast',
    'Alternative Text', 'Skip Links', 'Zoom Support', 'Text Scaling'
  ];

  const wcagPrinciples = [
    'Perceivable', 'Operable', 'Understandable', 'Robust'
  ];

  const assistiveTech = [
    'Screen Readers', 'Voice Recognition', 'Eye Tracking', 'Switch Navigation',
    'Magnification', 'Alternative Keyboards'
  ];

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // Create feature nodes
  accessibilityFeatures.forEach((feature, index) => {
    nodes.push({
      id: `feature-${index}`,
      label: feature,
      type: 'accessibility-feature',
      size: 25,
      color: '#107c10',
      category: 'features',
      metadata: {
        accessible: true,
        wcagLevel: 'AAA',
        description: `${feature} implementation for inclusive design`
      }
    });
  });

  // Create WCAG principle nodes
  wcagPrinciples.forEach((principle, index) => {
    nodes.push({
      id: `wcag-${index}`,
      label: principle,
      type: 'wcag-principle',
      size: 35,
      color: '#1570a6',
      category: 'wcag',
      metadata: {
        accessible: true,
        principle: principle,
        description: `WCAG 2.1 ${principle} principle`
      }
    });
  });

  // Create assistive technology nodes
  assistiveTech.forEach((tech, index) => {
    nodes.push({
      id: `tech-${index}`,
      label: tech,
      type: 'assistive-technology',
      size: 30,
      color: '#ffb900',
      category: 'technology',
      metadata: {
        accessible: true,
        technology: tech,
        description: `${tech} assistive technology support`
      }
    });
  });

  // Create connections between features and WCAG principles
  const featureToPrinciple = [
    [0, 0], [1, 1], [2, 1], [3, 0], [4, 1], [5, 3],
    [6, 3], [7, 0], [8, 0], [9, 1], [10, 0], [11, 0]
  ];

  featureToPrinciple.forEach(([featureIndex, principleIndex], index) => {
    edges.push({
      id: `feature-wcag-${index}`,
      source: `feature-${featureIndex}`,
      target: `wcag-${principleIndex}`,
      type: 'implements',
      weight: 1,
      color: 'rgba(16, 124, 16, 0.7)'
    });
  });

  // Create connections between features and assistive technology
  const featureToTech = [
    [0, 0], [1, 3], [2, 1], [3, 4], [4, 0], [5, 0],
    [10, 4], [11, 4]
  ];

  featureToTech.forEach(([featureIndex, techIndex], index) => {
    edges.push({
      id: `feature-tech-${index}`,
      source: `feature-${featureIndex}`,
      target: `tech-${techIndex}`,
      type: 'supports',
      weight: 0.8,
      color: 'rgba(21, 112, 166, 0.7)'
    });
  });

  return {
    nodes,
    edges,
    metadata: {
      optimizedForAccessibility: true,
      wcagCompliant: 'AAA',
      theme: 'accessibility',
      generatedAt: Date.now()
    }
  };
}
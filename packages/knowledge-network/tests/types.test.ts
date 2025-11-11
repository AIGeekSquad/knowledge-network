import { describe, it, expect } from 'vitest';
import type { Node, Edge, GraphData } from '../src/types';

describe('Types', () => {
  it('should allow valid Node structure', () => {
    const node: Node = {
      id: 'test',
      label: 'Test Node',
      type: 'entity',
      metadata: { custom: 'value' },
    };

    expect(node.id).toBe('test');
    expect(node.label).toBe('Test Node');
  });

  it('should allow valid Edge structure', () => {
    const edge: Edge = {
      source: 'node1',
      target: 'node2',
      label: 'relates to',
      weight: 1.0,
    };

    expect(edge.source).toBe('node1');
    expect(edge.target).toBe('node2');
  });

  it('should allow valid GraphData structure', () => {
    const graphData: GraphData = {
      nodes: [
        { id: 'node1' },
        { id: 'node2' },
      ],
      edges: [
        { source: 'node1', target: 'node2' },
      ],
    };

    expect(graphData.nodes).toHaveLength(2);
    expect(graphData.edges).toHaveLength(1);
  });
});
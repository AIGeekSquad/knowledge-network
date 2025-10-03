import * as d3 from 'd3';
import type { GraphData } from '../types';

/**
 * Force-directed layout engine for positioning nodes in the graph
 */
export class ForceLayoutEngine {
  private simulation: d3.Simulation<d3.SimulationNodeDatum, undefined> | null = null;

  /**
   * Create a force simulation for the given graph data
   */
  createSimulation(
    data: GraphData,
    width: number,
    height: number,
    config?: {
      linkDistance?: number;
      chargeStrength?: number;
    }
  ): d3.Simulation<d3.SimulationNodeDatum, undefined> {
    const { linkDistance = 100, chargeStrength = -300 } = config ?? {};

    this.simulation = d3.forceSimulation(data.nodes as d3.SimulationNodeDatum[])
      .force('link', d3.forceLink(data.edges)
        .id((d: any) => d.id)
        .distance(linkDistance))
      .force('charge', d3.forceManyBody().strength(chargeStrength))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(20));

    return this.simulation;
  }

  /**
   * Stop the simulation
   */
  stop(): void {
    if (this.simulation) {
      this.simulation.stop();
    }
  }

  /**
   * Get the current simulation
   */
  getSimulation(): d3.Simulation<d3.SimulationNodeDatum, undefined> | null {
    return this.simulation;
  }
}

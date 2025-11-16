/**
 * Layout Calculator - Core D3.js Force Simulation
 * 
 * Handles force-directed layout calculations independent of rendering concerns.
 * Uses D3.js v7 force simulation for positioning nodes with configurable forces.
 * 
 * @fileoverview Core layout calculation engine
 */

import * as d3 from 'd3';
import { EventEmitter } from '../utils/ReactiveEmitter.js';
import type { Node } from '../types';
import type {
  LayoutNode,
  LayoutConfiguration,
  LayoutMetadata,
  PerformanceMetrics,
  ProgressCallback
} from './layout-engine';

/**
 * Core layout calculator using D3.js force simulation
 * Independent of rendering - no DOM/Canvas/SVG dependencies
 */
export class LayoutCalculator extends EventEmitter {
  private simulation: d3.Simulation<d3.SimulationNodeDatum, undefined> | null = null;
  private isRunning = false;
  private startTime = 0;
  private currentIteration = 0;

  /**
   * Calculate layout for given nodes using D3.js force simulation
   * Returns Map<string, LayoutNode> for O(1) lookups
   */
  async calculateAsync(
    nodes: Node[], 
    config: LayoutConfiguration,
    progress?: ProgressCallback
  ): Promise<Map<string, LayoutNode>> {
    this.startTime = Date.now();
    this.currentIteration = 0;
    this.isRunning = true;

    // Report initialization progress
    progress?.({
      stage: 'initialization',
      percentage: 0,
      message: `Initializing layout for ${nodes.length} nodes`,
      metrics: this.getPerformanceMetrics(),
      cancellable: true
    });

    try {
      // Convert nodes to D3 simulation nodes
      const simulationNodes = nodes.map(node => ({
        ...node,
        x: Math.random() * 800, // Random initial position
        y: Math.random() * 600,
        vx: 0,
        vy: 0
      }));

      // Create force simulation with proper typing
      this.simulation = d3.forceSimulation(simulationNodes as d3.SimulationNodeDatum[])
        .force('charge', d3.forceManyBody().strength(config.forceParameters.chargeForce * -300))
        .force('center', d3.forceCenter(400, 300))
        .force('collision', d3.forceCollide().radius(config.forceParameters.collisionRadius))
        .stop(); // Don't start automatically

      // Custom force configuration if provided
      if (config.forceParameters.customForces) {
        for (const [, ] of config.forceParameters.customForces) {
          // Add custom forces based on configuration
          // This is extensible for future force types
        }
      }

      // Set up progress reporting
      let iterationCount = 0;
      const maxIterations = config.maxIterations;
      
      this.simulation?.on('tick', () => {
        iterationCount++;
        this.currentIteration = iterationCount;
        
        const percentage = Math.min((iterationCount / maxIterations) * 100, 100);
        
        progress?.({
          stage: 'simulation',
          percentage,
          message: `Running simulation: iteration ${iterationCount}/${maxIterations}`,
          metrics: this.getPerformanceMetrics(),
          cancellable: true
        });

        // Check stability
        if (this.checkStability(simulationNodes, config.stabilityThreshold)) {
          this.simulation?.stop();
        }
      });

      // Run simulation
      progress?.({
        stage: 'simulation',
        percentage: 10,
        message: 'Starting force simulation',
        metrics: this.getPerformanceMetrics(),
        cancellable: true
      });

      // Run simulation for specified iterations or until stable
      for (let i = 0; i < maxIterations && this.isRunning; i++) {
        this.simulation?.tick();
        
        if (this.checkStability(simulationNodes, config.stabilityThreshold)) {
          break;
        }

        // Yield control periodically for async behavior
        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 1));
        }
      }

      // Convert to LayoutNode map
      const layoutMap = new Map<string, LayoutNode>();
      
      progress?.({
        stage: 'finalization',
        percentage: 90,
        message: 'Converting to layout nodes',
        metrics: this.getPerformanceMetrics(),
        cancellable: false
      });

      for (const simNode of simulationNodes) {
        const layoutNode: LayoutNode = {
          id: simNode.id,
          x: simNode.x || 0,
          y: simNode.y || 0,
          clusterId: undefined, // Will be set by clustering if enabled
          similarityScores: new Map(),
          originalData: simNode,
          layoutMetadata: this.createLayoutMetadata(simNode)
        };
        
        layoutMap.set(simNode.id, layoutNode);
      }

      // Apply clustering if enabled
      if (config.clusteringConfig.enabled) {
        await this.applyClustering(layoutMap, config);
      }

      progress?.({
        stage: 'finalization',
        percentage: 100,
        message: `Layout complete: ${layoutMap.size} nodes positioned`,
        metrics: this.getPerformanceMetrics(),
        cancellable: false
      });

      this.isRunning = false;
      return layoutMap;

    } catch (error) {
      this.isRunning = false;
      throw new Error(`Layout calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if simulation has stabilized
   */
  private checkStability(nodes: d3.SimulationNodeDatum[], threshold: number): boolean {
    let totalVelocity = 0;
    
    for (const node of nodes) {
      if (node.vx !== undefined && node.vy !== undefined) {
        totalVelocity += Math.abs(node.vx) + Math.abs(node.vy);
      }
    }
    
    const averageVelocity = totalVelocity / nodes.length;
    return averageVelocity < threshold;
  }

  /**
   * Apply clustering based on similarity scores
   */
  private async applyClustering(
    layoutMap: Map<string, LayoutNode>, 
    config: LayoutConfiguration
  ): Promise<void> {
    // Simple clustering implementation
    // In a full implementation, this would use the configured clustering algorithm
    
    const nodes = Array.from(layoutMap.values());
    let clusterId = 0;
    
    for (const node of nodes) {
      if (!node.clusterId) {
        const cluster = `cluster_${clusterId++}`;
        node.clusterId = cluster;
        
        // Find nearby nodes to cluster together
        for (const otherNode of nodes) {
          if (!otherNode.clusterId && node.id !== otherNode.id) {
            const distance = Math.sqrt(
              Math.pow(node.x - otherNode.x, 2) + Math.pow(node.y - otherNode.y, 2)
            );
            
            if (distance < config.clusteringConfig.clusterSeparation) {
              otherNode.clusterId = cluster;
            }
          }
        }
      }
    }
  }

  /**
   * Create layout metadata for a node
   */
  private createLayoutMetadata(node: d3.SimulationNodeDatum): LayoutMetadata {
    return {
      algorithm: 'force-directed',
      timestamp: Date.now(),
      processingTime: Date.now() - this.startTime,
      appliedForces: new Map([
        ['charge', this.simulation?.force('charge') ? 1 : 0],
        ['center', this.simulation?.force('center') ? 1 : 0],
        ['collision', this.simulation?.force('collision') ? 1 : 0]
      ]),
      customData: {
        initialPosition: { x: node.x, y: node.y },
        finalVelocity: { vx: node.vx || 0, vy: node.vy || 0 }
      }
    };
  }

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    const now = Date.now();
    const processingTime = now - this.startTime;
    
    return {
      processingTime,
      memoryUsage: process.memoryUsage?.()?.heapUsed / 1024 / 1024 || 0, // MB
      iterations: this.currentIteration,
      stabilityScore: 0.5, // Placeholder - would calculate actual stability
      currentFPS: this.calculateFPS()
    };
  }

  /**
   * Calculate approximate FPS for performance monitoring
   */
  private calculateFPS(): number {
    if (this.currentIteration === 0) return 0;
    
    const timeElapsed = (Date.now() - this.startTime) / 1000; // seconds
    return Math.round(this.currentIteration / timeElapsed);
  }

  /**
   * Stop the current calculation
   */
  stop(): void {
    this.isRunning = false;
    if (this.simulation) {
      this.simulation.stop();
    }
  }

  /**
   * Get the current D3 simulation (for debugging/testing)
   */
  getSimulation(): d3.Simulation<d3.SimulationNodeDatum, undefined> | null {
    return this.simulation;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stop();
    this.simulation = null;
    this.removeAllListeners();
  }
}
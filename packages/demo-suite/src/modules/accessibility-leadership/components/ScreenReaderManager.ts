/**
 * Screen Reader Manager Component
 *
 * Provides comprehensive screen reader support for graph visualization.
 * Implements intelligent spatial descriptions and Xbox-themed announcements.
 */

import { EventEmitter } from '../../../shared/utils.js';
import type { ScreenReaderAnnouncement, KeyboardNavigationState } from '../AccessibilityLeadership.js';

interface ScreenReaderConfig {
  container: HTMLElement;
  verbosity: 'minimal' | 'standard' | 'verbose';
  announceActions: boolean;
}

export class ScreenReaderManager extends EventEmitter<{
  announcement: ScreenReaderAnnouncement;
}> {
  private container: HTMLElement;
  private verbosity: 'minimal' | 'standard' | 'verbose';
  private announceActions: boolean;
  private ariaLiveRegion: HTMLElement;
  private assertiveRegion: HTMLElement;

  // Announcement queue for managing multiple messages
  private announcementQueue: ScreenReaderAnnouncement[] = [];
  private isAnnouncing = false;

  constructor({ container, verbosity, announceActions }: ScreenReaderConfig) {
    super();
    this.container = container;
    this.verbosity = verbosity;
    this.announceActions = announceActions;

    this.createAriaLiveRegions();
    this.setupScreenReaderEnhancements();
  }

  updateConfig(config: Partial<ScreenReaderConfig>): void {
    if (config.verbosity !== undefined) {
      this.verbosity = config.verbosity;
    }
    if (config.announceActions !== undefined) {
      this.announceActions = config.announceActions;
    }
  }

  /**
   * Announce a message to screen readers
   */
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcement: ScreenReaderAnnouncement = {
      message,
      priority,
      type: 'status',
      context: this.getCurrentContext()
    };

    this.queueAnnouncement(announcement);
  }

  /**
   * Announce node selection with intelligent context
   */
  announceNodeSelection(node: any, navigationState: KeyboardNavigationState): void {
    const announcement = this.buildNodeSelectionAnnouncement(node, navigationState);
    this.queueAnnouncement(announcement);
  }

  /**
   * Announce interaction events
   */
  announceSelection(event: any): void {
    if (!this.announceActions) return;

    const message = this.buildSelectionMessage(event);
    this.announce(message, 'assertive');
  }

  /**
   * Provide spatial description of graph area
   */
  describeSpatialContext(position: { x: number; y: number }, nodes: any[]): string {
    const quadrant = this.getQuadrant(position);
    const density = this.calculateDensity(position, nodes);
    const landmarks = this.findNearbyLandmarks(position, nodes);

    let description = `Located in ${quadrant} quadrant`;

    if (this.verbosity !== 'minimal') {
      description += `, ${density} density area`;
    }

    if (this.verbosity === 'verbose' && landmarks.length > 0) {
      description += `, near ${landmarks.join(', ')}`;
    }

    return description;
  }

  /**
   * Describe available navigation options
   */
  describeNavigationOptions(neighbors: any): string {
    const directions: string[] = [];

    if (neighbors.up) directions.push('up');
    if (neighbors.down) directions.push('down');
    if (neighbors.left) directions.push('left');
    if (neighbors.right) directions.push('right');

    if (directions.length === 0) {
      return 'No adjacent nodes available';
    }

    const directionText = directions.length === 1
      ? directions[0]
      : `${directions.slice(0, -1).join(', ')} and ${directions[directions.length - 1]}`;

    return `Navigation available: ${directionText}`;
  }

  /**
   * Provide graph overview for screen readers
   */
  describeGraphOverview(dataset: any): string {
    const nodeCount = dataset.nodes?.length || 0;
    const edgeCount = dataset.edges?.length || 0;

    let overview = `Graph contains ${nodeCount} nodes and ${edgeCount} connections`;

    if (this.verbosity !== 'minimal') {
      const categories = this.getNodeCategories(dataset.nodes || []);
      if (categories.length > 0) {
        overview += `. Categories include: ${categories.join(', ')}`;
      }
    }

    if (this.verbosity === 'verbose') {
      const graphType = this.analyzeGraphStructure(dataset);
      overview += `. Graph structure appears to be ${graphType}`;
    }

    return overview;
  }

  /**
   * Announce keyboard shortcuts
   */
  announceKeyboardShortcuts(): void {
    const shortcuts = [
      'Arrow keys: Navigate between nodes',
      'Enter: Select current node',
      'Space: Expand or collapse node',
      'Escape: Clear selection',
      'Tab: Move to controls'
    ];

    const message = `Keyboard shortcuts: ${shortcuts.join('. ')}`;
    this.announce(message, 'polite');
  }

  destroy(): void {
    this.clearAnnouncementQueue();
    this.removeAriaLiveRegions();
    this.removeAllListeners();
  }

  // Private methods

  private createAriaLiveRegions(): void {
    // Polite announcements
    this.ariaLiveRegion = document.createElement('div');
    this.ariaLiveRegion.className = 'sr-only';
    this.ariaLiveRegion.setAttribute('aria-live', 'polite');
    this.ariaLiveRegion.setAttribute('aria-atomic', 'false');
    this.ariaLiveRegion.setAttribute('aria-relevant', 'all');

    // Assertive announcements (interrupts screen reader)
    this.assertiveRegion = document.createElement('div');
    this.assertiveRegion.className = 'sr-only';
    this.assertiveRegion.setAttribute('aria-live', 'assertive');
    this.assertiveRegion.setAttribute('aria-atomic', 'true');

    this.container.appendChild(this.ariaLiveRegion);
    this.container.appendChild(this.assertiveRegion);
  }

  private setupScreenReaderEnhancements(): void {
    // Add comprehensive ARIA structure
    this.container.setAttribute('role', 'application');
    this.container.setAttribute('aria-label', 'Interactive Graph Visualization');

    // Add graph description
    const description = document.createElement('div');
    description.id = 'graph-instructions';
    description.className = 'sr-only';
    description.textContent = 'Use arrow keys to navigate between graph nodes. Press Enter to select a node, Space to expand details, and Escape to clear selection. Say "help" for voice commands.';

    this.container.appendChild(description);
    this.container.setAttribute('aria-describedby', 'graph-instructions');

    // Set up roving tabindex for nodes
    this.setupRovingTabindex();
  }

  private setupRovingTabindex(): void {
    // Implement roving tabindex pattern for graph nodes
    // This ensures only one node is in the tab order at a time
    this.container.addEventListener('keydown', (event) => {
      this.handleRovingTabindex(event);
    });
  }

  private handleRovingTabindex(event: KeyboardEvent): void {
    const focusedElement = document.activeElement as HTMLElement;

    if (event.key === 'Tab') {
      // Allow tab to move out of graph area to controls
      return;
    }

    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.preventDefault();
      this.moveRovingFocus(event.key);
    }
  }

  private moveRovingFocus(direction: string): void {
    const currentFocus = document.activeElement as HTMLElement;
    const graphNodes = Array.from(this.container.querySelectorAll('[data-graph-node]'));
    const currentIndex = graphNodes.indexOf(currentFocus);

    if (currentIndex === -1) {
      // No current focus, select first node
      this.setRovingFocus(graphNodes[0] as HTMLElement);
      return;
    }

    // Calculate next node based on spatial position
    const nextNode = this.findNextNodeInDirection(
      currentFocus,
      direction.replace('Arrow', '').toLowerCase(),
      graphNodes as HTMLElement[]
    );

    if (nextNode) {
      this.setRovingFocus(nextNode);
    }
  }

  private setRovingFocus(element: HTMLElement): void {
    // Remove tabindex from all nodes
    const allNodes = this.container.querySelectorAll('[data-graph-node]');
    allNodes.forEach(node => {
      (node as HTMLElement).tabIndex = -1;
    });

    // Set tabindex and focus on target element
    element.tabIndex = 0;
    element.focus();
  }

  private findNextNodeInDirection(
    current: HTMLElement,
    direction: string,
    nodes: HTMLElement[]
  ): HTMLElement | null {
    // This would integrate with the spatial navigation system
    // For now, return a simple implementation
    const currentIndex = nodes.indexOf(current);

    switch (direction) {
      case 'up':
      case 'left':
        return nodes[Math.max(0, currentIndex - 1)] || null;
      case 'down':
      case 'right':
        return nodes[Math.min(nodes.length - 1, currentIndex + 1)] || null;
      default:
        return null;
    }
  }

  private queueAnnouncement(announcement: ScreenReaderAnnouncement): void {
    this.announcementQueue.push(announcement);
    this.emit('announcement', announcement);

    if (!this.isAnnouncing) {
      this.processAnnouncementQueue();
    }
  }

  private async processAnnouncementQueue(): Promise<void> {
    if (this.announcementQueue.length === 0) {
      this.isAnnouncing = false;
      return;
    }

    this.isAnnouncing = true;
    const announcement = this.announcementQueue.shift()!;

    // Select appropriate ARIA live region
    const liveRegion = announcement.priority === 'assertive'
      ? this.assertiveRegion
      : this.ariaLiveRegion;

    // Clear previous content and add new message
    liveRegion.textContent = '';
    await this.delay(100); // Brief pause to ensure screen reader notices change

    liveRegion.textContent = announcement.message;

    // Wait before processing next announcement
    await this.delay(announcement.priority === 'assertive' ? 2000 : 1000);

    // Process next announcement
    this.processAnnouncementQueue();
  }

  private buildNodeSelectionAnnouncement(node: any, state: KeyboardNavigationState): ScreenReaderAnnouncement {
    let message = `Selected ${node.label || node.id}`;

    if (this.verbosity !== 'minimal') {
      // Add node type and category
      if (node.type) {
        message += `, ${node.type} node`;
      }

      if (node.category) {
        message += ` in ${node.category} category`;
      }

      // Add connection information
      const connectionCount = this.getConnectionCount(node);
      if (connectionCount > 0) {
        message += `, ${connectionCount} connection${connectionCount === 1 ? '' : 's'}`;
      }
    }

    if (this.verbosity === 'verbose') {
      // Add spatial context
      const spatialDesc = this.describeSpatialContext(state.position, []);
      message += `. ${spatialDesc}`;

      // Add navigation options
      const navOptions = this.describeNavigationOptions(state.neighbors);
      message += `. ${navOptions}`;
    }

    return {
      message,
      priority: 'assertive',
      type: 'selection',
      context: 'node-selection',
      metadata: { nodeId: node.id, nodeType: node.type }
    };
  }

  private buildSelectionMessage(event: any): string {
    return `Selected item at position ${event.x}, ${event.y}`;
  }

  private getCurrentContext(): string {
    // Return current application context for announcements
    return 'graph-navigation';
  }

  private getQuadrant(position: { x: number; y: number }): string {
    // Determine which quadrant of the graph the position is in
    const centerX = this.container.offsetWidth / 2;
    const centerY = this.container.offsetHeight / 2;

    if (position.x < centerX && position.y < centerY) return 'upper-left';
    if (position.x >= centerX && position.y < centerY) return 'upper-right';
    if (position.x < centerX && position.y >= centerY) return 'lower-left';
    return 'lower-right';
  }

  private calculateDensity(position: { x: number; y: number }, nodes: any[]): string {
    // Calculate node density around the position
    const radius = 100; // pixels
    const nearbyNodes = nodes.filter(node => {
      const distance = Math.sqrt(
        Math.pow(node.position.x - position.x, 2) +
        Math.pow(node.position.y - position.y, 2)
      );
      return distance <= radius;
    });

    const density = nearbyNodes.length;
    if (density < 3) return 'low';
    if (density < 7) return 'medium';
    return 'high';
  }

  private findNearbyLandmarks(position: { x: number; y: number }, nodes: any[]): string[] {
    // Find significant nearby nodes that can serve as landmarks
    return nodes
      .filter(node => node.size > 20 || node.important) // Large or important nodes
      .filter(node => {
        const distance = Math.sqrt(
          Math.pow(node.position.x - position.x, 2) +
          Math.pow(node.position.y - position.y, 2)
        );
        return distance <= 150; // Within landmark radius
      })
      .map(node => node.label || node.id)
      .slice(0, 3); // Maximum 3 landmarks
  }

  private getNodeCategories(nodes: any[]): string[] {
    const categories = new Set(nodes.map(node => node.category).filter(Boolean));
    return Array.from(categories);
  }

  private analyzeGraphStructure(dataset: any): string {
    const nodes = dataset.nodes || [];
    const edges = dataset.edges || [];

    if (edges.length === 0) return 'disconnected nodes';

    const avgConnections = edges.length * 2 / nodes.length;

    if (avgConnections < 1.5) return 'sparse network';
    if (avgConnections < 3) return 'moderate network';
    return 'dense network';
  }

  private getConnectionCount(node: any): number {
    // This would calculate actual connections in the graph
    return node.connections?.length || 0;
  }

  private clearAnnouncementQueue(): void {
    this.announcementQueue = [];
    this.isAnnouncing = false;
  }

  private removeAriaLiveRegions(): void {
    if (this.ariaLiveRegion?.parentNode) {
      this.ariaLiveRegion.parentNode.removeChild(this.ariaLiveRegion);
    }
    if (this.assertiveRegion?.parentNode) {
      this.assertiveRegion.parentNode.removeChild(this.assertiveRegion);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
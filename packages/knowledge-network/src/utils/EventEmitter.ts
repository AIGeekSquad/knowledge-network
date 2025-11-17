/**
 * @fileoverview EventEmitter - Simple event emitter for layout progress tracking
 * 
 * Provides event emission and subscription capabilities for NodeLayout components
 * to communicate progress updates, convergence status, and completion events.
 */

import { LayoutEventEmitter } from '../types';

/**
 * Simple EventEmitter implementation for layout events
 */
export class EventEmitter implements LayoutEventEmitter {
  private readonly listeners = new Map<string, Function[]>();

  /**
   * Subscribe to an event
   */
  public on(event: string, handler: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    
    const eventListeners = this.listeners.get(event)!;
    eventListeners.push(handler);
  }

  /**
   * Emit an event with data
   */
  public emit(event: string, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      for (const listener of eventListeners) {
        try {
          listener(data);
        } catch (error) {
          console.warn(`Event listener error for event '${event}':`, error);
        }
      }
    }
  }

  /**
   * Unsubscribe from an event
   */
  public off(event: string, handler: Function): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(handler);
      if (index >= 0) {
        eventListeners.splice(index, 1);
      }
      
      // Clean up empty listener arrays
      if (eventListeners.length === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Remove all listeners for an event or all events
   */
  public removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Get count of listeners for an event
   */
  public listenerCount(event: string): number {
    const eventListeners = this.listeners.get(event);
    return eventListeners ? eventListeners.length : 0;
  }

  /**
   * Get all registered event names
   */
  public eventNames(): string[] {
    return Array.from(this.listeners.keys());
  }
}
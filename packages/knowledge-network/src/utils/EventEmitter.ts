/**
 * Browser-compatible EventEmitter implementation
 * 
 * Provides EventEmitter functionality that works in both Node.js and browser environments
 * Replaces Node.js 'events' module dependency for browser compatibility
 */

export interface EventListener {
  (...args: any[]): void;
}

export class EventEmitter {
  private events: Map<string, Set<EventListener>> = new Map();
  private maxListeners: number = 10;

  /**
   * Add a listener for the specified event
   */
  public on(event: string, listener: EventListener): this {
    this.addListener(event, listener);
    return this;
  }

  /**
   * Add a listener for the specified event
   */
  public addListener(event: string, listener: EventListener): this {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    
    const listeners = this.events.get(event)!;
    listeners.add(listener);

    // Check max listeners warning
    if (listeners.size > this.maxListeners) {
      console.warn(`MaxListenersExceededWarning: ${listeners.size} ${event} listeners added. Use setMaxListeners() to increase limit.`);
    }

    return this;
  }

  /**
   * Add a one-time listener for the specified event
   */
  public once(event: string, listener: EventListener): this {
    const onceWrapper = (...args: any[]) => {
      this.removeListener(event, onceWrapper);
      listener.apply(this, args);
    };
    
    return this.addListener(event, onceWrapper);
  }

  /**
   * Remove a specific listener for the specified event
   */
  public removeListener(event: string, listener: EventListener): this {
    const listeners = this.events.get(event);
    if (listeners) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.events.delete(event);
      }
    }
    return this;
  }

  /**
   * Remove all listeners for the specified event, or all events if no event specified
   */
  public removeAllListeners(event?: string): this {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
    return this;
  }

  /**
   * Emit an event to all listeners
   */
  public emit(event: string, ...args: any[]): boolean {
    const listeners = this.events.get(event);
    if (!listeners || listeners.size === 0) {
      return false;
    }

    // Execute all listeners
    listeners.forEach(listener => {
      try {
        listener.apply(this, args);
      } catch (error) {
        // Emit error event but don't stop other listeners
        this.emit('error', error);
      }
    });

    return true;
  }

  /**
   * Get all listeners for the specified event
   */
  public listeners(event: string): EventListener[] {
    const listeners = this.events.get(event);
    return listeners ? Array.from(listeners) : [];
  }

  /**
   * Get the number of listeners for the specified event
   */
  public listenerCount(event: string): number {
    const listeners = this.events.get(event);
    return listeners ? listeners.size : 0;
  }

  /**
   * Set the maximum number of listeners before warning
   */
  public setMaxListeners(n: number): this {
    this.maxListeners = n;
    return this;
  }

  /**
   * Get the maximum number of listeners
   */
  public getMaxListeners(): number {
    return this.maxListeners;
  }

  /**
   * Get all event names that have listeners
   */
  public eventNames(): string[] {
    return Array.from(this.events.keys());
  }

  /**
   * Prepend a listener to the beginning of the listeners array
   */
  public prependListener(event: string, listener: EventListener): this {
    // Since we're using Set, we can't truly prepend, but we can simulate it
    // by removing and re-adding (Set maintains insertion order in modern JS)
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    
    const listeners = this.events.get(event)!;
    const existingListeners = Array.from(listeners);
    listeners.clear();
    listeners.add(listener);
    existingListeners.forEach(l => listeners.add(l));

    return this;
  }

  /**
   * Prepend a one-time listener to the beginning of the listeners array
   */
  public prependOnceListener(event: string, listener: EventListener): this {
    const onceWrapper = (...args: any[]) => {
      this.removeListener(event, onceWrapper);
      listener.apply(this, args);
    };
    
    return this.prependListener(event, onceWrapper);
  }

  /**
   * Remove a listener (alias for removeListener)
   */
  public off(event: string, listener: EventListener): this {
    return this.removeListener(event, listener);
  }
}

// For compatibility with Node.js EventEmitter static methods
EventEmitter.prototype.setMaxListeners = EventEmitter.prototype.setMaxListeners;

// Default export for compatibility
export default EventEmitter;
/**
 * RxJS-based Reactive Event System
 * 
 * Provides universal reactive programming patterns using RxJS
 * Works seamlessly in both Node.js and browser environments
 */

import { Subject, Observable } from 'rxjs';
import { filter, map, share, takeUntil } from 'rxjs/operators';

export interface EventData {
  type: string;
  payload: any;
  timestamp: number;
  source?: string;
}

/**
 * Universal reactive event emitter using RxJS
 * Superior to EventEmitter - works everywhere and provides reactive patterns
 */
export class ReactiveEmitter {
  private eventStream$ = new Subject<EventData>();
  private destroy$ = new Subject<void>();
  private eventCounts = new Map<string, number>();

  /**
   * Emit an event to all subscribers
   */
  public emit(eventType: string, payload?: any, source?: string): void {
    const eventData: EventData = {
      type: eventType,
      payload,
      timestamp: Date.now(),
      source
    };

    // Track event counts
    this.eventCounts.set(eventType, (this.eventCounts.get(eventType) || 0) + 1);

    this.eventStream$.next(eventData);
  }

  /**
   * Subscribe to specific event type
   */
  public on(eventType: string): Observable<any> {
    return this.eventStream$.pipe(
      filter(event => event.type === eventType),
      map(event => event.payload),
      takeUntil(this.destroy$),
      share()
    );
  }

  /**
   * Subscribe to all events
   */
  public onAll(): Observable<EventData> {
    return this.eventStream$.pipe(
      takeUntil(this.destroy$),
      share()
    );
  }

  /**
   * Get event count for specific type
   */
  public getEventCount(eventType: string): number {
    return this.eventCounts.get(eventType) || 0;
  }

  /**
   * Destroy the emitter and complete all observables
   */
  public destroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.eventStream$.complete();
    this.eventCounts.clear();
  }
}

/**
 * EventEmitter-compatible API using RxJS internally
 * Provides traditional EventEmitter interface without inheritance conflicts
 */
export class EventEmitter {
  private reactive = new ReactiveEmitter();
  private subscriptions = new Map<string, any[]>();

  /**
   * EventEmitter-compatible on method
   */
  public on(eventType: string, callback: (data: any) => void): this {
    const subscription = this.reactive.on(eventType).subscribe(callback);
    
    if (!this.subscriptions.has(eventType)) {
      this.subscriptions.set(eventType, []);
    }
    this.subscriptions.get(eventType)!.push({ callback, subscription });
    return this;
  }

  /**
   * EventEmitter-compatible addListener method  
   */
  public addListener(eventType: string, callback: (data: any) => void): this {
    return this.on(eventType, callback);
  }

  /**
   * EventEmitter-compatible once method
   */
  public once(eventType: string, callback: (data: any) => void): this {
    const subscription = this.reactive.on(eventType).subscribe({
      next: (data) => {
        callback(data);
        subscription.unsubscribe();
      }
    });
    return this;
  }

  /**
   * EventEmitter-compatible off method
   */
  public off(eventType: string, callback?: (data: any) => void): this {
    const subs = this.subscriptions.get(eventType);
    if (subs && callback) {
      const index = subs.findIndex(sub => sub.callback === callback);
      if (index >= 0) {
        subs[index].subscription.unsubscribe();
        subs.splice(index, 1);
      }
    }
    return this;
  }

  /**
   * EventEmitter-compatible removeListener method
   */
  public removeListener(eventType: string, callback: (data: any) => void): this {
    return this.off(eventType, callback);
  }

  /**
   * EventEmitter-compatible removeAllListeners method
   */
  public removeAllListeners(eventType?: string): this {
    if (eventType) {
      const subs = this.subscriptions.get(eventType);
      if (subs) {
        subs.forEach(sub => sub.subscription.unsubscribe());
        this.subscriptions.delete(eventType);
      }
    } else {
      this.subscriptions.forEach(subs => {
        subs.forEach(sub => sub.subscription.unsubscribe());
      });
      this.subscriptions.clear();
    }
    return this;
  }

  /**
   * EventEmitter-compatible emit method
   */
  public emit(eventType: string, payload?: any): boolean {
    this.reactive.emit(eventType, payload);
    return this.subscriptions.has(eventType) && this.subscriptions.get(eventType)!.length > 0;
  }

  /**
   * Get listener count (EventEmitter compatibility)
   */
  public listenerCount(eventType: string): number {
    return this.subscriptions.get(eventType)?.length || 0;
  }

  /**
   * Get event names (EventEmitter compatibility)
   */
  public eventNames(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  /**
   * Set max listeners (EventEmitter compatibility - no-op)
   */
  public setMaxListeners(_n: number): this {
    // No-op for compatibility
    return this;
  }

  /**
   * Get max listeners (EventEmitter compatibility)
   */
  public getMaxListeners(): number {
    return 10; // Default Node.js EventEmitter value
  }

  /**
   * Clean destroy 
   */
  public destroy(): void {
    this.removeAllListeners();
    this.reactive.destroy();
  }
}

// Export both for flexibility
export { ReactiveEmitter as RxEmitter };
export default EventEmitter;
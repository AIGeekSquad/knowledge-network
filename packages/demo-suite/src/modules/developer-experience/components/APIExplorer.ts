/**
 * API Explorer Component
 *
 * Interactive API documentation and testing interface.
 */

import { EventEmitter } from '../../../shared/utils.js';
import type { APIEndpoint } from '../DeveloperExperience.js';

interface APIExplorerConfig {
  container: HTMLElement;
  onAPICall: (endpoint: APIEndpoint, params: any) => void;
}

export class APIExplorer extends EventEmitter<{
  apiCall: { endpoint: APIEndpoint; params: any };
}> {
  private container: HTMLElement;
  private onAPICallCallback: (endpoint: APIEndpoint, params: any) => void;

  constructor({ container, onAPICall }: APIExplorerConfig) {
    super();
    this.container = container;
    this.onAPICallCallback = onAPICall;
  }

  destroy(): void {
    this.removeAllListeners();
  }
}
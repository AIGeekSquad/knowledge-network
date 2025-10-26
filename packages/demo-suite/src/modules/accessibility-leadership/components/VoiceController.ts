/**
 * Voice Controller Component
 *
 * Implements hands-free voice navigation for graph interactions.
 * Provides Xbox-style voice commands with natural language processing.
 */

import { EventEmitter } from '../../../shared/utils.js';
import type { VoiceCommand } from '../AccessibilityLeadership.js';

interface VoiceControllerConfig {
  language: string;
  onCommand: (command: VoiceCommand) => void;
  enabled: boolean;
}

export class VoiceController extends EventEmitter<{
  command: VoiceCommand;
  listening: boolean;
  error: string;
}> {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;
  private language: string;
  private onCommandCallback: (command: VoiceCommand) => void;
  private enabled: boolean;

  // Xbox-inspired voice command patterns
  private commandPatterns = {
    navigation: [
      { pattern: /(?:select|go to|find)\s+(.+)/i, action: 'select', confidence: 0.9 },
      { pattern: /(?:zoom in|zoom closer)/i, action: 'zoom_in', confidence: 0.95 },
      { pattern: /(?:zoom out|zoom back)/i, action: 'zoom_out', confidence: 0.95 },
      { pattern: /(?:center|center view|go home)/i, action: 'center', confidence: 0.9 },
      { pattern: /(?:next|next node)/i, action: 'next', confidence: 0.85 },
      { pattern: /(?:previous|prev|back)/i, action: 'previous', confidence: 0.85 }
    ],
    information: [
      { pattern: /(?:describe|what is|tell me about)\s*(.*)$/i, action: 'describe', confidence: 0.9 },
      { pattern: /(?:list connections|show connections|connections)/i, action: 'connections', confidence: 0.95 },
      { pattern: /(?:what am i looking at|where am i)/i, action: 'current_context', confidence: 0.9 },
      { pattern: /(?:help|commands|what can i say)/i, action: 'help', confidence: 0.95 },
      { pattern: /(?:stats|statistics|info)/i, action: 'statistics', confidence: 0.85 }
    ],
    actions: [
      { pattern: /(?:expand|open|show details)/i, action: 'expand', confidence: 0.9 },
      { pattern: /(?:collapse|close|hide details)/i, action: 'collapse', confidence: 0.9 },
      { pattern: /(?:highlight path|show path|find path)\s+(.+)/i, action: 'highlight_path', confidence: 0.85 },
      { pattern: /(?:search|find|look for)\s+(.+)/i, action: 'search', confidence: 0.8 },
      { pattern: /(?:clear|reset|start over)/i, action: 'clear', confidence: 0.9 }
    ],
    control: [
      { pattern: /(?:start listening|listen)/i, action: 'start_listening', confidence: 0.95 },
      { pattern: /(?:stop listening|stop)/i, action: 'stop_listening', confidence: 0.95 },
      { pattern: /(?:repeat|say again)/i, action: 'repeat', confidence: 0.9 }
    ]
  };

  constructor({ language, onCommand, enabled }: VoiceControllerConfig) {
    super();
    this.language = language;
    this.onCommandCallback = onCommand;
    this.enabled = enabled;

    this.initializeSpeechRecognition();
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled && this.isListening) {
      this.stopListening();
    }
  }

  setLanguage(language: string): void {
    this.language = language;
    if (this.recognition) {
      this.recognition.lang = language;
    }
  }

  startListening(): void {
    if (!this.enabled || !this.recognition || this.isListening) return;

    try {
      this.recognition.start();
      this.isListening = true;
      this.emit('listening', true);
    } catch (error) {
      console.error('Failed to start voice recognition:', error);
      this.emit('error', 'Failed to start voice recognition');
    }
  }

  stopListening(): void {
    if (!this.recognition || !this.isListening) return;

    try {
      this.recognition.stop();
      this.isListening = false;
      this.emit('listening', false);
    } catch (error) {
      console.error('Failed to stop voice recognition:', error);
    }
  }

  toggleListening(): void {
    if (this.isListening) {
      this.stopListening();
    } else {
      this.startListening();
    }
  }

  getAvailableCommands(): string[] {
    const allCommands: string[] = [];

    Object.values(this.commandPatterns).forEach(category => {
      category.forEach(pattern => {
        // Extract example commands from regex patterns
        const example = this.generateExampleFromPattern(pattern.pattern, pattern.action);
        if (example) {
          allCommands.push(example);
        }
      });
    });

    return allCommands;
  }

  destroy(): void {
    this.stopListening();
    if (this.recognition) {
      this.recognition.onresult = null;
      this.recognition.onerror = null;
      this.recognition.onend = null;
      this.recognition = null;
    }
    this.removeAllListeners();
  }

  // Private methods

  private initializeSpeechRecognition(): void {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported');
      this.emit('error', 'Speech recognition not supported in this browser');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();

    this.recognition.lang = this.language;
    this.recognition.continuous = true;
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 3;

    this.setupRecognitionHandlers();
  }

  private setupRecognitionHandlers(): void {
    if (!this.recognition) return;

    this.recognition.onresult = (event) => {
      this.handleSpeechResult(event);
    };

    this.recognition.onerror = (event) => {
      this.handleSpeechError(event);
    };

    this.recognition.onend = () => {
      this.handleSpeechEnd();
    };

    this.recognition.onstart = () => {
      console.log('Voice recognition started');
    };
  }

  private handleSpeechResult(event: SpeechRecognitionEvent): void {
    const results = Array.from(event.results);
    const latestResult = results[results.length - 1];

    if (!latestResult.isFinal) return;

    const transcript = latestResult[0].transcript.trim();
    const confidence = latestResult[0].confidence;

    console.log(`Voice input: "${transcript}" (confidence: ${confidence.toFixed(2)})`);

    const command = this.processVoiceCommand(transcript, confidence);
    if (command) {
      this.emit('command', command);
      this.onCommandCallback(command);
    } else {
      this.handleUnrecognizedCommand(transcript);
    }
  }

  private handleSpeechError(event: SpeechRecognitionErrorEvent): void {
    console.error('Speech recognition error:', event.error);

    const errorMessages = {
      'no-speech': 'No speech detected. Please try speaking again.',
      'audio-capture': 'Microphone access denied or not available.',
      'not-allowed': 'Speech recognition permission denied.',
      'network': 'Network error occurred during speech recognition.',
      'service-not-allowed': 'Speech recognition service not allowed.'
    };

    const message = errorMessages[event.error as keyof typeof errorMessages] ||
                   `Speech recognition error: ${event.error}`;

    this.emit('error', message);
  }

  private handleSpeechEnd(): void {
    this.isListening = false;
    this.emit('listening', false);

    // Auto-restart if still enabled (continuous listening)
    if (this.enabled) {
      setTimeout(() => {
        this.startListening();
      }, 1000);
    }
  }

  private processVoiceCommand(transcript: string, confidence: number): VoiceCommand | null {
    // Normalize transcript
    const normalizedTranscript = transcript.toLowerCase().trim();

    // Try to match against command patterns
    for (const [category, patterns] of Object.entries(this.commandPatterns)) {
      for (const patternConfig of patterns) {
        const match = normalizedTranscript.match(patternConfig.pattern);
        if (match) {
          // Calculate final confidence score
          const finalConfidence = Math.min(confidence * patternConfig.confidence, 1.0);

          if (finalConfidence >= 0.6) { // Minimum confidence threshold
            return {
              command: transcript,
              aliases: [normalizedTranscript],
              action: patternConfig.action,
              parameters: match.slice(1).filter(Boolean), // Captured groups
              confidence: finalConfidence,
              language: this.language
            };
          }
        }
      }
    }

    return null;
  }

  private handleUnrecognizedCommand(transcript: string): void {
    console.log(`Unrecognized voice command: "${transcript}"`);

    // Provide helpful suggestions
    const suggestions = this.suggestSimilarCommands(transcript);
    const message = suggestions.length > 0
      ? `Command not recognized. Did you mean: ${suggestions.join(', ')}?`
      : 'Command not recognized. Say "help" for available commands.';

    this.emit('error', message);
  }

  private suggestSimilarCommands(transcript: string): string[] {
    const normalized = transcript.toLowerCase();
    const suggestions: string[] = [];

    // Simple keyword matching for suggestions
    const keywords = {
      'select': ['select node', 'go to node'],
      'zoom': ['zoom in', 'zoom out'],
      'help': ['help', 'what can I say'],
      'describe': ['describe current', 'what am I looking at'],
      'expand': ['expand node', 'show details'],
      'search': ['search for', 'find node']
    };

    for (const [key, commands] of Object.entries(keywords)) {
      if (normalized.includes(key)) {
        suggestions.push(...commands);
      }
    }

    return suggestions.slice(0, 3); // Limit to 3 suggestions
  }

  private generateExampleFromPattern(pattern: RegExp, action: string): string {
    // Generate example commands from regex patterns
    const examples = {
      select: 'Select node name',
      zoom_in: 'Zoom in',
      zoom_out: 'Zoom out',
      center: 'Center view',
      next: 'Next node',
      previous: 'Previous node',
      describe: 'Describe current node',
      connections: 'List connections',
      current_context: 'What am I looking at',
      help: 'Help',
      statistics: 'Show statistics',
      expand: 'Expand node',
      collapse: 'Collapse node',
      highlight_path: 'Highlight path to target',
      search: 'Search for term',
      clear: 'Clear selection',
      start_listening: 'Start listening',
      stop_listening: 'Stop listening',
      repeat: 'Repeat last action'
    };

    return examples[action as keyof typeof examples] || action;
  }
}

// Extend global Window interface for speech recognition
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }

  interface SpeechRecognition extends EventTarget {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    maxAlternatives: number;
    start(): void;
    stop(): void;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
    onend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  }

  interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
  }

  interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message?: string;
  }

  interface SpeechRecognitionResultList {
    length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
  }

  interface SpeechRecognitionResult {
    isFinal: boolean;
    length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
  }

  interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
  }

  const SpeechRecognition: {
    prototype: SpeechRecognition;
    new(): SpeechRecognition;
  };
}
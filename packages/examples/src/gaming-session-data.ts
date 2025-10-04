// Gaming Session Semantic Space-Time Graph Data Generator
import { Node, Edge } from '../../knowledge-network/dist/index.js';

/**
 * Creates a comprehensive gaming session knowledge graph with semantic edge labels
 * This represents a multiplayer online battle arena (MOBA) game session with:
 * - Players with roles and teams
 * - Locations with zone types
 * - Time-based events
 * - Items with tiers and powers
 * - Rich edge metadata including labels, relationships, and temporal data
 */
export function createGamingSessionGraph(): { nodes: Node[], edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  
  // Players (core nodes) - widely spread out
  const players = [
    { id: 'Player1', label: 'Alice (Tank)', team: 'red', role: 'tank' },
    { id: 'Player2', label: 'Bob (Healer)', team: 'red', role: 'healer' },
    { id: 'Player3', label: 'Charlie (DPS)', team: 'blue', role: 'dps' },
    { id: 'Player4', label: 'Diana (Support)', team: 'blue', role: 'support' }
  ];
  
  players.forEach((player, i) => {
    nodes.push({
      id: player.id,
      label: player.label,
      x: 600 + Math.cos(i * Math.PI / 2) * 450,
      y: 350 + Math.sin(i * Math.PI / 2) * 350,
      metadata: { type: 'player', team: player.team, role: player.role }
    });
  });
  
  // Locations - well distributed across the canvas
  const locations = [
    { id: 'spawn_red', label: 'Red Base', x: 100, y: 100, zone: 'safe' },
    { id: 'spawn_blue', label: 'Blue Base', x: 1100, y: 600, zone: 'safe' },
    { id: 'center', label: 'Battlefield Center', x: 600, y: 350, zone: 'contested' },
    { id: 'forest', label: 'Dark Forest', x: 300, y: 350, zone: 'neutral' },
    { id: 'temple', label: 'Ancient Temple', x: 900, y: 350, zone: 'neutral' },
    { id: 'cave', label: 'Crystal Cave', x: 600, y: 100, zone: 'dangerous' },
    { id: 'river', label: 'Mystic River', x: 600, y: 600, zone: 'neutral' }
  ];
  
  locations.forEach(loc => {
    nodes.push({ 
      ...loc, 
      metadata: { type: 'location', zone: loc.zone } 
    });
  });
  
  // Game Events (time-based) - spread horizontally
  const events = [
    { id: 'match_start', label: 'Match Start', x: 50, y: 400, time: '00:00' },
    { id: 'first_blood', label: 'First Blood', x: 250, y: 200, time: '02:30' },
    { id: 'objective_1', label: 'Tower Captured', x: 450, y: 550, time: '05:15' },
    { id: 'team_fight_1', label: 'Team Fight Alpha', x: 600, y: 250, time: '07:45' },
    { id: 'boss_spawn', label: 'Dragon Spawned', x: 750, y: 450, time: '10:00' },
    { id: 'team_fight_2', label: 'Team Fight Beta', x: 950, y: 250, time: '12:30' },
    { id: 'match_end', label: 'Victory', x: 1150, y: 400, time: '15:00' }
  ];
  
  events.forEach(evt => {
    nodes.push({ 
      ...evt, 
      metadata: { type: 'event', time: evt.time } 
    });
  });
  
  // Items/Weapons - corners of the map
  const items = [
    { id: 'sword', label: 'Excalibur', x: 400, y: 50, tier: 'legendary', power: 100 },
    { id: 'shield', label: 'Aegis Shield', x: 800, y: 50, tier: 'epic', power: 75 },
    { id: 'potion', label: 'Greater Healing', x: 400, y: 650, tier: 'rare', power: 50 },
    { id: 'armor', label: 'Dragon Scale', x: 800, y: 650, tier: 'epic', power: 80 },
    { id: 'artifact', label: 'Orb of Power', x: 600, y: 200, tier: 'legendary', power: 120 }
  ];
  
  items.forEach(item => {
    nodes.push({ 
      ...item, 
      metadata: { type: 'item', tier: item.tier, power: item.power } 
    });
  });
  
  // Create complex edge relationships with labels and metadata
  
  // Player spawn connections with timing
  edges.push(
    { 
      source: 'Player1', 
      target: 'spawn_red', 
      label: 'spawns at',
      metadata: { type: 'spawn', time: 0, duration: 1, relationship: 'initial_position' } 
    },
    { 
      source: 'Player2', 
      target: 'spawn_red', 
      label: 'spawns at',
      metadata: { type: 'spawn', time: 0, duration: 1, relationship: 'initial_position' } 
    },
    { 
      source: 'Player3', 
      target: 'spawn_blue', 
      label: 'spawns at',
      metadata: { type: 'spawn', time: 0, duration: 1, relationship: 'initial_position' } 
    },
    { 
      source: 'Player4', 
      target: 'spawn_blue', 
      label: 'spawns at',
      metadata: { type: 'spawn', time: 0, duration: 1, relationship: 'initial_position' } 
    }
  );
  
  // Player movements through locations with detailed paths
  edges.push(
    { 
      source: 'Player1', 
      target: 'forest', 
      label: 'advances to',
      metadata: { type: 'movement', time: 1, speed: 'normal', strategy: 'flanking' } 
    },
    { 
      source: 'Player1', 
      target: 'center', 
      label: 'engages at',
      metadata: { type: 'movement', time: 2, speed: 'charge', strategy: 'aggressive' } 
    },
    { 
      source: 'Player1', 
      target: 'temple', 
      label: 'retreats to',
      metadata: { type: 'movement', time: 3, speed: 'fast', strategy: 'defensive' } 
    },
    { 
      source: 'Player2', 
      target: 'cave', 
      label: 'explores',
      metadata: { type: 'movement', time: 1, speed: 'cautious', strategy: 'scouting' } 
    },
    { 
      source: 'Player2', 
      target: 'center', 
      label: 'supports at',
      metadata: { type: 'movement', time: 2, speed: 'normal', strategy: 'support' } 
    },
    { 
      source: 'Player3', 
      target: 'temple', 
      label: 'rushes to',
      metadata: { type: 'movement', time: 1, speed: 'sprint', strategy: 'aggressive' } 
    },
    { 
      source: 'Player3', 
      target: 'center', 
      label: 'attacks from',
      metadata: { type: 'movement', time: 2, speed: 'normal', strategy: 'flanking' } 
    },
    { 
      source: 'Player3', 
      target: 'forest', 
      label: 'chases through',
      metadata: { type: 'movement', time: 3, speed: 'fast', strategy: 'pursuit' } 
    },
    { 
      source: 'Player4', 
      target: 'river', 
      label: 'scouts',
      metadata: { type: 'movement', time: 1, speed: 'stealth', strategy: 'reconnaissance' } 
    },
    { 
      source: 'Player4', 
      target: 'center', 
      label: 'reinforces',
      metadata: { type: 'movement', time: 2, speed: 'normal', strategy: 'support' } 
    }
  );
  
  // Event participation with outcomes
  edges.push(
    { 
      source: 'match_start', 
      target: 'Player1', 
      label: 'initiates',
      metadata: { type: 'event_participation', outcome: 'ready', intensity: 'high' } 
    },
    { 
      source: 'match_start', 
      target: 'Player2', 
      label: 'initiates',
      metadata: { type: 'event_participation', outcome: 'ready', intensity: 'high' } 
    },
    { 
      source: 'match_start', 
      target: 'Player3', 
      label: 'initiates',
      metadata: { type: 'event_participation', outcome: 'ready', intensity: 'high' } 
    },
    { 
      source: 'match_start', 
      target: 'Player4', 
      label: 'initiates',
      metadata: { type: 'event_participation', outcome: 'ready', intensity: 'high' } 
    },
    { 
      source: 'first_blood', 
      target: 'Player1', 
      label: 'achieves kill',
      metadata: { type: 'kill', damage: 450, weapon: 'sword', critical: true } 
    },
    { 
      source: 'first_blood', 
      target: 'Player3', 
      label: 'eliminated by',
      metadata: { type: 'death', damage_taken: 450, respawn_time: 30 } 
    },
    { 
      source: 'team_fight_1', 
      target: 'Player1', 
      label: 'tanks damage',
      metadata: { type: 'combat', role: 'tank', damage_absorbed: 800 } 
    },
    { 
      source: 'team_fight_1', 
      target: 'Player2', 
      label: 'heals allies',
      metadata: { type: 'combat', role: 'healer', healing_done: 1200 } 
    },
    { 
      source: 'team_fight_1', 
      target: 'Player3', 
      label: 'deals damage',
      metadata: { type: 'combat', role: 'dps', damage_dealt: 1500 } 
    },
    { 
      source: 'team_fight_1', 
      target: 'Player4', 
      label: 'buffs team',
      metadata: { type: 'combat', role: 'support', buffs_applied: 6 } 
    },
    { 
      source: 'boss_spawn', 
      target: 'center', 
      label: 'appears at',
      metadata: { type: 'spawn', boss_type: 'dragon', health: 5000 } 
    },
    { 
      source: 'team_fight_2', 
      target: 'Player2', 
      label: 'critical heal',
      metadata: { type: 'combat', healing: 500, saved_ally: 'Player1' } 
    },
    { 
      source: 'team_fight_2', 
      target: 'Player3', 
      label: 'ultimate ability',
      metadata: { type: 'combat', ability: 'meteor_strike', damage: 2000 } 
    },
    { 
      source: 'team_fight_2', 
      target: 'Player4', 
      label: 'crowd control',
      metadata: { type: 'combat', ability: 'mass_stun', duration: 3 } 
    },
    { 
      source: 'match_end', 
      target: 'Player1', 
      label: 'achieves victory',
      metadata: { type: 'victory', score: 12500, kills: 8, deaths: 2 } 
    },
    { 
      source: 'match_end', 
      target: 'Player2', 
      label: 'achieves victory',
      metadata: { type: 'victory', score: 10000, assists: 15, healing: 25000 } 
    }
  );
  
  // Item pickups with effects
  edges.push(
    { 
      source: 'Player1', 
      target: 'sword', 
      label: 'equips',
      metadata: { type: 'pickup', time: 2.5, stat_boost: '+50 ATK', rarity: 'legendary' } 
    },
    { 
      source: 'Player2', 
      target: 'shield', 
      label: 'acquires',
      metadata: { type: 'pickup', time: 1.5, stat_boost: '+30 DEF', rarity: 'epic' } 
    },
    { 
      source: 'Player3', 
      target: 'potion', 
      label: 'consumes',
      metadata: { type: 'pickup', time: 3, effect: 'restore 500 HP', rarity: 'rare' } 
    },
    { 
      source: 'Player4', 
      target: 'armor', 
      label: 'wears',
      metadata: { type: 'pickup', time: 2, stat_boost: '+40 DEF', rarity: 'epic' } 
    },
    { 
      source: 'Player1', 
      target: 'artifact', 
      label: 'claims power',
      metadata: { type: 'pickup', time: 4, effect: '+100% crit', rarity: 'legendary' } 
    }
  );
  
  // Location connections (pathways)
  edges.push(
    { 
      source: 'spawn_red', 
      target: 'forest', 
      label: 'path to',
      metadata: { type: 'path', distance: 200, terrain: 'wooded', difficulty: 'easy' } 
    },
    { 
      source: 'forest', 
      target: 'center', 
      label: 'route to',
      metadata: { type: 'path', distance: 300, terrain: 'open', difficulty: 'moderate' } 
    },
    { 
      source: 'center', 
      target: 'temple', 
      label: 'corridor to',
      metadata: { type: 'path', distance: 350, terrain: 'stone', difficulty: 'moderate' } 
    },
    { 
      source: 'temple', 
      target: 'spawn_blue', 
      label: 'passage to',
      metadata: { type: 'path', distance: 250, terrain: 'paved', difficulty: 'easy' } 
    },
    { 
      source: 'cave', 
      target: 'center', 
      label: 'tunnel to',
      metadata: { type: 'path', distance: 400, terrain: 'underground', difficulty: 'hard' } 
    },
    { 
      source: 'river', 
      target: 'center', 
      label: 'bridge to',
      metadata: { type: 'path', distance: 350, terrain: 'water', difficulty: 'moderate' } 
    },
    { 
      source: 'spawn_red', 
      target: 'cave', 
      label: 'secret path',
      metadata: { type: 'path', distance: 500, terrain: 'hidden', difficulty: 'hard' } 
    },
    { 
      source: 'spawn_blue', 
      target: 'river', 
      label: 'shortcut to',
      metadata: { type: 'path', distance: 450, terrain: 'swamp', difficulty: 'hard' } 
    }
  );
  
  // Event sequence (temporal flow)
  edges.push(
    { 
      source: 'match_start', 
      target: 'first_blood', 
      label: 'leads to',
      metadata: { type: 'sequence', time_delta: 150, causality: 'direct' } 
    },
    { 
      source: 'first_blood', 
      target: 'objective_1', 
      label: 'triggers',
      metadata: { type: 'sequence', time_delta: 165, causality: 'momentum' } 
    },
    { 
      source: 'objective_1', 
      target: 'team_fight_1', 
      label: 'escalates to',
      metadata: { type: 'sequence', time_delta: 150, causality: 'contest' } 
    },
    { 
      source: 'team_fight_1', 
      target: 'boss_spawn', 
      label: 'activates',
      metadata: { type: 'sequence', time_delta: 135, causality: 'timer' } 
    },
    { 
      source: 'boss_spawn', 
      target: 'team_fight_2', 
      label: 'provokes',
      metadata: { type: 'sequence', time_delta: 150, causality: 'objective' } 
    },
    { 
      source: 'team_fight_2', 
      target: 'match_end', 
      label: 'determines',
      metadata: { type: 'sequence', time_delta: 150, causality: 'decisive' } 
    }
  );
  
  return { nodes, edges };
}

/**
 * Semantic compatibility matrix for edge bundling
 * Defines how different edge types should bundle together based on their semantic relationships
 */
export const edgeCompatibilityMatrix: Record<string, Record<string, number>> = {
  'movement': { 'path': 0.8, 'spawn': 0.6, 'combat': 0.3 },
  'path': { 'movement': 0.8, 'spawn': 0.5, 'sequence': 0.3 },
  'combat': { 'kill': 0.9, 'death': 0.9, 'event_participation': 0.7, 'movement': 0.3 },
  'kill': { 'combat': 0.9, 'death': 0.8, 'victory': 0.6 },
  'death': { 'combat': 0.9, 'kill': 0.8, 'spawn': 0.5 },
  'pickup': { 'movement': 0.5, 'path': 0.4 },
  'sequence': { 'event_participation': 0.6, 'path': 0.3 },
  'event_participation': { 'combat': 0.7, 'sequence': 0.6, 'victory': 0.5 },
  'victory': { 'kill': 0.6, 'event_participation': 0.5 },
  'spawn': { 'movement': 0.6, 'path': 0.5, 'death': 0.5 }
};

/**
 * Get semantic compatibility between two edge types
 */
export function getEdgeCompatibility(type1: string, type2: string): number {
  if (type1 === type2) return 1;
  
  return edgeCompatibilityMatrix[type1]?.[type2] || 
         edgeCompatibilityMatrix[type2]?.[type1] || 
         0.1; // Low default compatibility
}

/**
 * Style configurations for different node and edge types
 */
export const nodeStyles = {
  colors: {
    player: '#ff6b6b',
    location: '#4ecdc4', 
    event: '#ffd93d',
    item: '#6bcf7f'
  },
  sizes: {
    player: 14,
    location: 10,
    event: 8,
    item: 6
  }
};

export const edgeStyles = {
  colors: {
    spawn: '#ff6b6b',
    movement: '#4ecdc4',
    combat: '#ff4444',
    pickup: '#6bcf7f',
    path: '#888',
    sequence: '#dda0dd',
    event_participation: '#ffd93d',
    kill: '#ff0000',
    death: '#666',
    victory: '#ffd700'
  },
  widths: {
    combat: 3, 
    movement: 2, 
    sequence: 1.5,
    kill: 4,
    victory: 3
  }
};
// Semantic Space-Time Gaming Session Knowledge Graph
// Based on semantic space-time graph theory principles
import { Node, Edge } from '../../knowledge-network/dist/index.js';

/**
 * Creates a proper semantic space-time gaming session knowledge graph
 *
 * Semantic Space-Time Graph Principles Applied:
 * 1. Temporal Coherence: Every entity has precise temporal states
 * 2. Spatial Precision: All events have explicit spatial coordinates
 * 3. Semantic Richness: Rich semantic properties enable similarity analysis
 * 4. Relationship Specificity: Precise edge types (causation, succession, transformation)
 * 5. Multi-dimensional Encoding: Time, space, and semantics integrated
 *
 * References:
 * - Yuan, M. (2001). Representing complex geographic phenomena in GIS
 * - Goodchild, M. F. (2013). The quality of big (geo)data
 * - Janowicz, K. et al. (2014). Five stars of linked data vocabulary use
 * - Worboys, M. F. (2005). Event-oriented approaches to geographic phenomena
 */
export function createSemanticSpaceTimeGraph(): { nodes: Node[], edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // SPACE-TIME ENTITIES: Player States at Specific Moments

  // Alice (Tank) - Temporal State Progression
  nodes.push(
    {
      id: 'Alice_T0_Spawn',
      label: 'Alice@T0: Spawn State',
      x: 100, y: 100,
      metadata: {
        type: 'player_state',
        entity: 'Alice',
        role: 'tank',
        team: 'red',
        timestamp: 0,
        spatial_coords: [100, 100],
        location_semantic: 'safe_zone',
        health_state: 1.0,
        mana_state: 1.0,
        tactical_phase: 'initialization',
        semantic_vector: [1, 0, 0, 1, 0] // [tank, healer, dps, red_team, blue_team]
      }
    },
    {
      id: 'Alice_T120_Advance',
      label: 'Alice@T120: Advance to Lane',
      x: 300, y: 200,
      metadata: {
        type: 'player_state',
        entity: 'Alice',
        role: 'tank',
        team: 'red',
        timestamp: 120,
        spatial_coords: [300, 200],
        location_semantic: 'contested_territory',
        health_state: 1.0,
        mana_state: 0.85,
        tactical_phase: 'positioning',
        semantic_vector: [1, 0, 0, 1, 0]
      }
    },
    {
      id: 'Alice_T240_Combat',
      label: 'Alice@T240: Combat Engagement',
      x: 600, y: 350,
      metadata: {
        type: 'player_state',
        entity: 'Alice',
        role: 'tank',
        team: 'red',
        timestamp: 240,
        spatial_coords: [600, 350],
        location_semantic: 'combat_zone',
        health_state: 0.65,
        mana_state: 0.40,
        tactical_phase: 'active_combat',
        semantic_vector: [1, 0, 0, 1, 0]
      }
    }
  );

  // Bob (Healer) - Temporal State Progression
  nodes.push(
    {
      id: 'Bob_T0_Spawn',
      label: 'Bob@T0: Spawn State',
      x: 120, y: 120,
      metadata: {
        type: 'player_state',
        entity: 'Bob',
        role: 'healer',
        team: 'red',
        timestamp: 0,
        spatial_coords: [120, 120],
        location_semantic: 'safe_zone',
        health_state: 1.0,
        mana_state: 1.0,
        tactical_phase: 'initialization',
        semantic_vector: [0, 1, 0, 1, 0]
      }
    },
    {
      id: 'Bob_T180_Support',
      label: 'Bob@T180: Support Position',
      x: 450, y: 300,
      metadata: {
        type: 'player_state',
        entity: 'Bob',
        role: 'healer',
        team: 'red',
        timestamp: 180,
        spatial_coords: [450, 300],
        location_semantic: 'support_zone',
        health_state: 0.90,
        mana_state: 0.60,
        tactical_phase: 'support_positioning',
        semantic_vector: [0, 1, 0, 1, 0]
      }
    },
    {
      id: 'Bob_T250_Heal',
      label: 'Bob@T250: Critical Heal',
      x: 580, y: 330,
      metadata: {
        type: 'player_state',
        entity: 'Bob',
        role: 'healer',
        team: 'red',
        timestamp: 250,
        spatial_coords: [580, 330],
        location_semantic: 'combat_zone',
        health_state: 0.75,
        mana_state: 0.30,
        tactical_phase: 'active_support',
        semantic_vector: [0, 1, 0, 1, 0]
      }
    }
  );

  // Charlie (DPS) - Temporal State Progression
  nodes.push(
    {
      id: 'Charlie_T0_Spawn',
      label: 'Charlie@T0: Spawn State',
      x: 1100, y: 600,
      metadata: {
        type: 'player_state',
        entity: 'Charlie',
        role: 'dps',
        team: 'blue',
        timestamp: 0,
        spatial_coords: [1100, 600],
        location_semantic: 'safe_zone',
        health_state: 1.0,
        mana_state: 1.0,
        tactical_phase: 'initialization',
        semantic_vector: [0, 0, 1, 0, 1]
      }
    },
    {
      id: 'Charlie_T200_Flank',
      label: 'Charlie@T200: Flanking Maneuver',
      x: 800, y: 450,
      metadata: {
        type: 'player_state',
        entity: 'Charlie',
        role: 'dps',
        team: 'blue',
        timestamp: 200,
        spatial_coords: [800, 450],
        location_semantic: 'flanking_position',
        health_state: 1.0,
        mana_state: 0.70,
        tactical_phase: 'tactical_positioning',
        semantic_vector: [0, 0, 1, 0, 1]
      }
    },
    {
      id: 'Charlie_T260_Attack',
      label: 'Charlie@T260: DPS Burst',
      x: 650, y: 370,
      metadata: {
        type: 'player_state',
        entity: 'Charlie',
        role: 'dps',
        team: 'blue',
        timestamp: 260,
        spatial_coords: [650, 370],
        location_semantic: 'combat_zone',
        health_state: 0.40,
        mana_state: 0.20,
        tactical_phase: 'damage_dealing',
        semantic_vector: [0, 0, 1, 0, 1]
      }
    }
  );

  // SPATIAL ENTITIES: Persistent Locations with Semantic Properties
  nodes.push(
    {
      id: 'RedSpawn_Location',
      label: 'Red Team Spawn',
      x: 100, y: 100,
      metadata: {
        type: 'spatial_entity',
        location_type: 'spawn_point',
        team_affinity: 'red',
        safety_level: 1.0,
        strategic_value: 0.3,
        spatial_coords: [100, 100],
        semantic_context: 'safe_territory',
        semantic_vector: [0, 0, 0, 1, 0]
      }
    },
    {
      id: 'CombatZone_Location',
      label: 'Team Fight Arena',
      x: 600, y: 350,
      metadata: {
        type: 'spatial_entity',
        location_type: 'combat_zone',
        team_affinity: 'neutral',
        safety_level: 0.1,
        strategic_value: 1.0,
        spatial_coords: [600, 350],
        semantic_context: 'contested_territory',
        semantic_vector: [0.5, 0.5, 0.5, 0.5, 0.5]
      }
    },
    {
      id: 'BlueSpawn_Location',
      label: 'Blue Team Spawn',
      x: 1100, y: 600,
      metadata: {
        type: 'spatial_entity',
        location_type: 'spawn_point',
        team_affinity: 'blue',
        safety_level: 1.0,
        strategic_value: 0.3,
        spatial_coords: [1100, 600],
        semantic_context: 'safe_territory',
        semantic_vector: [0, 0, 0, 0, 1]
      }
    }
  );

  // TEMPORAL EVENTS: Game State Changes
  nodes.push(
    {
      id: 'FirstBlood_T270',
      label: 'First Blood Event',
      x: 620, y: 340,
      metadata: {
        type: 'temporal_event',
        event_type: 'elimination',
        timestamp: 270,
        spatial_coords: [620, 340],
        semantic_context: 'combat_resolution',
        participants: ['Alice_T240_Combat', 'Charlie_T260_Attack'],
        outcome: 'alice_eliminates_charlie',
        strategic_impact: 0.8,
        semantic_vector: [0.7, 0.1, 0.7, 0.6, 0.4]
      }
    },
    {
      id: 'TeamFight_T240_Start',
      label: 'Team Fight Initiation',
      x: 580, y: 320,
      metadata: {
        type: 'temporal_event',
        event_type: 'team_engagement',
        timestamp: 240,
        spatial_coords: [580, 320],
        semantic_context: 'tactical_coordination',
        participants: ['Alice_T240_Combat', 'Bob_T250_Heal'],
        duration: 45,
        intensity: 0.9,
        semantic_vector: [0.8, 0.8, 0.2, 1.0, 0.2]
      }
    }
  );

  // Add all states to nodes
  nodes.push(...aliceStates);

  // SEMANTIC SPACE-TIME EDGES: Relationships with Multi-dimensional Properties

  // SUCCESSION EDGES: Temporal progression of same entity
  edges.push(
    {
      source: 'Alice_T0_Spawn',
      target: 'Alice_T150_Advance',
      label: 'temporal succession',
      metadata: {
        type: 'temporal_succession',
        time_delta: 150,
        spatial_distance: Math.sqrt((300-100)**2 + (200-100)**2),
        semantic_similarity: 1.0, // Same entity
        causation_strength: 1.0,
        movement_vector: [200, 100],
        semantic_context: 'player_progression'
      }
    },
    {
      source: 'Alice_T150_Advance',
      target: 'Alice_T240_Combat',
      label: 'tactical transition',
      metadata: {
        type: 'temporal_succession',
        time_delta: 90,
        spatial_distance: Math.sqrt((600-300)**2 + (350-200)**2),
        semantic_similarity: 0.7, // Role context change
        causation_strength: 0.9,
        movement_vector: [300, 150],
        semantic_context: 'tactical_shift'
      }
    }
  );

  // SPATIAL ASSOCIATION: Entity-Location relationships
  edges.push(
    {
      source: 'Alice_T0_Spawn',
      target: 'RedSpawn_Location',
      label: 'spatial co-location',
      metadata: {
        type: 'spatial_association',
        time_delta: 0,
        spatial_distance: 0,
        semantic_similarity: 0.8, // Team affinity
        association_strength: 1.0,
        relationship_type: 'occupancy',
        semantic_context: 'spatial_grounding'
      }
    },
    {
      source: 'Alice_T240_Combat',
      target: 'CombatZone_Location',
      label: 'combat positioning',
      metadata: {
        type: 'spatial_association',
        time_delta: 0,
        spatial_distance: 20, // Close proximity
        semantic_similarity: 0.9, // Combat context match
        association_strength: 0.8,
        relationship_type: 'tactical_positioning',
        semantic_context: 'combat_grounding'
      }
    }
  );

  // CAUSAL EDGES: Events causing state changes
  edges.push(
    {
      source: 'TeamFight_T240_Start',
      target: 'Alice_T240_Combat',
      label: 'event causation',
      metadata: {
        type: 'causal_relationship',
        time_delta: 0, // Simultaneous
        spatial_distance: Math.sqrt((600-580)**2 + (350-320)**2),
        semantic_similarity: 0.95, // High semantic match
        causation_strength: 1.0,
        causation_type: 'state_transition_trigger',
        semantic_context: 'event_driven_change'
      }
    },
    {
      source: 'Alice_T240_Combat',
      target: 'FirstBlood_T270',
      label: 'action outcome',
      metadata: {
        type: 'causal_relationship',
        time_delta: 30,
        spatial_distance: Math.sqrt((620-600)**2 + (340-350)**2),
        semantic_similarity: 0.85, // Combat to outcome
        causation_strength: 0.9,
        causation_type: 'action_consequence',
        semantic_context: 'combat_resolution'
      }
    }
  );

  // SEMANTIC SIMILARITY EDGES: Similar contexts across space-time
  edges.push(
    {
      source: 'Alice_T0_Spawn',
      target: 'Bob_T0_Spawn',
      label: 'semantic similarity',
      metadata: {
        type: 'semantic_similarity',
        time_delta: 0,
        spatial_distance: Math.sqrt((120-100)**2 + (120-100)**2),
        semantic_similarity: 0.7, // Same team, same phase
        similarity_basis: 'contextual_alignment',
        shared_properties: ['team', 'tactical_phase', 'timestamp'],
        semantic_context: 'team_coordination'
      }
    },
    {
      source: 'Alice_T240_Combat',
      target: 'Charlie_T260_Attack',
      label: 'combat similarity',
      metadata: {
        type: 'semantic_similarity',
        time_delta: 20,
        spatial_distance: Math.sqrt((650-600)**2 + (370-350)**2),
        semantic_similarity: 0.6, // Both combat, different teams
        similarity_basis: 'activity_type',
        shared_properties: ['tactical_phase'],
        semantic_context: 'combat_engagement'
      }
    }
  );

  return { nodes, edges };
}

/**
 * Enhanced semantic compatibility matrix for space-time relationships
 * Based on multi-dimensional similarity (temporal, spatial, semantic)
 */
export const semanticSpaceTimeCompatibility: Record<string, Record<string, number>> = {
  'temporal_succession': {
    'temporal_succession': 1.0,    // Same entity progressions bundle strongly
    'causal_relationship': 0.7,    // Temporal and causal are related
    'spatial_association': 0.3     // Different relationship types
  },
  'spatial_association': {
    'spatial_association': 1.0,    // Spatial relationships bundle together
    'temporal_succession': 0.3,    // Different relationship types
    'semantic_similarity': 0.5     // Some semantic-spatial correlation
  },
  'causal_relationship': {
    'causal_relationship': 1.0,    // Causal chains bundle together
    'temporal_succession': 0.7,    // Causation often involves succession
    'semantic_similarity': 0.4     // Causal can have semantic components
  },
  'semantic_similarity': {
    'semantic_similarity': 1.0,    // Semantic relationships bundle
    'spatial_association': 0.5,    // Some spatial-semantic correlation
    'causal_relationship': 0.4     // Semantic can influence causal
  }
};

/**
 * Get semantic space-time compatibility between edge types
 */
export function getSemanticSpaceTimeCompatibility(type1: string, type2: string): number {
  if (type1 === type2) return 1.0;

  return semanticSpaceTimeCompatibility[type1]?.[type2] ||
         semanticSpaceTimeCompatibility[type2]?.[type1] ||
         0.1; // Low default compatibility
}

/**
 * Enhanced styling for semantic space-time visualization
 */
export const semanticSpaceTimeStyles = {
  nodeColors: {
    'player_state': '#e74c3c',      // Red for player states
    'spatial_entity': '#3498db',    // Blue for locations
    'temporal_event': '#f39c12',    // Orange for events
  },
  nodeSizes: {
    'player_state': 12,
    'spatial_entity': 10,
    'temporal_event': 8,
  },
  edgeColors: {
    'temporal_succession': '#8e44ad',    // Purple for time progression
    'spatial_association': '#27ae60',    // Green for spatial relationships
    'causal_relationship': '#e74c3c',    // Red for causation
    'semantic_similarity': '#f1c40f',    // Yellow for semantic links
  },
  edgeWidths: {
    'temporal_succession': 3,    // Thick for temporal flow
    'causal_relationship': 4,    // Very thick for causation
    'spatial_association': 2,    // Medium for spatial
    'semantic_similarity': 2,    // Medium for semantic
  }
};
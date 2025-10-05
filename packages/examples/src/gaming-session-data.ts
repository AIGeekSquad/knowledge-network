// World of Warcraft Gaming Session: Semantic Space-Time Graph Data Generator
// Implementing Mark Burgess's Semantic Spacetime model with γ(3,4) representation system
import { Node, Edge } from '../../knowledge-network/dist/index.js';

/**
 * Semantic Spacetime Entity Classification
 * Based on fundamental ontological distinctions from the research
 */
export enum EntityClassification {
  // Fundamental distinction: things that persist vs things that unfold
  CONTINUANT = 'continuant',  // Entities that persist through time while maintaining identity
  OCCURRENT = 'occurrent',    // Temporal entities that unfold through time
}

/**
 * Temporal Entity Categories
 */
export enum TemporalType {
  ATEMPORAL = 'atemporal',  // Information outside temporal constraints
  STATIC = 'static',        // Valid from specific time points, unchanging
  DYNAMIC = 'dynamic',      // Continuously evolving over time
  EPISODIC = 'episodic',    // Facts, opinions, predictions with temporal validity
}

/**
 * Spatial Entity Types
 */
export enum SpatialType {
  POINT = 'point',          // Zero-dimensional, location but no extent
  LINEAR = 'linear',        // One-dimensional, length but negligible width
  AREAL = 'areal',         // Two-dimensional regions
  VOLUMETRIC = 'volumetric', // Three-dimensional extent
}

/**
 * γ(3,4) Association Types - The Four Irreducible Primitives
 */
export enum AssociationType {
  PROXIMITY = 'N',          // ST 0 = 'Near' - similarity, correlation, conceptual closeness
  DIRECTIONALITY = 'L',     // ST 1 = 'Leads to' - ordering, causality, directed influence
  CONTAINMENT = 'C',        // ST 2 = 'Contains' - membership, inclusion, hierarchical organization
  PROPERTY_EXPRESSION = 'E', // ST 3 = 'Expresses' - attributes, characteristics, features
}

/**
 * Promise-Theoretic Agent Properties
 * Each autonomous agent makes voluntary commitments about behavior
 */
interface AgentPromises {
  service_promises: string[];     // Services this agent commits to provide
  behavioral_promises: string[];  // Behaviors this agent commits to maintain
  cooperative_bindings: string[]; // Mutual obligations with other agents
  conflict_resolution: string;    // How this agent handles conflicts
}

/**
 * Semantic Spacetime Node with proper ontological foundation
 */
export interface SemanticSpacetimeNode extends Node {
  id: string;
  label: string;
  x: number;  // Visualization positioning
  y: number;  // Visualization positioning
  metadata: {
    // Fundamental ontological classification
    entity_classification: EntityClassification;
    temporal_type: TemporalType;
    spatial_type: SpatialType;

    // Promise-theoretic agent properties (for autonomous entities)
    agent_promises?: AgentPromises;
    autonomy_level?: number; // 0-1 scale of self-direction capability

    // Spacetime integration properties
    spacetime_region: {
      spatial_extent: {
        coordinates: { x: number; y: number; z: number; zone_id: number };
        bounding_volume?: { width: number; height: number; depth: number };
      };
      temporal_validity: {
        start_time: number;
        end_time?: number;
        duration?: number;
      };
    };

    // Semantic content
    semantic_content: {
      domain: string;           // WoW game mechanics domain
      concept_type: string;     // player, boss, ability, buff, etc.
      properties: Record<string, any>;
      functional_role: string;  // tank, healer, dps, mechanic, etc.
    };

    // Additional WoW-specific properties
    wow_properties?: {
      level?: number;
      item_level?: number;
      class?: string;
      spec?: string;
      health?: number;
      power?: number;
      abilities?: string[];
      cooldowns?: Record<string, number>;
    };
  };
}

/**
 * Semantic Spacetime Edge with γ(3,4) association types
 */
export interface SemanticSpacetimeEdge extends Edge {
  source: string;
  target: string;
  label: string;
  metadata: {
    // Core γ(3,4) association type - one of the four irreducible primitives
    association_type: AssociationType;

    // Promise-theoretic relationship properties
    promise_commitment?: {
      service_type: string;
      reliability: number; // 0-1 scale
      enforcement_mechanism: string;
    };

    // Spacetime relationship properties
    spacetime_binding: {
      temporal_relationship: {
        start_time: number;
        end_time?: number;
        causality_direction?: 'forward' | 'backward' | 'bidirectional';
        sequence_order?: number;
      };
      spatial_relationship: {
        distance?: number;
        relative_position?: string;
        coordinate_transform?: string;
      };
    };

    // Semantic relationship content
    semantic_binding: {
      relationship_domain: string;  // combat, movement, social, etc.
      concept_similarity: number;   // 0-1 scale for bundling
      functional_dependency: string; // how target depends on source
      information_flow: 'unidirectional' | 'bidirectional';
    };

    // WoW-specific interaction data
    wow_interaction?: {
      school?: string;           // magic school
      damage_type?: string;      // physical, magical, etc.
      value?: number;           // damage, healing, threat amount
      critical?: boolean;
      mechanics?: string[];     // boss mechanics involved
      role_requirement?: string; // which role must handle this
    };

    // Legacy type for compatibility
    type?: string;
  };
}

/**
 * Creates a comprehensive WoW Mythic+ dungeon run using semantic spacetime principles
 * Demonstrates all four γ(3,4) association types in a realistic gaming context
 *
 * Scenario: 5-player Mythic+15 Necrotic Wake run (first boss: Blightbone)
 * Timeline: 0-300 seconds (5 minutes through first boss)
 * Demonstrates: Promise theory, agent autonomy, spacetime integration
 */
export function createGamingSessionGraph(): { nodes: SemanticSpacetimeNode[], edges: SemanticSpacetimeEdge[] } {
  const nodes: SemanticSpacetimeNode[] = [];
  const edges: SemanticSpacetimeEdge[] = [];

  // ======================
  // CONTINUANT ENTITIES - Things that persist through time
  // ======================

  // PLAYERS - Autonomous agents with complex promises to the group
  const players: SemanticSpacetimeNode[] = [
    {
      id: 'player_tank_vdh',
      label: 'Illidari (Vengeance DH)',
      x: 150, y: 200,
      metadata: {
        entity_classification: EntityClassification.CONTINUANT,
        temporal_type: TemporalType.DYNAMIC,
        spatial_type: SpatialType.POINT,

        agent_promises: {
          service_promises: ['maintain_threat_on_all_enemies', 'position_mobs_optimally', 'survive_damage_intake'],
          behavioral_promises: ['face_mobs_away_from_group', 'use_mitigation_proactively', 'call_major_cooldowns'],
          cooperative_bindings: ['coordinate_with_healer', 'enable_melee_uptime', 'set_pull_pace'],
          conflict_resolution: 'priority_to_group_survival'
        },
        autonomy_level: 0.95, // High autonomy - makes independent positioning decisions

        spacetime_region: {
          spatial_extent: {
            coordinates: { x: 3150.5, y: -3015.2, z: 94.7, zone_id: 2286 },
            bounding_volume: { width: 5, height: 5, depth: 3 }
          },
          temporal_validity: {
            start_time: 0,
            duration: 300
          }
        },

        semantic_content: {
          domain: 'wow_mythic_plus_combat',
          concept_type: 'player_character',
          properties: { role: 'tank', spec: 'vengeance', covenant: 'kyrian' },
          functional_role: 'damage_mitigation_and_enemy_control'
        },

        wow_properties: {
          level: 70,
          item_level: 440,
          class: 'Demon Hunter',
          spec: 'Vengeance',
          health: 420000,
          power: 120, // Fury
          abilities: ['Fel Devastation', 'Metamorphosis', 'Fiery Brand', 'Sigil of Flame'],
          cooldowns: { 'Metamorphosis': 240, 'Fel Devastation': 60, 'Fiery Brand': 60 }
        }
      }
    },
    {
      id: 'player_healer_rsham',
      label: 'Thrall (Resto Shaman)',
      x: 180, y: 180,
      metadata: {
        entity_classification: EntityClassification.CONTINUANT,
        temporal_type: TemporalType.DYNAMIC,
        spatial_type: SpatialType.POINT,

        agent_promises: {
          service_promises: ['maintain_party_health_above_critical', 'dispel_harmful_effects', 'interrupt_dangerous_casts'],
          behavioral_promises: ['prioritize_tank_survival', 'position_for_los_healing', 'manage_mana_efficiently'],
          cooperative_bindings: ['coordinate_defensive_cooldowns', 'support_interrupt_rotation'],
          conflict_resolution: 'triage_based_on_immediate_danger'
        },
        autonomy_level: 0.92,

        spacetime_region: {
          spatial_extent: {
            coordinates: { x: 3148.2, y: -3013.5, z: 94.7, zone_id: 2286 },
            bounding_volume: { width: 30, height: 30, depth: 5 } // Healing range
          },
          temporal_validity: {
            start_time: 0,
            duration: 300
          }
        },

        semantic_content: {
          domain: 'wow_mythic_plus_support',
          concept_type: 'player_character',
          properties: { role: 'healer', spec: 'restoration', covenant: 'necrolord' },
          functional_role: 'health_maintenance_and_utility'
        },

        wow_properties: {
          level: 70,
          item_level: 437,
          class: 'Shaman',
          spec: 'Restoration',
          health: 380000,
          power: 120000, // Mana
          abilities: ['Spirit Link Totem', 'Healing Tide Totem', 'Wind Shear', 'Tremor Totem'],
          cooldowns: { 'Spirit Link Totem': 180, 'Healing Tide Totem': 180, 'Wind Shear': 12 }
        }
      }
    },
    {
      id: 'player_dps_fire_mage',
      label: 'Khadgar (Fire Mage)',
      x: 120, y: 220,
      metadata: {
        entity_classification: EntityClassification.CONTINUANT,
        temporal_type: TemporalType.DYNAMIC,
        spatial_type: SpatialType.POINT,

        agent_promises: {
          service_promises: ['maximize_sustained_damage', 'interrupt_assigned_casts', 'execute_positioning_mechanics'],
          behavioral_promises: ['optimize_combustion_windows', 'maintain_safe_distance', 'dispel_magic_effects'],
          cooperative_bindings: ['coordinate_interrupt_rotation', 'focus_fire_priority_targets'],
          conflict_resolution: 'dps_optimization_with_safety_priority'
        },
        autonomy_level: 0.87,

        spacetime_region: {
          spatial_extent: {
            coordinates: { x: 3152.1, y: -3016.8, z: 94.7, zone_id: 2286 },
            bounding_volume: { width: 40, height: 40, depth: 5 } // Spell range
          },
          temporal_validity: {
            start_time: 0,
            duration: 300
          }
        },

        semantic_content: {
          domain: 'wow_mythic_plus_damage',
          concept_type: 'player_character',
          properties: { role: 'dps', spec: 'fire', covenant: 'night_fae' },
          functional_role: 'sustained_magical_damage_and_utility'
        },

        wow_properties: {
          level: 70,
          item_level: 441,
          class: 'Mage',
          spec: 'Fire',
          health: 320000,
          power: 100000, // Mana
          abilities: ['Combustion', 'Fire Blast', 'Phoenix Flames', 'Counterspell'],
          cooldowns: { 'Combustion': 120, 'Counterspell': 24, 'Ice Block': 240 }
        }
      }
    }
  ];

  players.forEach(player => nodes.push(player));

  // DUNGEON LOCATIONS - Spatial regions with functional capabilities
  const locations: SemanticSpacetimeNode[] = [
    {
      id: 'nw_blightbone_arena',
      label: 'Blightbone\'s Arena',
      x: 300, y: 250,
      metadata: {
        entity_classification: EntityClassification.CONTINUANT,
        temporal_type: TemporalType.STATIC,
        spatial_type: SpatialType.AREAL,

        spacetime_region: {
          spatial_extent: {
            coordinates: { x: 3210.5, y: -2950.3, z: 96.2, zone_id: 2286 },
            bounding_volume: { width: 50, height: 50, depth: 15 }
          },
          temporal_validity: {
            start_time: 60,
            end_time: 300
          }
        },

        semantic_content: {
          domain: 'wow_dungeon_geography',
          concept_type: 'boss_encounter_arena',
          properties: { boss: 'Blightbone', mechanics: ['frontal_cone', 'gas_clouds', 'add_summons'] },
          functional_role: 'combat_space_with_positioning_requirements'
        }
      }
    }
  ];

  locations.forEach(loc => nodes.push(loc));

  // ======================
  // OCCURRENT ENTITIES - Things that unfold through time
  // ======================

  // ABILITIES - Temporal processes with specific durations
  const abilities: SemanticSpacetimeNode[] = [
    {
      id: 'ability_heaving_retch',
      label: 'Heaving Retch',
      x: 320, y: 280,
      metadata: {
        entity_classification: EntityClassification.OCCURRENT,
        temporal_type: TemporalType.EPISODIC,
        spatial_type: SpatialType.VOLUMETRIC, // Cone-shaped area

        spacetime_region: {
          spatial_extent: {
            coordinates: { x: 3210.5, y: -2935.0, z: 96.2, zone_id: 2286 },
            bounding_volume: { width: 40, height: 8, depth: 5 } // Frontal cone
          },
          temporal_validity: {
            start_time: 75,
            duration: 3
          }
        },

        semantic_content: {
          domain: 'wow_boss_mechanics',
          concept_type: 'frontal_cone_attack',
          properties: { school: 'disease', interruptible: false, avoidable: true },
          functional_role: 'positioning_requirement_generator'
        },

        wow_properties: {
          cast_time: 3000,
          damage: 85000,
          school: 'disease',
          mechanic_type: 'frontal_cone'
        }
      }
    }
  ];

  abilities.forEach(ability => nodes.push(ability));

  // ======================
  // SEMANTIC SPACETIME EDGES - γ(3,4) Association Types
  // ======================

  // PROXIMITY ASSOCIATIONS (N) - Similarity, correlation, conceptual closeness
  edges.push({
    source: 'player_tank_vdh',
    target: 'player_healer_rsham',
    label: 'grouped with',
    metadata: {
      association_type: AssociationType.PROXIMITY,

      spacetime_binding: {
        temporal_relationship: {
          start_time: 0,
          causality_direction: 'bidirectional'
        },
        spatial_relationship: {
          distance: 15,
          relative_position: 'close_proximity_for_coordination'
        }
      },

      semantic_binding: {
        relationship_domain: 'social_coordination',
        concept_similarity: 0.85, // Both responsible for group survival
        functional_dependency: 'mutual_support_and_coordination',
        information_flow: 'bidirectional'
      },

      type: 'group_proximity' // Legacy compatibility
    }
  });

  // DIRECTIONALITY ASSOCIATIONS (L) - Ordering, causality, directed influence
  edges.push({
    source: 'boss_blightbone',
    target: 'ability_heaving_retch',
    label: 'casts ability',
    metadata: {
      association_type: AssociationType.DIRECTIONALITY,

      promise_commitment: {
        service_type: 'execute_scripted_ability',
        reliability: 0.98,
        enforcement_mechanism: 'boss_ai_script'
      },

      spacetime_binding: {
        temporal_relationship: {
          start_time: 75,
          causality_direction: 'forward',
          sequence_order: 1
        },
        spatial_relationship: {
          relative_position: 'boss_facing_direction',
          coordinate_transform: 'frontal_cone_projection'
        }
      },

      semantic_binding: {
        relationship_domain: 'boss_mechanic_execution',
        concept_similarity: 0.95, // Direct causal relationship
        functional_dependency: 'ability_manifestation_from_caster',
        information_flow: 'unidirectional'
      },

      wow_interaction: {
        school: 'disease',
        damage_type: 'magical',
        value: 85000,
        mechanics: ['frontal_cone'],
        role_requirement: 'positioning_awareness'
      },

      type: 'spell_cast' // Legacy compatibility
    }
  });

  // BOSS - Autonomous agent with scripted behaviors
  const boss: SemanticSpacetimeNode = {
    id: 'boss_blightbone',
    label: 'Blightbone',
    x: 320, y: 250,
    metadata: {
      entity_classification: EntityClassification.CONTINUANT,
      temporal_type: TemporalType.DYNAMIC,
      spatial_type: SpatialType.POINT,

      agent_promises: {
        service_promises: ['execute_scripted_mechanics', 'provide_encounter_challenge'],
        behavioral_promises: ['cast_abilities_on_schedule', 'respond_to_threat_changes'],
        cooperative_bindings: [], // Bosses don't cooperate with players
        conflict_resolution: 'eliminate_all_players'
      },
      autonomy_level: 0.75, // Scripted but with some adaptive behavior

      spacetime_region: {
        spatial_extent: {
          coordinates: { x: 3210.5, y: -2950.3, z: 96.2, zone_id: 2286 },
          bounding_volume: { width: 8, height: 8, depth: 4 }
        },
        temporal_validity: {
          start_time: 60,
          end_time: 300
        }
      },

      semantic_content: {
        domain: 'wow_boss_encounter',
        concept_type: 'raid_boss',
        properties: { difficulty: 'mythic_plus_15', health: 4200000 },
        functional_role: 'primary_encounter_challenge'
      },

      wow_properties: {
        level: 72,
        health: 4200000,
        abilities: ['Heaving Retch', 'Fetid Gas', 'Crunch'],
        cooldowns: { 'Heaving Retch': 15, 'Fetid Gas': 25, 'Crunch': 8 }
      }
    }
  };

  nodes.push(boss);

  // CONTAINMENT ASSOCIATIONS (C) - Group membership hierarchy
  edges.push({
    source: 'mythic_plus_party',
    target: 'player_tank_vdh',
    label: 'contains member',
    metadata: {
      association_type: AssociationType.CONTAINMENT,

      spacetime_binding: {
        temporal_relationship: {
          start_time: 0,
          duration: 300
        },
        spatial_relationship: {
          relative_position: 'group_member'
        }
      },

      semantic_binding: {
        relationship_domain: 'group_composition',
        concept_similarity: 1.0, // Perfect containment
        functional_dependency: 'member_within_group_structure',
        information_flow: 'bidirectional'
      },

      type: 'group_membership' // Legacy compatibility
    }
  });

  // PROPERTY EXPRESSION ASSOCIATIONS (E) - Attributes and characteristics
  edges.push({
    source: 'player_tank_vdh',
    target: 'role_tank',
    label: 'fulfills role',
    metadata: {
      association_type: AssociationType.PROPERTY_EXPRESSION,

      spacetime_binding: {
        temporal_relationship: {
          start_time: 0,
          duration: 300
        },
        spatial_relationship: {
          relative_position: 'functional_expression'
        }
      },

      semantic_binding: {
        relationship_domain: 'role_fulfillment',
        concept_similarity: 0.9,
        functional_dependency: 'agent_expresses_functional_capability',
        information_flow: 'unidirectional'
      },

      type: 'role_expression' // Legacy compatibility
    }
  });

  // Add missing nodes for group and role abstractions
  const groupNode: SemanticSpacetimeNode = {
    id: 'mythic_plus_party',
    label: 'Mythic+ Party',
    x: 200, y: 150,
    metadata: {
      entity_classification: EntityClassification.CONTINUANT,
      temporal_type: TemporalType.DYNAMIC,
      spatial_type: SpatialType.AREAL,

      spacetime_region: {
        spatial_extent: {
          coordinates: { x: 3150.0, y: -3015.0, z: 94.7, zone_id: 2286 },
          bounding_volume: { width: 50, height: 50, depth: 10 }
        },
        temporal_validity: {
          start_time: 0,
          duration: 300
        }
      },

      semantic_content: {
        domain: 'wow_group_dynamics',
        concept_type: 'player_party',
        properties: { size: 5, composition: 'tank_healer_3dps' },
        functional_role: 'coordinated_combat_unit'
      }
    }
  };

  const tankRole: SemanticSpacetimeNode = {
    id: 'role_tank',
    label: 'Tank Role',
    x: 100, y: 150,
    metadata: {
      entity_classification: EntityClassification.CONTINUANT,
      temporal_type: TemporalType.ATEMPORAL,
      spatial_type: SpatialType.POINT,

      spacetime_region: {
        spatial_extent: {
          coordinates: { x: 0, y: 0, z: 0, zone_id: 0 }
        },
        temporal_validity: {
          start_time: 0
        }
      },

      semantic_content: {
        domain: 'wow_role_system',
        concept_type: 'functional_role',
        properties: { responsibilities: ['threat_generation', 'damage_mitigation', 'positioning'] },
        functional_role: 'abstract_role_definition'
      }
    }
  };

  nodes.push(groupNode, tankRole);

  return { nodes, edges };
}

/**
 * Edge compatibility function for semantic spacetime associations
 * Uses concept similarity from semantic_binding for bundling decisions
 */
export function getEdgeCompatibility(edge1: SemanticSpacetimeEdge, edge2: SemanticSpacetimeEdge): number {
  const type1 = edge1.metadata.association_type;
  const type2 = edge2.metadata.association_type;

  // Same association type = high compatibility
  if (type1 === type2) {
    const sim1 = edge1.metadata.semantic_binding.concept_similarity;
    const sim2 = edge2.metadata.semantic_binding.concept_similarity;
    return (sim1 + sim2) / 2;
  }

  // Different association types = lower compatibility
  return 0.3;
}

/**
 * Legacy compatibility function using association types
 */
export function getEdgeCompatibility(type1: string, type2: string): number {
  // Map legacy types to association types for compatibility
  const associationMap: Record<string, number> = {
    'group_proximity': 0.9,
    'spell_cast': 0.8,
    'group_membership': 0.7,
    'role_expression': 0.6
  };

  if (type1 === type2) return 1.0;

  const compat1 = associationMap[type1] || 0.5;
  const compat2 = associationMap[type2] || 0.5;

  return Math.min(compat1, compat2);
}

/**
 * Node styling configuration for semantic spacetime entities
 */
export const nodeStyles = {
  colors: {
    player: '#4a90e2',        // Blue for player characters
    boss: '#d0021b',          // Red for bosses
    location: '#7ed321',      // Green for locations
    ability: '#bd10e0',       // Purple for abilities
    role: '#f5a623',          // Orange for abstract roles
    group: '#50e3c2'          // Teal for group entities
  },
  sizes: {
    player: 18,      // Large for player characters
    boss: 22,        // Largest for bosses
    location: 16,    // Medium-large for locations
    ability: 12,     // Medium for abilities
    role: 10,        // Small for abstract concepts
    group: 20        // Large for group entities
  }
};

/**
 * Edge styling configuration for association types
 */
export const edgeStyles = {
  colors: {
    // γ(3,4) Association type colors
    N: '#4a90e2',    // Blue for Proximity
    L: '#d0021b',    // Red for Directionality
    C: '#7ed321',    // Green for Containment
    E: '#bd10e0',    // Purple for Property Expression

    // Legacy compatibility
    group_proximity: '#4a90e2',
    spell_cast: '#d0021b',
    group_membership: '#7ed321',
    role_expression: '#bd10e0'
  },
  widths: {
    // Association type widths
    N: 2.5,    // Proximity
    L: 3.0,    // Directionality
    C: 2.0,    // Containment
    E: 1.5,    // Property Expression

    // Legacy compatibility
    group_proximity: 2.5,
    spell_cast: 3.0,
    group_membership: 2.0,
    role_expression: 1.5
  }
};

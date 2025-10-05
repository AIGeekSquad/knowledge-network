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
 *
 * EXPANDED VERSION:
 * - 20-25 nodes including players, NPCs, abilities, buffs, locations
 * - 30-40 edges creating natural bundling opportunities
 * - Multiple temporal sequences for combat rotations
 * - Spatial movement patterns between encounter areas
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
    },
    {
      id: 'player_dps_sub_rogue',
      label: 'Garona (Sub Rogue)',
      x: 140, y: 240,
      metadata: {
        entity_classification: EntityClassification.CONTINUANT,
        temporal_type: TemporalType.DYNAMIC,
        spatial_type: SpatialType.POINT,

        agent_promises: {
          service_promises: ['burst_priority_targets', 'execute_interrupt_rotation', 'apply_crowd_control'],
          behavioral_promises: ['maintain_melee_uptime', 'coordinate_stuns', 'execute_mechanics_precisely'],
          cooperative_bindings: ['coordinate_interrupt_rotation', 'focus_fire_priority_targets', 'funnel_damage'],
          conflict_resolution: 'priority_target_elimination'
        },
        autonomy_level: 0.89,

        spacetime_region: {
          spatial_extent: {
            coordinates: { x: 3151.3, y: -3014.2, z: 94.7, zone_id: 2286 },
            bounding_volume: { width: 5, height: 5, depth: 3 } // Melee range
          },
          temporal_validity: {
            start_time: 0,
            duration: 300
          }
        },

        semantic_content: {
          domain: 'wow_mythic_plus_damage',
          concept_type: 'player_character',
          properties: { role: 'dps', spec: 'subtlety', covenant: 'venthyr' },
          functional_role: 'burst_damage_and_control'
        },

        wow_properties: {
          level: 70,
          item_level: 439,
          class: 'Rogue',
          spec: 'Subtlety',
          health: 310000,
          power: 100, // Energy
          abilities: ['Shadow Dance', 'Shadow Blades', 'Kick', 'Cheap Shot'],
          cooldowns: { 'Shadow Dance': 60, 'Shadow Blades': 180, 'Kick': 15 }
        }
      }
    },
    {
      id: 'player_dps_bm_hunter',
      label: 'Rexxar (BM Hunter)',
      x: 100, y: 200,
      metadata: {
        entity_classification: EntityClassification.CONTINUANT,
        temporal_type: TemporalType.DYNAMIC,
        spatial_type: SpatialType.POINT,

        agent_promises: {
          service_promises: ['consistent_ranged_damage', 'handle_distant_mechanics', 'pet_tank_adds'],
          behavioral_promises: ['maintain_optimal_range', 'manage_pet_positioning', 'execute_kiting_when_needed'],
          cooperative_bindings: ['coordinate_misdirection', 'provide_bloodlust', 'handle_ranged_interrupts'],
          conflict_resolution: 'maintain_uptime_at_all_costs'
        },
        autonomy_level: 0.85,

        spacetime_region: {
          spatial_extent: {
            coordinates: { x: 3155.7, y: -3018.9, z: 94.7, zone_id: 2286 },
            bounding_volume: { width: 40, height: 40, depth: 5 } // Ranged distance
          },
          temporal_validity: {
            start_time: 0,
            duration: 300
          }
        },

        semantic_content: {
          domain: 'wow_mythic_plus_damage',
          concept_type: 'player_character',
          properties: { role: 'dps', spec: 'beast_mastery', covenant: 'night_fae' },
          functional_role: 'sustained_ranged_damage_and_utility'
        },

        wow_properties: {
          level: 70,
          item_level: 438,
          class: 'Hunter',
          spec: 'Beast Mastery',
          health: 315000,
          power: 100, // Focus
          abilities: ['Bestial Wrath', 'Aspect of the Wild', 'Counter Shot', 'Misdirection'],
          cooldowns: { 'Bestial Wrath': 90, 'Aspect of the Wild': 120, 'Counter Shot': 24 }
        }
      }
    }
  ];

  players.forEach(player => nodes.push(player));

  // DUNGEON LOCATIONS - Spatial regions with functional capabilities
  const locations: SemanticSpacetimeNode[] = [
    {
      id: 'nw_entrance',
      label: 'Necrotic Wake Entrance',
      x: 250, y: 100,
      metadata: {
        entity_classification: EntityClassification.CONTINUANT,
        temporal_type: TemporalType.STATIC,
        spatial_type: SpatialType.AREAL,

        spacetime_region: {
          spatial_extent: {
            coordinates: { x: 3120.0, y: -3040.0, z: 92.0, zone_id: 2286 },
            bounding_volume: { width: 30, height: 30, depth: 10 }
          },
          temporal_validity: {
            start_time: 0,
            end_time: 30
          }
        },

        semantic_content: {
          domain: 'wow_dungeon_geography',
          concept_type: 'dungeon_entrance',
          properties: { dungeon: 'Necrotic Wake', level: 'Mythic+15' },
          functional_role: 'starting_location_and_preparation_area'
        }
      }
    },
    {
      id: 'nw_first_corridor',
      label: 'First Corridor',
      x: 280, y: 150,
      metadata: {
        entity_classification: EntityClassification.CONTINUANT,
        temporal_type: TemporalType.STATIC,
        spatial_type: SpatialType.LINEAR,

        spacetime_region: {
          spatial_extent: {
            coordinates: { x: 3165.0, y: -3000.0, z: 94.0, zone_id: 2286 },
            bounding_volume: { width: 60, height: 10, depth: 8 }
          },
          temporal_validity: {
            start_time: 30,
            end_time: 60
          }
        },

        semantic_content: {
          domain: 'wow_dungeon_geography',
          concept_type: 'dungeon_corridor',
          properties: { trash_packs: 2, patrol_route: true },
          functional_role: 'transition_area_with_trash_mobs'
        }
      }
    },
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
    },
    {
      id: 'nw_safe_spot_1',
      label: 'Safe Spot (Corner)',
      x: 330, y: 270,
      metadata: {
        entity_classification: EntityClassification.CONTINUANT,
        temporal_type: TemporalType.STATIC,
        spatial_type: SpatialType.POINT,

        spacetime_region: {
          spatial_extent: {
            coordinates: { x: 3225.0, y: -2940.0, z: 96.2, zone_id: 2286 },
            bounding_volume: { width: 5, height: 5, depth: 3 }
          },
          temporal_validity: {
            start_time: 60,
            end_time: 300
          }
        },

        semantic_content: {
          domain: 'wow_dungeon_geography',
          concept_type: 'tactical_position',
          properties: { usage: 'avoid_frontal', line_of_sight: true },
          functional_role: 'positioning_reference_point'
        }
      }
    }
  ];

  locations.forEach(loc => nodes.push(loc));

  // NPCs - Enemies and Adds
  const npcs: SemanticSpacetimeNode[] = [
    {
      id: 'trash_patchwerk_soldier_1',
      label: 'Patchwerk Soldier #1',
      x: 260, y: 130,
      metadata: {
        entity_classification: EntityClassification.CONTINUANT,
        temporal_type: TemporalType.DYNAMIC,
        spatial_type: SpatialType.POINT,

        agent_promises: {
          service_promises: ['basic_melee_attacks', 'apply_tank_damage'],
          behavioral_promises: ['follow_aggro_table', 'move_to_target'],
          cooperative_bindings: [],
          conflict_resolution: 'attack_highest_threat'
        },
        autonomy_level: 0.3,

        spacetime_region: {
          spatial_extent: {
            coordinates: { x: 3155.0, y: -3005.0, z: 94.0, zone_id: 2286 },
            bounding_volume: { width: 3, height: 3, depth: 3 }
          },
          temporal_validity: {
            start_time: 35,
            end_time: 55
          }
        },

        semantic_content: {
          domain: 'wow_trash_mobs',
          concept_type: 'elite_trash',
          properties: { pack_id: 1, mob_type: 'melee' },
          functional_role: 'dungeon_progression_obstacle'
        },

        wow_properties: {
          level: 70,
          health: 580000,
          abilities: ['Slam', 'Enrage']
        }
      }
    },
    {
      id: 'trash_patchwerk_soldier_2',
      label: 'Patchwerk Soldier #2',
      x: 265, y: 140,
      metadata: {
        entity_classification: EntityClassification.CONTINUANT,
        temporal_type: TemporalType.DYNAMIC,
        spatial_type: SpatialType.POINT,

        agent_promises: {
          service_promises: ['basic_melee_attacks', 'apply_tank_damage'],
          behavioral_promises: ['follow_aggro_table', 'move_to_target'],
          cooperative_bindings: [],
          conflict_resolution: 'attack_highest_threat'
        },
        autonomy_level: 0.3,

        spacetime_region: {
          spatial_extent: {
            coordinates: { x: 3158.0, y: -3003.0, z: 94.0, zone_id: 2286 },
            bounding_volume: { width: 3, height: 3, depth: 3 }
          },
          temporal_validity: {
            start_time: 35,
            end_time: 55
          }
        },

        semantic_content: {
          domain: 'wow_trash_mobs',
          concept_type: 'elite_trash',
          properties: { pack_id: 1, mob_type: 'melee' },
          functional_role: 'dungeon_progression_obstacle'
        },

        wow_properties: {
          level: 70,
          health: 580000,
          abilities: ['Slam', 'Enrage']
        }
      }
    },
    {
      id: 'trash_blight_bag',
      label: 'Blight Bag',
      x: 270, y: 125,
      metadata: {
        entity_classification: EntityClassification.CONTINUANT,
        temporal_type: TemporalType.DYNAMIC,
        spatial_type: SpatialType.POINT,

        agent_promises: {
          service_promises: ['ranged_poison_attacks', 'apply_dot_effects'],
          behavioral_promises: ['maintain_range', 'cast_on_random_targets'],
          cooperative_bindings: [],
          conflict_resolution: 'prioritize_spell_casting'
        },
        autonomy_level: 0.4,

        spacetime_region: {
          spatial_extent: {
            coordinates: { x: 3160.0, y: -3008.0, z: 94.0, zone_id: 2286 },
            bounding_volume: { width: 3, height: 3, depth: 3 }
          },
          temporal_validity: {
            start_time: 35,
            end_time: 55
          }
        },

        semantic_content: {
          domain: 'wow_trash_mobs',
          concept_type: 'caster_trash',
          properties: { pack_id: 1, mob_type: 'caster', interruptible: true },
          functional_role: 'ranged_threat_requiring_interrupts'
        },

        wow_properties: {
          level: 70,
          health: 420000,
          abilities: ['Debilitating Plague', 'Heaving Retch']
        }
      }
    },
    {
      id: 'add_carrion_worm_1',
      label: 'Carrion Worm #1',
      x: 310, y: 260,
      metadata: {
        entity_classification: EntityClassification.CONTINUANT,
        temporal_type: TemporalType.DYNAMIC,
        spatial_type: SpatialType.POINT,

        agent_promises: {
          service_promises: ['add_phase_damage', 'apply_pressure_to_group'],
          behavioral_promises: ['spawn_during_boss_fight', 'attack_random_players'],
          cooperative_bindings: [],
          conflict_resolution: 'attack_nearest_target'
        },
        autonomy_level: 0.2,

        spacetime_region: {
          spatial_extent: {
            coordinates: { x: 3215.0, y: -2945.0, z: 96.2, zone_id: 2286 },
            bounding_volume: { width: 2, height: 2, depth: 2 }
          },
          temporal_validity: {
            start_time: 120,
            end_time: 140
          }
        },

        semantic_content: {
          domain: 'wow_boss_adds',
          concept_type: 'summoned_add',
          properties: { boss: 'Blightbone', wave: 1 },
          functional_role: 'add_phase_pressure'
        },

        wow_properties: {
          level: 68,
          health: 210000,
          abilities: ['Blood Burst']
        }
      }
    }
  ];

  npcs.forEach(npc => nodes.push(npc));

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
    },
    {
      id: 'ability_fetid_gas',
      label: 'Fetid Gas',
      x: 315, y: 245,
      metadata: {
        entity_classification: EntityClassification.OCCURRENT,
        temporal_type: TemporalType.EPISODIC,
        spatial_type: SpatialType.AREAL,

        spacetime_region: {
          spatial_extent: {
            coordinates: { x: 3208.0, y: -2948.0, z: 96.2, zone_id: 2286 },
            bounding_volume: { width: 8, height: 8, depth: 3 }
          },
          temporal_validity: {
            start_time: 90,
            duration: 10
          }
        },

        semantic_content: {
          domain: 'wow_boss_mechanics',
          concept_type: 'ground_effect',
          properties: { school: 'disease', persistent: true, avoidable: true },
          functional_role: 'area_denial_mechanic'
        },

        wow_properties: {
          damage_per_tick: 12000,
          tick_rate: 1000,
          school: 'disease',
          mechanic_type: 'ground_aoe'
        }
      }
    },
    {
      id: 'ability_combustion',
      label: 'Combustion',
      x: 125, y: 215,
      metadata: {
        entity_classification: EntityClassification.OCCURRENT,
        temporal_type: TemporalType.EPISODIC,
        spatial_type: SpatialType.POINT,

        spacetime_region: {
          spatial_extent: {
            coordinates: { x: 3152.1, y: -3016.8, z: 94.7, zone_id: 2286 },
            bounding_volume: { width: 1, height: 1, depth: 1 }
          },
          temporal_validity: {
            start_time: 80,
            duration: 10
          }
        },

        semantic_content: {
          domain: 'wow_player_abilities',
          concept_type: 'damage_cooldown',
          properties: { class: 'mage', spec: 'fire', buff_type: 'major' },
          functional_role: 'burst_damage_window'
        },

        wow_properties: {
          crit_bonus: 100,
          cast_time_reduction: 30,
          duration: 10000,
          cooldown: 120000
        }
      }
    },
    {
      id: 'ability_spirit_link_totem',
      label: 'Spirit Link Totem',
      x: 185, y: 175,
      metadata: {
        entity_classification: EntityClassification.OCCURRENT,
        temporal_type: TemporalType.EPISODIC,
        spatial_type: SpatialType.AREAL,

        spacetime_region: {
          spatial_extent: {
            coordinates: { x: 3150.0, y: -3015.0, z: 94.7, zone_id: 2286 },
            bounding_volume: { width: 10, height: 10, depth: 5 }
          },
          temporal_validity: {
            start_time: 125,
            duration: 6
          }
        },

        semantic_content: {
          domain: 'wow_player_abilities',
          concept_type: 'raid_cooldown',
          properties: { class: 'shaman', spec: 'restoration', effect: 'health_redistribution' },
          functional_role: 'group_survival_cooldown'
        },

        wow_properties: {
          health_redistribution: true,
          damage_reduction: 10,
          duration: 6000,
          radius: 10
        }
      }
    },
    {
      id: 'ability_metamorphosis',
      label: 'Metamorphosis',
      x: 155, y: 195,
      metadata: {
        entity_classification: EntityClassification.OCCURRENT,
        temporal_type: TemporalType.EPISODIC,
        spatial_type: SpatialType.POINT,

        spacetime_region: {
          spatial_extent: {
            coordinates: { x: 3150.5, y: -3015.2, z: 94.7, zone_id: 2286 },
            bounding_volume: { width: 1, height: 1, depth: 1 }
          },
          temporal_validity: {
            start_time: 118,
            duration: 15
          }
        },

        semantic_content: {
          domain: 'wow_player_abilities',
          concept_type: 'defensive_cooldown',
          properties: { class: 'demon_hunter', spec: 'vengeance', buff_type: 'major' },
          functional_role: 'tank_survival_cooldown'
        },

        wow_properties: {
          health_increase: 50,
          leech: 25,
          duration: 15000,
          cooldown: 240000
        }
      }
    }
  ];

  abilities.forEach(ability => nodes.push(ability));

  // BUFFS AND DEBUFFS - Status effects
  const buffs: SemanticSpacetimeNode[] = [
    {
      id: 'buff_bloodlust',
      label: 'Bloodlust',
      x: 200, y: 120,
      metadata: {
        entity_classification: EntityClassification.OCCURRENT,
        temporal_type: TemporalType.EPISODIC,
        spatial_type: SpatialType.POINT,

        spacetime_region: {
          spatial_extent: {
            coordinates: { x: 0, y: 0, z: 0, zone_id: 0 },
            bounding_volume: { width: 0, height: 0, depth: 0 }
          },
          temporal_validity: {
            start_time: 65,
            duration: 40
          }
        },

        semantic_content: {
          domain: 'wow_buffs',
          concept_type: 'raid_buff',
          properties: { haste_increase: 30, affects: 'entire_raid' },
          functional_role: 'group_damage_amplification'
        }
      }
    },
    {
      id: 'debuff_necrotic',
      label: 'Necrotic Affix',
      x: 155, y: 210,
      metadata: {
        entity_classification: EntityClassification.OCCURRENT,
        temporal_type: TemporalType.EPISODIC,
        spatial_type: SpatialType.POINT,

        spacetime_region: {
          spatial_extent: {
            coordinates: { x: 0, y: 0, z: 0, zone_id: 0 },
            bounding_volume: { width: 0, height: 0, depth: 0 }
          },
          temporal_validity: {
            start_time: 40,
            duration: 20
          }
        },

        semantic_content: {
          domain: 'wow_debuffs',
          concept_type: 'mythic_plus_affix',
          properties: { healing_reduction: 5, stacks: true, max_stacks: 99 },
          functional_role: 'healing_challenge_modifier'
        }
      }
    }
  ];

  buffs.forEach(buff => nodes.push(buff));

  // ======================
  // SEMANTIC SPACETIME EDGES - γ(3,4) Association Types
  // ======================

  // ========================
  // MOVEMENT PATTERNS - Creating bundling opportunities through spatial transitions
  // ========================

  // Players moving from entrance to first corridor (t=0-30)
  const movementEdges: SemanticSpacetimeEdge[] = [
    {
      source: 'player_tank_vdh',
      target: 'nw_first_corridor',
      label: 'moves to',
      metadata: {
        association_type: AssociationType.DIRECTIONALITY,
        spacetime_binding: {
          temporal_relationship: { start_time: 25, duration: 5, causality_direction: 'forward', sequence_order: 1 },
          spatial_relationship: { distance: 45, relative_position: 'leading_position' }
        },
        semantic_binding: {
          relationship_domain: 'movement',
          concept_similarity: 0.95,
          functional_dependency: 'spatial_transition',
          information_flow: 'unidirectional'
        },
        type: 'movement'
      }
    },
    {
      source: 'player_healer_rsham',
      target: 'nw_first_corridor',
      label: 'moves to',
      metadata: {
        association_type: AssociationType.DIRECTIONALITY,
        spacetime_binding: {
          temporal_relationship: { start_time: 26, duration: 5, causality_direction: 'forward', sequence_order: 2 },
          spatial_relationship: { distance: 45, relative_position: 'mid_position' }
        },
        semantic_binding: {
          relationship_domain: 'movement',
          concept_similarity: 0.95,
          functional_dependency: 'spatial_transition',
          information_flow: 'unidirectional'
        },
        type: 'movement'
      }
    },
    {
      source: 'player_dps_fire_mage',
      target: 'nw_first_corridor',
      label: 'moves to',
      metadata: {
        association_type: AssociationType.DIRECTIONALITY,
        spacetime_binding: {
          temporal_relationship: { start_time: 27, duration: 5, causality_direction: 'forward', sequence_order: 3 },
          spatial_relationship: { distance: 45, relative_position: 'ranged_position' }
        },
        semantic_binding: {
          relationship_domain: 'movement',
          concept_similarity: 0.95,
          functional_dependency: 'spatial_transition',
          information_flow: 'unidirectional'
        },
        type: 'movement'
      }
    },
    {
      source: 'player_dps_sub_rogue',
      target: 'nw_first_corridor',
      label: 'moves to',
      metadata: {
        association_type: AssociationType.DIRECTIONALITY,
        spacetime_binding: {
          temporal_relationship: { start_time: 27, duration: 5, causality_direction: 'forward', sequence_order: 3 },
          spatial_relationship: { distance: 45, relative_position: 'melee_position' }
        },
        semantic_binding: {
          relationship_domain: 'movement',
          concept_similarity: 0.95,
          functional_dependency: 'spatial_transition',
          information_flow: 'unidirectional'
        },
        type: 'movement'
      }
    },
    {
      source: 'player_dps_bm_hunter',
      target: 'nw_first_corridor',
      label: 'moves to',
      metadata: {
        association_type: AssociationType.DIRECTIONALITY,
        spacetime_binding: {
          temporal_relationship: { start_time: 28, duration: 5, causality_direction: 'forward', sequence_order: 4 },
          spatial_relationship: { distance: 45, relative_position: 'far_ranged_position' }
        },
        semantic_binding: {
          relationship_domain: 'movement',
          concept_similarity: 0.95,
          functional_dependency: 'spatial_transition',
          information_flow: 'unidirectional'
        },
        type: 'movement'
      }
    }
  ];

  movementEdges.forEach(edge => edges.push(edge));

  // Players moving to boss arena (t=55-60)
  const bossRoomMovement: SemanticSpacetimeEdge[] = [
    {
      source: 'player_tank_vdh',
      target: 'nw_blightbone_arena',
      label: 'moves to',
      metadata: {
        association_type: AssociationType.DIRECTIONALITY,
        spacetime_binding: {
          temporal_relationship: { start_time: 55, duration: 5, causality_direction: 'forward', sequence_order: 1 },
          spatial_relationship: { distance: 50, relative_position: 'tank_position' }
        },
        semantic_binding: {
          relationship_domain: 'movement',
          concept_similarity: 0.95,
          functional_dependency: 'boss_engagement_positioning',
          information_flow: 'unidirectional'
        },
        type: 'movement'
      }
    },
    {
      source: 'player_healer_rsham',
      target: 'nw_blightbone_arena',
      label: 'moves to',
      metadata: {
        association_type: AssociationType.DIRECTIONALITY,
        spacetime_binding: {
          temporal_relationship: { start_time: 56, duration: 5, causality_direction: 'forward', sequence_order: 2 },
          spatial_relationship: { distance: 50, relative_position: 'healer_position' }
        },
        semantic_binding: {
          relationship_domain: 'movement',
          concept_similarity: 0.95,
          functional_dependency: 'boss_engagement_positioning',
          information_flow: 'unidirectional'
        },
        type: 'movement'
      }
    },
    {
      source: 'player_dps_fire_mage',
      target: 'nw_blightbone_arena',
      label: 'moves to',
      metadata: {
        association_type: AssociationType.DIRECTIONALITY,
        spacetime_binding: {
          temporal_relationship: { start_time: 57, duration: 5, causality_direction: 'forward', sequence_order: 3 },
          spatial_relationship: { distance: 50, relative_position: 'ranged_dps_position' }
        },
        semantic_binding: {
          relationship_domain: 'movement',
          concept_similarity: 0.95,
          functional_dependency: 'boss_engagement_positioning',
          information_flow: 'unidirectional'
        },
        type: 'movement'
      }
    }
  ];

  bossRoomMovement.forEach(edge => edges.push(edge));

  // ========================
  // COMBAT SEQUENCES - Multiple damage/heal edges creating natural bundles
  // ========================

  // Trash combat (t=35-55)
  const trashCombat: SemanticSpacetimeEdge[] = [
    {
      source: 'player_tank_vdh',
      target: 'trash_patchwerk_soldier_1',
      label: 'attacks',
      metadata: {
        association_type: AssociationType.DIRECTIONALITY,
        spacetime_binding: {
          temporal_relationship: { start_time: 36, duration: 2, causality_direction: 'forward', sequence_order: 1 },
          spatial_relationship: { distance: 5, relative_position: 'melee_range' }
        },
        semantic_binding: {
          relationship_domain: 'combat',
          concept_similarity: 0.9,
          functional_dependency: 'threat_generation',
          information_flow: 'unidirectional'
        },
        wow_interaction: {
          school: 'physical',
          damage_type: 'melee',
          value: 12000,
          critical: false
        },
        type: 'damage'
      }
    },
    {
      source: 'player_dps_fire_mage',
      target: 'trash_patchwerk_soldier_1',
      label: 'casts Fireball',
      metadata: {
        association_type: AssociationType.DIRECTIONALITY,
        spacetime_binding: {
          temporal_relationship: { start_time: 37, duration: 2, causality_direction: 'forward', sequence_order: 2 },
          spatial_relationship: { distance: 30, relative_position: 'ranged' }
        },
        semantic_binding: {
          relationship_domain: 'combat',
          concept_similarity: 0.9,
          functional_dependency: 'damage_dealing',
          information_flow: 'unidirectional'
        },
        wow_interaction: {
          school: 'fire',
          damage_type: 'magical',
          value: 28000,
          critical: false
        },
        type: 'damage'
      }
    },
    {
      source: 'player_dps_sub_rogue',
      target: 'trash_patchwerk_soldier_1',
      label: 'backstabs',
      metadata: {
        association_type: AssociationType.DIRECTIONALITY,
        spacetime_binding: {
          temporal_relationship: { start_time: 37, duration: 1, causality_direction: 'forward', sequence_order: 2 },
          spatial_relationship: { distance: 5, relative_position: 'behind_target' }
        },
        semantic_binding: {
          relationship_domain: 'combat',
          concept_similarity: 0.9,
          functional_dependency: 'burst_damage',
          information_flow: 'unidirectional'
        },
        wow_interaction: {
          school: 'physical',
          damage_type: 'melee',
          value: 32000,
          critical: true
        },
        type: 'damage'
      }
    },
    {
      source: 'player_dps_bm_hunter',
      target: 'trash_patchwerk_soldier_2',
      label: 'Kill Command',
      metadata: {
        association_type: AssociationType.DIRECTIONALITY,
        spacetime_binding: {
          temporal_relationship: { start_time: 38, duration: 1, causality_direction: 'forward', sequence_order: 3 },
          spatial_relationship: { distance: 25, relative_position: 'ranged' }
        },
        semantic_binding: {
          relationship_domain: 'combat',
          concept_similarity: 0.9,
          functional_dependency: 'sustained_damage',
          information_flow: 'unidirectional'
        },
        wow_interaction: {
          school: 'physical',
          damage_type: 'pet',
          value: 24000,
          critical: false
        },
        type: 'damage'
      }
    },
    {
      source: 'trash_patchwerk_soldier_1',
      target: 'player_tank_vdh',
      label: 'slams',
      metadata: {
        association_type: AssociationType.DIRECTIONALITY,
        spacetime_binding: {
          temporal_relationship: { start_time: 39, duration: 2, causality_direction: 'forward', sequence_order: 4 },
          spatial_relationship: { distance: 5, relative_position: 'melee_range' }
        },
        semantic_binding: {
          relationship_domain: 'combat',
          concept_similarity: 0.85,
          functional_dependency: 'tank_damage',
          information_flow: 'unidirectional'
        },
        wow_interaction: {
          school: 'physical',
          damage_type: 'melee',
          value: 45000,
          critical: false
        },
        type: 'damage'
      }
    },
    {
      source: 'player_healer_rsham',
      target: 'player_tank_vdh',
      label: 'casts Riptide',
      metadata: {
        association_type: AssociationType.DIRECTIONALITY,
        spacetime_binding: {
          temporal_relationship: { start_time: 40, duration: 1, causality_direction: 'forward', sequence_order: 5 },
          spatial_relationship: { distance: 20, relative_position: 'healing_range' }
        },
        semantic_binding: {
          relationship_domain: 'support',
          concept_similarity: 0.92,
          functional_dependency: 'health_restoration',
          information_flow: 'unidirectional'
        },
        wow_interaction: {
          school: 'nature',
          damage_type: 'healing',
          value: 18000,
          critical: false
        },
        type: 'healing'
      }
    }
  ];

  trashCombat.forEach(edge => edges.push(edge));

  // ========================
  // BOSS COMBAT - Complex interaction patterns
  // ========================

  const bossCombat: SemanticSpacetimeEdge[] = [
    {
      source: 'player_tank_vdh',
      target: 'boss_blightbone',
      label: 'maintains threat',
      metadata: {
        association_type: AssociationType.DIRECTIONALITY,
        spacetime_binding: {
          temporal_relationship: { start_time: 65, duration: 235, causality_direction: 'forward' },
          spatial_relationship: { distance: 5, relative_position: 'tank_position' }
        },
        semantic_binding: {
          relationship_domain: 'combat',
          concept_similarity: 0.95,
          functional_dependency: 'threat_maintenance',
          information_flow: 'bidirectional'
        },
        type: 'threat'
      }
    },
    {
      source: 'player_dps_fire_mage',
      target: 'ability_combustion',
      label: 'activates',
      metadata: {
        association_type: AssociationType.DIRECTIONALITY,
        spacetime_binding: {
          temporal_relationship: { start_time: 80, duration: 1, causality_direction: 'forward', sequence_order: 1 },
          spatial_relationship: { distance: 0, relative_position: 'self' }
        },
        semantic_binding: {
          relationship_domain: 'ability_usage',
          concept_similarity: 0.98,
          functional_dependency: 'cooldown_activation',
          information_flow: 'unidirectional'
        },
        type: 'buff_application'
      }
    },
    {
      source: 'ability_combustion',
      target: 'player_dps_fire_mage',
      label: 'empowers',
      metadata: {
        association_type: AssociationType.PROPERTY_EXPRESSION,
        spacetime_binding: {
          temporal_relationship: { start_time: 80, duration: 10, causality_direction: 'forward' },
          spatial_relationship: { distance: 0, relative_position: 'self' }
        },
        semantic_binding: {
          relationship_domain: 'buff_effect',
          concept_similarity: 0.95,
          functional_dependency: 'damage_amplification',
          information_flow: 'unidirectional'
        },
        type: 'buff_active'
      }
    }
  ];

  bossCombat.forEach(edge => edges.push(edge));

  // ========================
  // ABILITY ROTATIONS - Temporal sequences
  // ========================

  const abilityRotations: SemanticSpacetimeEdge[] = [
    {
      source: 'player_dps_fire_mage',
      target: 'boss_blightbone',
      label: 'Pyroblast (Combustion)',
      metadata: {
        association_type: AssociationType.DIRECTIONALITY,
        spacetime_binding: {
          temporal_relationship: { start_time: 81, duration: 2, causality_direction: 'forward', sequence_order: 1 },
          spatial_relationship: { distance: 30, relative_position: 'ranged' }
        },
        semantic_binding: {
          relationship_domain: 'combat',
          concept_similarity: 0.92,
          functional_dependency: 'burst_damage',
          information_flow: 'unidirectional'
        },
        wow_interaction: {
          school: 'fire',
          damage_type: 'magical',
          value: 85000,
          critical: true
        },
        type: 'damage'
      }
    },
    {
      source: 'player_dps_fire_mage',
      target: 'boss_blightbone',
      label: 'Fire Blast',
      metadata: {
        association_type: AssociationType.DIRECTIONALITY,
        spacetime_binding: {
          temporal_relationship: { start_time: 83, duration: 1, causality_direction: 'forward', sequence_order: 2 },
          spatial_relationship: { distance: 30, relative_position: 'ranged' }
        },
        semantic_binding: {
          relationship_domain: 'combat',
          concept_similarity: 0.92,
          functional_dependency: 'instant_damage',
          information_flow: 'unidirectional'
        },
        wow_interaction: {
          school: 'fire',
          damage_type: 'magical',
          value: 35000,
          critical: true
        },
        type: 'damage'
      }
    },
    {
      source: 'player_dps_fire_mage',
      target: 'boss_blightbone',
      label: 'Pyroblast (instant)',
      metadata: {
        association_type: AssociationType.DIRECTIONALITY,
        spacetime_binding: {
          temporal_relationship: { start_time: 84, duration: 1, causality_direction: 'forward', sequence_order: 3 },
          spatial_relationship: { distance: 30, relative_position: 'ranged' }
        },
        semantic_binding: {
          relationship_domain: 'combat',
          concept_similarity: 0.92,
          functional_dependency: 'burst_damage',
          information_flow: 'unidirectional'
        },
        wow_interaction: {
          school: 'fire',
          damage_type: 'magical',
          value: 85000,
          critical: true
        },
        type: 'damage'
      }
    }
  ];

  abilityRotations.forEach(edge => edges.push(edge));

  // ========================
  // PROXIMITY ASSOCIATIONS - Group coordination
  // ========================

  const proximityEdges: SemanticSpacetimeEdge[] = [
    {
      source: 'player_tank_vdh',
      target: 'player_healer_rsham',
      label: 'grouped with',
      metadata: {
        association_type: AssociationType.PROXIMITY,
        spacetime_binding: {
          temporal_relationship: { start_time: 0, causality_direction: 'bidirectional' },
          spatial_relationship: { distance: 15, relative_position: 'close_proximity_for_coordination' }
        },
        semantic_binding: {
          relationship_domain: 'social_coordination',
          concept_similarity: 0.85,
          functional_dependency: 'mutual_support_and_coordination',
          information_flow: 'bidirectional'
        },
        type: 'group_proximity'
      }
    },
    {
      source: 'player_dps_sub_rogue',
      target: 'player_tank_vdh',
      label: 'follows',
      metadata: {
        association_type: AssociationType.PROXIMITY,
        spacetime_binding: {
          temporal_relationship: { start_time: 0, causality_direction: 'forward' },
          spatial_relationship: { distance: 8, relative_position: 'melee_proximity' }
        },
        semantic_binding: {
          relationship_domain: 'positional_coordination',
          concept_similarity: 0.82,
          functional_dependency: 'melee_positioning',
          information_flow: 'unidirectional'
        },
        type: 'group_proximity'
      }
    },
    {
      source: 'player_dps_fire_mage',
      target: 'player_dps_bm_hunter',
      label: 'ranged together',
      metadata: {
        association_type: AssociationType.PROXIMITY,
        spacetime_binding: {
          temporal_relationship: { start_time: 0, causality_direction: 'bidirectional' },
          spatial_relationship: { distance: 10, relative_position: 'ranged_cluster' }
        },
        semantic_binding: {
          relationship_domain: 'ranged_coordination',
          concept_similarity: 0.88,
          functional_dependency: 'shared_positioning',
          information_flow: 'bidirectional'
        },
        type: 'group_proximity'
      }
    }
  ];

  proximityEdges.forEach(edge => edges.push(edge));

  // More boss mechanics edges
  const bossMechanics: SemanticSpacetimeEdge[] = [
    {
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
          temporal_relationship: { start_time: 75, causality_direction: 'forward', sequence_order: 1 },
          spatial_relationship: { relative_position: 'boss_facing_direction', coordinate_transform: 'frontal_cone_projection' }
        },
        semantic_binding: {
          relationship_domain: 'boss_mechanic_execution',
          concept_similarity: 0.95,
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
        type: 'spell_cast'
      }
    },
    {
      source: 'boss_blightbone',
      target: 'ability_fetid_gas',
      label: 'spawns ground effect',
      metadata: {
        association_type: AssociationType.DIRECTIONALITY,
        spacetime_binding: {
          temporal_relationship: { start_time: 90, causality_direction: 'forward', sequence_order: 2 },
          spatial_relationship: { relative_position: 'random_location' }
        },
        semantic_binding: {
          relationship_domain: 'boss_mechanic_execution',
          concept_similarity: 0.93,
          functional_dependency: 'area_denial_creation',
          information_flow: 'unidirectional'
        },
        type: 'spell_cast'
      }
    },
    {
      source: 'ability_heaving_retch',
      target: 'player_tank_vdh',
      label: 'avoided by',
      metadata: {
        association_type: AssociationType.DIRECTIONALITY,
        spacetime_binding: {
          temporal_relationship: { start_time: 76, duration: 2, causality_direction: 'forward' },
          spatial_relationship: { distance: 15, relative_position: 'side_step' }
        },
        semantic_binding: {
          relationship_domain: 'mechanic_avoidance',
          concept_similarity: 0.88,
          functional_dependency: 'positioning_response',
          information_flow: 'unidirectional'
        },
        type: 'avoidance'
      }
    },
    {
      source: 'player_tank_vdh',
      target: 'nw_safe_spot_1',
      label: 'repositions to',
      metadata: {
        association_type: AssociationType.DIRECTIONALITY,
        spacetime_binding: {
          temporal_relationship: { start_time: 74, duration: 1, causality_direction: 'forward' },
          spatial_relationship: { distance: 12, relative_position: 'tactical_movement' }
        },
        semantic_binding: {
          relationship_domain: 'movement',
          concept_similarity: 0.91,
          functional_dependency: 'mechanic_positioning',
          information_flow: 'unidirectional'
        },
        type: 'movement'
      }
    }
  ];

  bossMechanics.forEach(edge => edges.push(edge));

  // Healing rotation edges
  const healingRotation: SemanticSpacetimeEdge[] = [
    {
      source: 'player_healer_rsham',
      target: 'player_tank_vdh',
      label: 'Healing Wave',
      metadata: {
        association_type: AssociationType.DIRECTIONALITY,
        spacetime_binding: {
          temporal_relationship: { start_time: 95, duration: 2, causality_direction: 'forward', sequence_order: 1 },
          spatial_relationship: { distance: 25, relative_position: 'healing_range' }
        },
        semantic_binding: {
          relationship_domain: 'support',
          concept_similarity: 0.93,
          functional_dependency: 'health_restoration',
          information_flow: 'unidirectional'
        },
        wow_interaction: {
          school: 'nature',
          damage_type: 'healing',
          value: 35000,
          critical: false
        },
        type: 'healing'
      }
    },
    {
      source: 'player_healer_rsham',
      target: 'player_dps_sub_rogue',
      label: 'Chain Heal',
      metadata: {
        association_type: AssociationType.DIRECTIONALITY,
        spacetime_binding: {
          temporal_relationship: { start_time: 97, duration: 2, causality_direction: 'forward', sequence_order: 2 },
          spatial_relationship: { distance: 30, relative_position: 'healing_range' }
        },
        semantic_binding: {
          relationship_domain: 'support',
          concept_similarity: 0.91,
          functional_dependency: 'group_healing',
          information_flow: 'unidirectional'
        },
        wow_interaction: {
          school: 'nature',
          damage_type: 'healing',
          value: 25000,
          critical: false
        },
        type: 'healing'
      }
    },
    {
      source: 'player_healer_rsham',
      target: 'ability_spirit_link_totem',
      label: 'deploys',
      metadata: {
        association_type: AssociationType.DIRECTIONALITY,
        spacetime_binding: {
          temporal_relationship: { start_time: 125, duration: 1, causality_direction: 'forward' },
          spatial_relationship: { distance: 0, relative_position: 'self_position' }
        },
        semantic_binding: {
          relationship_domain: 'ability_usage',
          concept_similarity: 0.96,
          functional_dependency: 'raid_cooldown_deployment',
          information_flow: 'unidirectional'
        },
        type: 'buff_application'
      }
    }
  ];

  healingRotation.forEach(edge => edges.push(edge));

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
  const containmentEdges: SemanticSpacetimeEdge[] = [
    {
      source: 'mythic_plus_party',
      target: 'player_tank_vdh',
      label: 'contains member',
      metadata: {
        association_type: AssociationType.CONTAINMENT,
        spacetime_binding: {
          temporal_relationship: { start_time: 0, duration: 300 },
          spatial_relationship: { relative_position: 'group_member' }
        },
        semantic_binding: {
          relationship_domain: 'group_composition',
          concept_similarity: 1.0,
          functional_dependency: 'member_within_group_structure',
          information_flow: 'bidirectional'
        },
        type: 'group_membership'
      }
    },
    {
      source: 'mythic_plus_party',
      target: 'player_healer_rsham',
      label: 'contains member',
      metadata: {
        association_type: AssociationType.CONTAINMENT,
        spacetime_binding: {
          temporal_relationship: { start_time: 0, duration: 300 },
          spatial_relationship: { relative_position: 'group_member' }
        },
        semantic_binding: {
          relationship_domain: 'group_composition',
          concept_similarity: 1.0,
          functional_dependency: 'member_within_group_structure',
          information_flow: 'bidirectional'
        },
        type: 'group_membership'
      }
    },
    {
      source: 'mythic_plus_party',
      target: 'player_dps_fire_mage',
      label: 'contains member',
      metadata: {
        association_type: AssociationType.CONTAINMENT,
        spacetime_binding: {
          temporal_relationship: { start_time: 0, duration: 300 },
          spatial_relationship: { relative_position: 'group_member' }
        },
        semantic_binding: {
          relationship_domain: 'group_composition',
          concept_similarity: 1.0,
          functional_dependency: 'member_within_group_structure',
          information_flow: 'bidirectional'
        },
        type: 'group_membership'
      }
    },
    {
      source: 'mythic_plus_party',
      target: 'player_dps_sub_rogue',
      label: 'contains member',
      metadata: {
        association_type: AssociationType.CONTAINMENT,
        spacetime_binding: {
          temporal_relationship: { start_time: 0, duration: 300 },
          spatial_relationship: { relative_position: 'group_member' }
        },
        semantic_binding: {
          relationship_domain: 'group_composition',
          concept_similarity: 1.0,
          functional_dependency: 'member_within_group_structure',
          information_flow: 'bidirectional'
        },
        type: 'group_membership'
      }
    },
    {
      source: 'mythic_plus_party',
      target: 'player_dps_bm_hunter',
      label: 'contains member',
      metadata: {
        association_type: AssociationType.CONTAINMENT,
        spacetime_binding: {
          temporal_relationship: { start_time: 0, duration: 300 },
          spatial_relationship: { relative_position: 'group_member' }
        },
        semantic_binding: {
          relationship_domain: 'group_composition',
          concept_similarity: 1.0,
          functional_dependency: 'member_within_group_structure',
          information_flow: 'bidirectional'
        },
        type: 'group_membership'
      }
    },
    {
      source: 'nw_blightbone_arena',
      target: 'boss_blightbone',
      label: 'contains',
      metadata: {
        association_type: AssociationType.CONTAINMENT,
        spacetime_binding: {
          temporal_relationship: { start_time: 60, duration: 240 },
          spatial_relationship: { relative_position: 'within_bounds' }
        },
        semantic_binding: {
          relationship_domain: 'spatial_containment',
          concept_similarity: 0.98,
          functional_dependency: 'location_contains_entity',
          information_flow: 'unidirectional'
        },
        type: 'spatial_containment'
      }
    }
  ];

  containmentEdges.forEach(edge => edges.push(edge));

  // PROPERTY EXPRESSION ASSOCIATIONS (E) - Attributes and characteristics
  const propertyEdges: SemanticSpacetimeEdge[] = [
    {
      source: 'player_tank_vdh',
      target: 'role_tank',
      label: 'fulfills role',
      metadata: {
        association_type: AssociationType.PROPERTY_EXPRESSION,
        spacetime_binding: {
          temporal_relationship: { start_time: 0, duration: 300 },
          spatial_relationship: { relative_position: 'functional_expression' }
        },
        semantic_binding: {
          relationship_domain: 'role_fulfillment',
          concept_similarity: 0.9,
          functional_dependency: 'agent_expresses_functional_capability',
          information_flow: 'unidirectional'
        },
        type: 'role_expression'
      }
    },
    {
      source: 'player_healer_rsham',
      target: 'role_healer',
      label: 'fulfills role',
      metadata: {
        association_type: AssociationType.PROPERTY_EXPRESSION,
        spacetime_binding: {
          temporal_relationship: { start_time: 0, duration: 300 },
          spatial_relationship: { relative_position: 'functional_expression' }
        },
        semantic_binding: {
          relationship_domain: 'role_fulfillment',
          concept_similarity: 0.9,
          functional_dependency: 'agent_expresses_functional_capability',
          information_flow: 'unidirectional'
        },
        type: 'role_expression'
      }
    },
    {
      source: 'player_dps_fire_mage',
      target: 'role_dps',
      label: 'fulfills role',
      metadata: {
        association_type: AssociationType.PROPERTY_EXPRESSION,
        spacetime_binding: {
          temporal_relationship: { start_time: 0, duration: 300 },
          spatial_relationship: { relative_position: 'functional_expression' }
        },
        semantic_binding: {
          relationship_domain: 'role_fulfillment',
          concept_similarity: 0.9,
          functional_dependency: 'agent_expresses_functional_capability',
          information_flow: 'unidirectional'
        },
        type: 'role_expression'
      }
    },
    {
      source: 'buff_bloodlust',
      target: 'mythic_plus_party',
      label: 'affects',
      metadata: {
        association_type: AssociationType.PROPERTY_EXPRESSION,
        spacetime_binding: {
          temporal_relationship: { start_time: 65, duration: 40 },
          spatial_relationship: { relative_position: 'group_wide_effect' }
        },
        semantic_binding: {
          relationship_domain: 'buff_application',
          concept_similarity: 0.94,
          functional_dependency: 'temporary_property_modification',
          information_flow: 'unidirectional'
        },
        type: 'buff_active'
      }
    },
    {
      source: 'debuff_necrotic',
      target: 'player_tank_vdh',
      label: 'afflicts',
      metadata: {
        association_type: AssociationType.PROPERTY_EXPRESSION,
        spacetime_binding: {
          temporal_relationship: { start_time: 40, duration: 20 },
          spatial_relationship: { relative_position: 'self' }
        },
        semantic_binding: {
          relationship_domain: 'debuff_application',
          concept_similarity: 0.87,
          functional_dependency: 'negative_property_modification',
          information_flow: 'unidirectional'
        },
        type: 'debuff_active'
      }
    },
    {
      source: 'player_tank_vdh',
      target: 'ability_metamorphosis',
      label: 'activates cooldown',
      metadata: {
        association_type: AssociationType.PROPERTY_EXPRESSION,
        spacetime_binding: {
          temporal_relationship: { start_time: 118, duration: 15 },
          spatial_relationship: { relative_position: 'self' }
        },
        semantic_binding: {
          relationship_domain: 'ability_expression',
          concept_similarity: 0.96,
          functional_dependency: 'defensive_capability_expression',
          information_flow: 'unidirectional'
        },
        type: 'buff_application'
      }
    }
  ];

  propertyEdges.forEach(edge => edges.push(edge));

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

  const healerRole: SemanticSpacetimeNode = {
    id: 'role_healer',
    label: 'Healer Role',
    x: 100, y: 170,
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
        properties: { responsibilities: ['health_maintenance', 'dispelling', 'damage_mitigation'] },
        functional_role: 'abstract_role_definition'
      }
    }
  };

  const dpsRole: SemanticSpacetimeNode = {
    id: 'role_dps',
    label: 'DPS Role',
    x: 100, y: 190,
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
        properties: { responsibilities: ['damage_dealing', 'interrupting', 'mechanic_handling'] },
        functional_role: 'abstract_role_definition'
      }
    }
  };

  nodes.push(groupNode, tankRole, healerRole, dpsRole);

  return { nodes, edges };
}

/**
 * Edge compatibility function - supports both semantic spacetime edges and legacy string types
 * Uses concept similarity from semantic_binding for bundling decisions
 */
export function getEdgeCompatibility(
  arg1: SemanticSpacetimeEdge | string,
  arg2: SemanticSpacetimeEdge | string
): number {
  // If both are edges, use semantic binding similarity
  if (typeof arg1 === 'object' && typeof arg2 === 'object') {
    const edge1 = arg1 as SemanticSpacetimeEdge;
    const edge2 = arg2 as SemanticSpacetimeEdge;
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

  // Legacy string-based compatibility
  if (typeof arg1 === 'string' && typeof arg2 === 'string') {
    const type1 = arg1;
    const type2 = arg2;

    // Map legacy types to association types for compatibility
    const associationMap: Record<string, number> = {
      'group_proximity': 0.9,
      'spell_cast': 0.8,
      'group_membership': 0.7,
      'role_expression': 0.6,
      'movement': 0.85,
      'damage': 0.9,
      'healing': 0.88,
      'buff_application': 0.75,
      'buff_active': 0.73,
      'threat': 0.82,
      'spatial_containment': 0.7,
      'avoidance': 0.65,
      'debuff_active': 0.68
    };

    if (type1 === type2) return 1.0;

    const compat1 = associationMap[type1] || 0.5;
    const compat2 = associationMap[type2] || 0.5;

    return Math.min(compat1, compat2);
  }

  // Mixed types - return low compatibility
  return 0.2;
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

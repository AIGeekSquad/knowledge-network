// World of Warcraft Gaming Session: Semantic Space-Time Graph Data Generator
// Mythic+ Necrotic Wake dungeon run with comprehensive game mechanics and edge bundling
import { Node, Edge } from '../../knowledge-network/dist/index.js';

/**
 * Enhanced node interface for World of Warcraft entities with agent-like properties
 * Based on semantic space-time theory: every entity has autonomy, goals, and behaviors
 */
export interface WoWNode extends Node {
  id: string;
  label: string;
  x: number;
  y: number;
  metadata: {
    type: 'player' | 'boss' | 'mob' | 'location' | 'ability' | 'buff' | 'debuff' | 'mechanic' | 'phase';

    // Agent properties (for entities with autonomy)
    autonomy_level?: number; // 0-1 scale of self-direction
    goals?: string[]; // Current objectives
    decision_patterns?: string[]; // Behavioral patterns
    resource_pools?: Record<string, number>; // Health, mana, energy, etc.

    // Spatial properties
    zone?: string;
    subzone?: string;
    coordinates?: {
      x: number;
      y: number;
      z: number;
      zone_id: number;
    };

    // Temporal properties
    spawn_time?: number;
    despawn_time?: number;
    phase_active?: number[];

    // Combat properties
    level?: number;
    health?: number;
    max_health?: number;
    power_type?: string;
    power_value?: number;
    threat_table?: Record<string, number>;

    // Additional metadata
    [key: string]: any;
  };
}

/**
 * Enhanced edge interface with comprehensive metadata for edge bundling
 */
export interface WoWEdge extends Edge {
  source: string;
  target: string;
  label: string;
  metadata: {
    type: EdgeType;
    timestamp: number; // Seconds since encounter start
    duration?: number; // For channeled or periodic effects

    // Semantic categories for bundling
    semantic_category: SemanticCategory;
    phase?: number; // Combat phase (1-3 for most bosses)
    role_category?: 'tank' | 'healer' | 'dps' | 'utility';

    // Spatial context
    distance?: number;
    position_requirement?: string; // "spread", "stack", "behind_boss", etc.

    // Combat metrics
    value?: number; // Damage, healing, threat, etc.
    critical?: boolean;
    blocked?: boolean;
    absorbed?: number;
    overkill?: number;

    // Additional metadata
    [key: string]: any;
  };
}

/**
 * Comprehensive edge types for WoW interactions
 */
export enum EdgeType {
  // Movement and Positioning
  MOVEMENT = 'movement',
  TELEPORT = 'teleport',
  KNOCKBACK = 'knockback',
  PULL = 'pull',
  CHARGE = 'charge',

  // Combat Actions
  MELEE_ATTACK = 'melee_attack',
  RANGED_ATTACK = 'ranged_attack',
  SPELL_CAST = 'spell_cast',
  CHANNEL = 'channel',
  INTERRUPT = 'interrupt',
  DISPEL = 'dispel',

  // Healing and Support
  DIRECT_HEAL = 'direct_heal',
  HOT = 'hot', // Heal over time
  ABSORB_SHIELD = 'absorb_shield',
  BUFF_APPLICATION = 'buff_application',
  BUFF_REMOVAL = 'buff_removal',

  // Debuffs and Control
  DEBUFF_APPLICATION = 'debuff_application',
  DEBUFF_REMOVAL = 'debuff_removal',
  STUN = 'stun',
  ROOT = 'root',
  SILENCE = 'silence',
  FEAR = 'fear',

  // Threat and Aggro
  THREAT_GENERATION = 'threat_generation',
  THREAT_DROP = 'threat_drop',
  TAUNT = 'taunt',
  AGGRO_CHANGE = 'aggro_change',

  // Boss Mechanics
  BOSS_PHASE = 'boss_phase',
  MECHANIC_START = 'mechanic_start',
  MECHANIC_RESOLVE = 'mechanic_resolve',
  ENRAGE = 'enrage',

  // Resource Management
  RESOURCE_GAIN = 'resource_gain',
  RESOURCE_SPEND = 'resource_spend',
  COOLDOWN_USE = 'cooldown_use',
  COOLDOWN_READY = 'cooldown_ready',

  // Social and Coordination
  READY_CHECK = 'ready_check',
  MARKER_ASSIGN = 'marker_assign',
  VOICE_CALL = 'voice_call',
  STRATEGY_ADJUST = 'strategy_adjust'
}

/**
 * Semantic categories for edge bundling
 */
export enum SemanticCategory {
  COMBAT_DAMAGE = 'combat_damage',
  COMBAT_HEALING = 'combat_healing',
  COMBAT_MITIGATION = 'combat_mitigation',
  POSITIONING = 'positioning',
  RESOURCE_MANAGEMENT = 'resource_management',
  CROWD_CONTROL = 'crowd_control',
  BUFF_MANAGEMENT = 'buff_management',
  THREAT_MANAGEMENT = 'threat_management',
  MECHANIC_HANDLING = 'mechanic_handling',
  COORDINATION = 'coordination'
}

/**
 * Creates a comprehensive Mythic+ Necrotic Wake dungeon run knowledge graph
 * Simulates a 12-minute run with 5 players through the dungeon
 *
 * Based on semantic space-time graph theory principles:
 * - Temporal coherence: 720-second timeline with precise event sequences
 * - Spatial precision: Exact dungeon coordinates and positioning requirements
 * - Agent autonomy: Each entity has goals, resources, and decision patterns
 * - Rich associations: Four types per semantic theory (spatial, temporal, causal, semantic)
 * - Edge bundling optimization: Semantic categories enable natural grouping
 */
export function createGamingSessionGraph(): { nodes: WoWNode[], edges: WoWEdge[] } {
  const nodes: WoWNode[] = [];
  const edges: WoWEdge[] = [];

  // PLAYER CHARACTERS - Mythic+ Team Composition for Necrotic Wake
  const players: WoWNode[] = [
    {
      id: 'tank_vdh',
      label: 'Illidari (Vengeance DH)',
      x: 100, y: 200,
      metadata: {
        type: 'player',
        autonomy_level: 0.95,
        goals: ['maintain_aggro', 'position_mobs', 'mitigate_damage', 'set_pace'],
        decision_patterns: ['kite_on_necrotic', 'face_away_frontal', 'use_cooldowns_proactively'],
        resource_pools: { health: 420000, max_health: 420000, fury: 120, soul_fragments: 0 },
        zone: 'The Necrotic Wake',
        subzone: 'Entrance',
        coordinates: { x: 3150.5, y: -3015.2, z: 94.7, zone_id: 2286 },
        level: 70,
        spec: 'Vengeance',
        item_level: 440,
        key_abilities: ['Fel Devastation', 'Metamorphosis', 'Fiery Brand', 'Sigil of Flame'],
        covenant: 'Kyrian',
        role: 'tank'
      }
    },
    {
      id: 'healer_rsham',
      label: 'Thrall (Resto Shaman)',
      x: 120, y: 180,
      metadata: {
        type: 'player',
        autonomy_level: 0.9,
        goals: ['keep_party_alive', 'dispel_debuffs', 'manage_cooldowns', 'interrupt_casts'],
        decision_patterns: ['predictive_healing', 'cooldown_rotation', 'triage_priority'],
        resource_pools: { health: 380000, max_health: 380000, mana: 120000, max_mana: 120000 },
        zone: 'The Necrotic Wake',
        subzone: 'Entrance',
        coordinates: { x: 3148.2, y: -3013.5, z: 94.7, zone_id: 2286 },
        level: 70,
        spec: 'Restoration',
        item_level: 437,
        key_abilities: ['Spirit Link Totem', 'Healing Tide Totem', 'Riptide', 'Wind Shear'],
        covenant: 'Necrolord',
        role: 'healer'
      }
    },
    {
      id: 'dps_fire_mage',
      label: 'Khadgar (Fire Mage)',
      x: 140, y: 220,
      metadata: {
        type: 'player',
        autonomy_level: 0.85,
        goals: ['maximize_damage', 'interrupt_priority_casts', 'execute_mechanics', 'decurse'],
        decision_patterns: ['combustion_windows', 'movement_optimization', 'target_priority'],
        resource_pools: { health: 320000, max_health: 320000, mana: 100000, max_mana: 100000 },
        zone: 'The Necrotic Wake',
        subzone: 'Entrance',
        coordinates: { x: 3152.1, y: -3016.8, z: 94.7, zone_id: 2286 },
        level: 70,
        spec: 'Fire',
        item_level: 441,
        key_abilities: ['Combustion', 'Fire Blast', 'Phoenix Flames', 'Counterspell'],
        covenant: 'Night Fae',
        role: 'dps'
      }
    },
    {
      id: 'dps_havoc_dh',
      label: 'Kayn (Havoc DH)',
      x: 80, y: 240,
      metadata: {
        type: 'player',
        autonomy_level: 0.85,
        goals: ['maximize_aoe_damage', 'priority_interrupt', 'execute_mechanics', 'consume_magic'],
        decision_patterns: ['eye_beam_timing', 'meta_windows', 'mobility_usage'],
        resource_pools: { health: 340000, max_health: 340000, fury: 120, max_fury: 120 },
        zone: 'The Necrotic Wake',
        subzone: 'Entrance',
        coordinates: { x: 3149.8, y: -3017.3, z: 94.7, zone_id: 2286 },
        level: 70,
        spec: 'Havoc',
        item_level: 439,
        key_abilities: ['Eye Beam', 'Blade Dance', 'Metamorphosis', 'Disrupt'],
        covenant: 'Venthyr',
        role: 'dps'
      }
    },
    {
      id: 'dps_sub_rogue',
      label: 'Garona (Sub Rogue)',
      x: 160, y: 200,
      metadata: {
        type: 'player',
        autonomy_level: 0.88,
        goals: ['priority_damage', 'kick_rotation', 'execute_mechanics', 'apply_shroud'],
        decision_patterns: ['shadow_dance_windows', 'symbols_timing', 'energy_pooling'],
        resource_pools: { health: 330000, max_health: 330000, energy: 100, max_energy: 100, combo: 0 },
        zone: 'The Necrotic Wake',
        subzone: 'Entrance',
        coordinates: { x: 3151.3, y: -3014.1, z: 94.7, zone_id: 2286 },
        level: 70,
        spec: 'Subtlety',
        item_level: 438,
        key_abilities: ['Shadow Dance', 'Symbols of Death', 'Shadow Blades', 'Kick'],
        covenant: 'Kyrian',
        role: 'dps'
      }
    }
  ];

  players.forEach(player => nodes.push(player));

  // NECROTIC WAKE DUNGEON LOCATIONS - Shadowlands Mythic+ Dungeon
  const dungeonLocations: WoWNode[] = [
    {
      id: 'nw_entrance',
      label: 'Necrotic Wake Entrance',
      x: 100, y: 100,
      metadata: {
        type: 'location',
        zone: 'The Necrotic Wake',
        subzone: 'Zolramus Vestibule',
        coordinates: { x: 3150.0, y: -3015.0, z: 94.7, zone_id: 2286 },
        affixes: ['Fortified', 'Sanguine', 'Necrotic'],
        keystone_level: 15,
        timer: 2160 // 36 minutes
      }
    },
    {
      id: 'nw_stitchflesh_arena',
      label: 'Stitchflesh\'s Workshop',
      x: 200, y: 150,
      metadata: {
        type: 'location',
        zone: 'The Necrotic Wake',
        subzone: 'The Stitchworks',
        coordinates: { x: 3210.5, y: -2950.3, z: 96.2, zone_id: 2286 },
        boss_encounter: true,
        boss_name: 'Blightbone',
        mechanic_zones: ['Heaving_Retch_Area', 'Fetid_Gas_Cloud']
      }
    },
    {
      id: 'nw_abomination_wing',
      label: 'Abomination Wing',
      x: 300, y: 200,
      metadata: {
        type: 'location',
        zone: 'The Necrotic Wake',
        subzone: 'Stitchflesh Laboratory',
        coordinates: { x: 3280.2, y: -2890.7, z: 98.5, zone_id: 2286 },
        boss_encounter: true,
        boss_name: 'Amarth',
        mechanic_zones: ['Necrotic_Bolt_Landing', 'Add_Spawn_Points']
      }
    },
    {
      id: 'nw_surgeon_hall',
      label: 'Surgeon\'s Hall',
      x: 400, y: 250,
      metadata: {
        type: 'location',
        zone: 'The Necrotic Wake',
        subzone: 'Hall of Reconstruction',
        coordinates: { x: 3350.8, y: -2820.4, z: 101.3, zone_id: 2286 },
        boss_encounter: true,
        boss_name: 'Surgeon Stitchflesh',
        mechanic_zones: ['Hook_Platforms', 'Meat_Hook_Path']
      }
    },
    {
      id: 'nw_nalthor_platform',
      label: 'Nalthor\'s Sanctum',
      x: 500, y: 300,
      metadata: {
        type: 'location',
        zone: 'The Necrotic Wake',
        subzone: 'The Golden Repose',
        coordinates: { x: 3420.3, y: -2750.1, z: 105.8, zone_id: 2286 },
        boss_encounter: true,
        boss_name: 'Nalthor the Rimebinder',
        mechanic_zones: ['Comet_Storm_Areas', 'Ice_Shard_Zones', 'Frozen_Binds_Positions']
      }
    }
  ];

  dungeonLocations.forEach(loc => nodes.push(loc));

  // NECROTIC WAKE BOSSES AND KEY MOBS
  const npcs: WoWNode[] = [
    {
      id: 'boss_blightbone',
      label: 'Blightbone',
      x: 200, y: 150,
      metadata: {
        type: 'boss',
        autonomy_level: 0.8,
        goals: ['eliminate_party', 'execute_mechanics'],
        decision_patterns: ['heaving_retch_cone', 'fetid_gas_placement', 'crunch_target'],
        resource_pools: { health: 4200000, max_health: 4200000 },
        zone: 'The Necrotic Wake',
        coordinates: { x: 3210.5, y: -2950.3, z: 96.2, zone_id: 2286 },
        level: 72,
        abilities: ['Heaving Retch', 'Fetid Gas', 'Crunch', 'Carrion Worms'],
        mechanics: ['frontal_cone', 'gas_clouds', 'tank_buster', 'add_summon']
      }
    },
    {
      id: 'Mr_Smite',
      label: 'Mr. Smite',
      x: 500, y: 220,
      metadata: {
        type: 'boss',
        level: 20,
        health: 2321,
        faction: 'Defias Brotherhood',
        abilities: ['Smite Slam', 'Hammer Throw', 'Weapon Swap'],
        loot_table: ['Smite\'s Mighty Hammer', 'Thief\'s Blade'],
        dungeon: 'Deadmines',
        elite: true
      }
    },
    {
      id: 'Captain_Greenskin',
      label: 'Captain Greenskin',
      x: 450, y: 180,
      metadata: {
        type: 'boss',
        level: 18,
        health: 1979,
        faction: 'Defias Brotherhood',
        abilities: ['Cleave', 'Intimidating Shout'],
        loot_table: ['Blackened Defias Gloves', 'Corsair\'s Overshirt'],
        dungeon: 'Deadmines',
        elite: true
      }
    },
    {
      id: 'Defias_Strip_Miner',
      label: 'Defias Strip Miner',
      x: 200, y: 120,
      metadata: {
        type: 'mob',
        level: 16,
        health: 986,
        faction: 'Defias Brotherhood',
        abilities: ['Pierce Armor'],
        respawn_time: 300,
        patrol_path: ['DM_Mine_Tunnels', 'DM_Entrance']
      }
    }
  ];

  npcs.forEach(npc => nodes.push(npc));

  // ABILITIES AND COMBAT ACTIONS - Real WoW Spells
  const abilities = [
    {
      id: 'Death_Coil',
      label: 'Death Coil',
      x: 300, y: 350,
      metadata: {
        type: 'ability',
        class: 'Death Knight',
        school: 'Shadow',
        cast_time: 0,
        cooldown: 0,
        runic_power_cost: 40,
        damage: '1821 - 2179',
        effect: 'Heals friendly undead or damages enemy'
      }
    },
    {
      id: 'Flash_of_Light',
      label: 'Flash of Light',
      x: 350, y: 400,
      metadata: {
        type: 'ability',
        class: 'Paladin',
        school: 'Holy',
        cast_time: 1.5,
        cooldown: 0,
        mana_cost: 815,
        healing: '3423 - 3822',
        effect: 'Quick heal spell'
      }
    },
    {
      id: 'Fireball',
      label: 'Fireball',
      x: 400, y: 450,
      metadata: {
        type: 'ability',
        class: 'Mage',
        school: 'Fire',
        cast_time: 2.5,
        cooldown: 0,
        mana_cost: 895,
        damage: '2987 - 3745',
        effect: 'Hurls a fiery bolt'
      }
    },
    {
      id: 'Mutilate',
      label: 'Mutilate',
      x: 450, y: 350,
      metadata: {
        type: 'ability',
        class: 'Rogue',
        school: 'Physical',
        cast_time: 0,
        cooldown: 0,
        energy_cost: 60,
        damage: '175% weapon damage',
        effect: 'Instantly attacks with both weapons'
      }
    }
  ];

  abilities.forEach(ability => nodes.push(ability));

  // QUEST OBJECTIVES AND ITEMS - Real WoW Quest Items
  const questItems = [
    {
      id: 'Rhahkzor_Hammer',
      label: 'Rhahk\'zor\'s Hammer',
      x: 350, y: 300,
      metadata: {
        type: 'quest_item',
        quality: 'uncommon',
        item_level: 20,
        quest: 'The Defias Brotherhood',
        zone: 'Deadmines',
        vendor_price: '4g 12s'
      }
    },
    {
      id: 'Goblin_Transponder',
      label: 'Goblin Transponder',
      x: 380, y: 280,
      metadata: {
        type: 'quest_item',
        quality: 'poor',
        quest: 'Underground Assault',
        use_effect: 'Calls in Goblin Sapper',
        charges: 1
      }
    }
  ];

  questItems.forEach(item => nodes.push(item));

  // SEMANTIC SPACE-TIME EDGE RELATIONSHIPS - WoW Combat & Dungeon Mechanics

  // MOVEMENT PATTERNS - Players traversing dungeon
  edges.push(
    {
      source: 'Throgrim_DK',
      target: 'DM_Entrance',
      label: 'enters dungeon',
      metadata: {
        type: 'movement',
        timestamp: 0,
        distance: 156.2, // Calculated distance
        movement_type: 'walking',
        party_role: 'tank_lead'
      }
    },
    {
      source: 'Liadrin_Paladin',
      target: 'DM_Entrance',
      label: 'follows group',
      metadata: {
        type: 'movement',
        timestamp: 2,
        distance: 148.7,
        movement_type: 'walking',
        party_role: 'healer_follow'
      }
    },
    {
      source: 'Kael_Mage',
      target: 'DM_Mine_Tunnels',
      label: 'advances cautiously',
      metadata: {
        type: 'movement',
        timestamp: 45,
        distance: 223.6,
        movement_type: 'sneaking',
        party_role: 'ranged_dps'
      }
    },
    {
      source: 'Garona_Rogue',
      target: 'DM_Mine_Tunnels',
      label: 'scouts ahead',
      metadata: {
        type: 'movement',
        timestamp: 38,
        distance: 201.4,
        movement_type: 'stealth',
        party_role: 'scout'
      }
    }
  );

  // COMBAT SEQUENCES - Tank pulling and threat management
  edges.push(
    {
      source: 'Throgrim_DK',
      target: 'Defias_Strip_Miner',
      label: 'pulls mob',
      metadata: {
        type: 'aggro_pull',
        timestamp: 65,
        threat_level: 4800,
        ability_used: 'Death Grip',
        combat_role: 'tank_initiation'
      }
    },
    {
      source: 'Defias_Strip_Miner',
      target: 'Throgrim_DK',
      label: 'attacks tank',
      metadata: {
        type: 'melee_attack',
        timestamp: 66,
        damage: 1247,
        attack_type: 'auto_attack',
        threat_generated: 1247
      }
    },
    {
      source: 'Kael_Mage',
      target: 'Defias_Strip_Miner',
      label: 'casts Fireball',
      metadata: {
        type: 'spell_cast',
        timestamp: 68,
        damage: 3245,
        cast_time: 2.5,
        school: 'Fire',
        threat_generated: 1622 // Half damage for threat
      }
    }
  );

  // HEALING AND SUPPORT SEQUENCES
  edges.push(
    {
      source: 'Liadrin_Paladin',
      target: 'Throgrim_DK',
      label: 'heals tank',
      metadata: {
        type: 'healing',
        timestamp: 72,
        healing_amount: 8456,
        spell: 'Holy Light',
        overheal: 2145,
        threat_generated: 4228 // Half healing for threat
      }
    },
    {
      source: 'Flash_of_Light',
      target: 'Throgrim_DK',
      label: 'emergency heal',
      metadata: {
        type: 'instant_heal',
        timestamp: 89,
        healing_amount: 3822,
        caster: 'Liadrin_Paladin',
        critical_hit: true
      }
    }
  );

  // ABILITY USAGE SEQUENCES - Combat Rotations
  edges.push(
    {
      source: 'Throgrim_DK',
      target: 'Death_Coil',
      label: 'activates',
      metadata: {
        type: 'ability_activation',
        timestamp: 71,
        target: 'Defias_Strip_Miner',
        runic_power_spent: 40,
        damage_dealt: 2012,
        combat_context: 'threat_generation'
      }
    },
    {
      source: 'Garona_Rogue',
      target: 'Mutilate',
      label: 'executes combo',
      metadata: {
        type: 'ability_activation',
        timestamp: 70,
        target: 'Defias_Strip_Miner',
        energy_spent: 60,
        combo_points_generated: 2,
        damage_dealt: 2845,
        combat_context: 'stealth_opener'
      }
    }
  );
  
  // BOSS ENCOUNTER SEQUENCES - Edwin VanCleef Fight
  edges.push(
    {
      source: 'Throgrim_DK',
      target: 'Edwin_VanCleef',
      label: 'engages boss',
      metadata: {
        type: 'boss_aggro',
        timestamp: 180,
        threat_level: 8500,
        encounter_phase: 'initial_pull',
        difficulty: 'elite'
      }
    },
    {
      source: 'Edwin_VanCleef',
      target: 'Throgrim_DK',
      label: 'Sinister Strike',
      metadata: {
        type: 'boss_ability',
        timestamp: 182,
        damage: 2847,
        ability_school: 'Physical',
        debuff_applied: 'Weakened',
        combat_mechanic: 'high_damage'
      }
    },
    {
      source: 'Liadrin_Paladin',
      target: 'Throgrim_DK',
      label: 'Divine Favor heal',
      metadata: {
        type: 'emergency_heal',
        timestamp: 183,
        healing_amount: 12456,
        cooldown_used: 'Divine Favor',
        critical_heal: true
      }
    }
  );

  // GROUP COORDINATION - Party mechanics and communication
  edges.push(
    {
      source: 'Throgrim_DK',
      target: 'Liadrin_Paladin',
      label: 'requests blessing',
      metadata: {
        type: 'social_request',
        timestamp: 15,
        request_type: 'buff_request',
        buff_needed: 'Blessing of Kings',
        party_coordination: true
      }
    },
    {
      source: 'Liadrin_Paladin',
      target: 'Throgrim_DK',
      label: 'casts Blessing',
      metadata: {
        type: 'buff_application',
        timestamp: 17,
        buff_name: 'Blessing of Kings',
        duration: 1800, // 30 minutes
        stat_bonus: '+10% all stats'
      }
    },
    {
      source: 'Garona_Rogue',
      target: 'Kael_Mage',
      label: 'coordinates CC',
      metadata: {
        type: 'tactical_communication',
        timestamp: 156,
        message_type: 'crowd_control_request',
        target_suggested: 'Defias Wizard',
        strategy: 'polymorph_sheep'
      }
    }
  );

  // LOOT DISTRIBUTION - Dungeon rewards
  edges.push(
    {
      source: 'Edwin_VanCleef',
      target: 'Rhahkzor_Hammer',
      label: 'drops loot',
      metadata: {
        type: 'loot_drop',
        timestamp: 245,
        drop_chance: 0.15,
        quality: 'uncommon',
        item_level: 20,
        boss_kill: true
      }
    },
    {
      source: 'Throgrim_DK',
      target: 'Rhahkzor_Hammer',
      label: 'rolls need',
      metadata: {
        type: 'loot_roll',
        timestamp: 246,
        roll_type: 'need',
        roll_value: 87,
        item_upgrade: true
      }
    }
  );

  // DUNGEON PROGRESSION - Movement through instance
  edges.push(
    {
      source: 'DM_Entrance',
      target: 'DM_Mine_Tunnels',
      label: 'progression path',
      metadata: {
        type: 'dungeon_path',
        distance: 180.5,
        expected_time: 45,
        mob_encounters: 4,
        difficulty: 'moderate'
      }
    },
    {
      source: 'DM_Mine_Tunnels',
      target: 'DM_Goblin_Foundry',
      label: 'deeper passage',
      metadata: {
        type: 'dungeon_path',
        distance: 234.7,
        expected_time: 120,
        mob_encounters: 8,
        difficulty: 'challenging'
      }
    },
    {
      source: 'DM_Goblin_Foundry',
      target: 'DM_Ship_Dock',
      label: 'final approach',
      metadata: {
        type: 'dungeon_path',
        distance: 198.3,
        expected_time: 90,
        boss_encounters: ['Mr. Smite', 'Edwin VanCleef'],
        difficulty: 'very_challenging'
      }
    }
  );

  // QUEST COMPLETION SEQUENCES
  edges.push(
    {
      source: 'Goblin_Transponder',
      target: 'DM_Goblin_Foundry',
      label: 'activates at',
      metadata: {
        type: 'quest_interaction',
        timestamp: 156,
        quest_progress: 'Underground Assault',
        effect: 'Summons Goblin Sapper',
        experience_gained: 2450
      }
    },
    {
      source: 'Throgrim_DK',
      target: 'Goblin_Transponder',
      label: 'uses item',
      metadata: {
        type: 'item_usage',
        timestamp: 155,
        cooldown_triggered: 300,
        tactical_purpose: 'boss_damage'
      }
    }
  );

  // THREAT MANAGEMENT - Tank mechanics
  edges.push(
    {
      source: 'Throgrim_DK',
      target: 'Mr_Smite',
      label: 'maintains aggro',
      metadata: {
        type: 'threat_control',
        timestamp: 195,
        threat_level: 12500,
        threat_lead: 4800,
        tank_mechanic: 'aggro_maintenance'
      }
    },
    {
      source: 'Garona_Rogue',
      target: 'Mr_Smite',
      label: 'manages threat',
      metadata: {
        type: 'threat_dump',
        timestamp: 198,
        ability_used: 'Feint',
        threat_reduced: 2100,
        tactical_purpose: 'avoid_aggro'
      }
    }
  );

  // BUFF AND DEBUFF CHAINS
  edges.push(
    {
      source: 'Kael_Mage',
      target: 'Captain_Greenskin',
      label: 'applies Ignite',
      metadata: {
        type: 'debuff_application',
        timestamp: 167,
        debuff_name: 'Ignite',
        duration: 8,
        damage_per_tick: 245,
        stacks: 3
      }
    },
    {
      source: 'Captain_Greenskin',
      target: 'Throgrim_DK',
      label: 'Intimidating Shout',
      metadata: {
        type: 'fear_effect',
        timestamp: 170,
        duration: 3.5,
        crowd_control: 'fear',
        effect: 'movement_impaired'
      }
    }
  );
  
  return { nodes, edges };
}

/**
 * WoW-specific semantic compatibility matrix for edge bundling
 * Defines how different WoW edge types should bundle together based on their semantic relationships
 */
export const edgeCompatibilityMatrix: Record<string, Record<string, number>> = {
  // Combat-related edges should bundle strongly together
  'aggro_pull': { 'melee_attack': 0.9, 'threat_control': 0.95, 'boss_aggro': 0.85, 'spell_cast': 0.7 },
  'melee_attack': { 'aggro_pull': 0.9, 'boss_ability': 0.8, 'spell_cast': 0.75 },
  'spell_cast': { 'ability_activation': 0.9, 'debuff_application': 0.8, 'healing': 0.6, 'melee_attack': 0.75 },
  'boss_ability': { 'boss_aggro': 0.9, 'fear_effect': 0.8, 'melee_attack': 0.8 },

  // Healing and support should bundle together
  'healing': { 'emergency_heal': 0.95, 'instant_heal': 0.9, 'buff_application': 0.7 },
  'emergency_heal': { 'healing': 0.95, 'instant_heal': 0.85, 'threat_control': 0.4 },
  'buff_application': { 'social_request': 0.8, 'healing': 0.7, 'ability_activation': 0.5 },

  // Movement and navigation should bundle
  'movement': { 'dungeon_path': 0.9, 'aggro_pull': 0.4, 'tactical_communication': 0.6 },
  'dungeon_path': { 'movement': 0.9, 'quest_interaction': 0.5 },

  // Social and coordination edges
  'social_request': { 'buff_application': 0.8, 'tactical_communication': 0.7, 'loot_roll': 0.3 },
  'tactical_communication': { 'social_request': 0.7, 'threat_dump': 0.6, 'movement': 0.6 },

  // Loot and items
  'loot_drop': { 'loot_roll': 0.9, 'item_usage': 0.6 },
  'loot_roll': { 'loot_drop': 0.9, 'item_usage': 0.4 },
  'item_usage': { 'quest_interaction': 0.8, 'ability_activation': 0.5 },

  // Threat mechanics (tank-specific)
  'threat_control': { 'aggro_pull': 0.95, 'threat_dump': 0.8, 'boss_aggro': 0.9 },
  'threat_dump': { 'threat_control': 0.8, 'tactical_communication': 0.6 },

  // Debuffs and status effects
  'debuff_application': { 'spell_cast': 0.8, 'fear_effect': 0.7 },
  'fear_effect': { 'boss_ability': 0.8, 'debuff_application': 0.7 },

  // Quest-related
  'quest_interaction': { 'item_usage': 0.8, 'dungeon_path': 0.5 }
};

/**
 * Get semantic compatibility between two WoW edge types
 */
export function getEdgeCompatibility(type1: string, type2: string): number {
  if (type1 === type2) return 1;

  return edgeCompatibilityMatrix[type1]?.[type2] ||
         edgeCompatibilityMatrix[type2]?.[type1] ||
         0.1; // Low default compatibility for unrelated WoW mechanics
}

/**
 * WoW-specific style configurations for different node and edge types
 */
export const nodeStyles = {
  colors: {
    player: '#ff6b6b',        // Red for player characters
    boss: '#8b0000',          // Dark red for bosses
    mob: '#cd853f',           // Peru for regular mobs
    location: '#4ecdc4',      // Teal for locations
    ability: '#9370db',       // Medium purple for abilities
    quest_item: '#ffd700'     // Gold for quest items
  },
  sizes: {
    player: 16,      // Larger for main characters
    boss: 18,        // Largest for bosses
    mob: 10,         // Medium for regular enemies
    location: 12,    // Medium-large for locations
    ability: 8,      // Small for abilities
    quest_item: 10   // Medium for quest items
  }
};

export const edgeStyles = {
  colors: {
    // Combat edges - reds and oranges
    aggro_pull: '#dc143c',         // Crimson for tank pulls
    melee_attack: '#b22222',       // Fire brick for melee
    spell_cast: '#ff4500',         // Orange red for spells
    boss_ability: '#8b0000',       // Dark red for boss abilities
    boss_aggro: '#cd5c5c',         // Indian red for boss engagement

    // Healing and support - greens and blues
    healing: '#32cd32',            // Lime green for heals
    emergency_heal: '#00ff00',     // Bright green for emergency
    instant_heal: '#90ee90',       // Light green for instant
    buff_application: '#4169e1',   // Royal blue for buffs

    // Movement - blues
    movement: '#1e90ff',           // Dodger blue for movement
    dungeon_path: '#4682b4',       // Steel blue for paths

    // Threat mechanics - purples
    threat_control: '#9932cc',     // Dark orchid for threat
    threat_dump: '#ba55d3',        // Medium orchid for threat reduction

    // Social and coordination - yellows
    social_request: '#ffd700',     // Gold for requests
    tactical_communication: '#ffb347', // Peach for coordination

    // Loot and items - golds and browns
    loot_drop: '#daa520',          // Goldenrod for drops
    loot_roll: '#b8860b',          // Dark goldenrod for rolls
    item_usage: '#cd853f',         // Peru for item usage
    quest_interaction: '#deb887',   // Burlywood for quests

    // Effects and debuffs - various
    debuff_application: '#9370db', // Medium purple for debuffs
    fear_effect: '#8b008b',        // Dark magenta for fear
    ability_activation: '#ff1493'  // Deep pink for abilities
  },
  widths: {
    // Combat edges - thicker for visibility
    aggro_pull: 4,           // Thick for important tank actions
    boss_ability: 5,         // Very thick for boss mechanics
    spell_cast: 3,           // Medium-thick for spells
    melee_attack: 2.5,       // Medium for attacks

    // Healing - thick for importance
    healing: 3.5,            // Thick for heals
    emergency_heal: 4.5,     // Very thick for emergency

    // Movement - medium thickness
    movement: 2.5,           // Visible movement
    dungeon_path: 2,         // Visible paths

    // Threat - thick for tank mechanics
    threat_control: 4,       // Important tank mechanics
    threat_dump: 2.5,        // Visible threat management

    // Social - thinner but visible
    social_request: 2,       // Visible coordination
    tactical_communication: 2.5, // Slightly thicker

    // Loot and effects - varied
    loot_drop: 3,            // Visible loot
    ability_activation: 2.5, // Visible abilities
    debuff_application: 2,   // Visible debuffs

    // Default
    quest_interaction: 2,    // Standard quest width
    item_usage: 2           // Standard item usage
  }
};
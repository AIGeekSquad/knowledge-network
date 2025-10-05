// World of Warcraft Gaming Session: Semantic Space-Time Graph Data Generator
// Realistic WoW dungeon run through Deadmines with accurate game mechanics
import { Node, Edge } from '../../knowledge-network/dist/index.js';

/**
 * Creates a realistic World of Warcraft gaming session knowledge graph
 * Using accurate WoW zones, classes, abilities, and game mechanics
 *
 * Based on semantic space-time graph theory principles:
 * - Temporal coherence: Each node represents a specific space-time state
 * - Spatial precision: All entities have precise WoW coordinates
 * - Semantic richness: Rich WoW-specific metadata enables similarity calculations
 * - Relationship specificity: WoW-specific edge types (aggro, cast_sequence, threat, etc.)
 * - Multi-dimensional properties: Captures WoW combat mechanics, movement, social interactions
 */
export function createGamingSessionGraph(): { nodes: Node[], edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // PLAYER CHARACTERS - Authentic WoW Classes with Real Coordinates
  const players = [
    {
      id: 'Throgrim_DK',
      label: 'Throgrim (Death Knight)',
      x: 120, y: 150, // Westfall coordinates
      metadata: {
        type: 'player',
        class: 'Death Knight',
        spec: 'Unholy',
        level: 85,
        guild: 'Stormrage Vanguard',
        health: 185000,
        runic_power: 1000,
        zone: 'Westfall',
        subzone: 'Moonbrook',
        coordinates: { x: -10684, y: 1033, zone_id: 40 }, // Real WoW coords
        primary_stats: { strength: 2845, stamina: 3420, haste: 1205 }
      }
    },
    {
      id: 'Liadrin_Paladin',
      label: 'Liadrin (Holy Paladin)',
      x: 150, y: 180,
      metadata: {
        type: 'player',
        class: 'Paladin',
        spec: 'Holy',
        level: 85,
        guild: 'Stormrage Vanguard',
        health: 165000,
        mana: 85000,
        zone: 'Westfall',
        subzone: 'Moonbrook',
        coordinates: { x: -10678, y: 1028, zone_id: 40 },
        primary_stats: { intellect: 2654, spirit: 1876, spell_power: 3241 }
      }
    },
    {
      id: 'Kael_Mage',
      label: 'Kael (Fire Mage)',
      x: 100, y: 200,
      metadata: {
        type: 'player',
        class: 'Mage',
        spec: 'Fire',
        level: 85,
        guild: 'Stormrage Vanguard',
        health: 125000,
        mana: 95000,
        zone: 'Westfall',
        subzone: 'Moonbrook',
        coordinates: { x: -10692, y: 1021, zone_id: 40 },
        primary_stats: { intellect: 3120, haste: 1654, crit: 1432 }
      }
    },
    {
      id: 'Garona_Rogue',
      label: 'Garona (Assassination Rogue)',
      x: 180, y: 160,
      metadata: {
        type: 'player',
        class: 'Rogue',
        spec: 'Assassination',
        level: 85,
        guild: 'Stormrage Vanguard',
        health: 142000,
        energy: 100,
        zone: 'Westfall',
        subzone: 'Moonbrook',
        coordinates: { x: -10671, y: 1035, zone_id: 40 },
        primary_stats: { agility: 3045, expertise: 781, mastery: 1234 }
      }
    }
  ];

  players.forEach(player => nodes.push(player));
  
  // DEADMINES DUNGEON LOCATIONS - Authentic WoW Coordinates
  const dungeonLocations = [
    {
      id: 'DM_Entrance',
      label: 'Deadmines Entrance',
      x: 100, y: 100,
      metadata: {
        type: 'location',
        zone: 'Westfall',
        dungeon: 'Deadmines',
        coordinates: { x: -11209, y: 1666, zone_id: 40 },
        danger_level: 'safe',
        boss_encounter: false
      }
    },
    {
      id: 'DM_Mine_Tunnels',
      label: 'Mine Tunnels',
      x: 250, y: 150,
      metadata: {
        type: 'location',
        zone: 'The Deadmines',
        coordinates: { x: -102, y: -688, zone_id: 36 },
        danger_level: 'moderate',
        mob_density: 'high',
        boss_encounter: false
      }
    },
    {
      id: 'DM_Goblin_Foundry',
      label: 'Goblin Foundry',
      x: 400, y: 200,
      metadata: {
        type: 'location',
        zone: 'The Deadmines',
        coordinates: { x: -290, y: -545, zone_id: 36 },
        danger_level: 'dangerous',
        boss_encounter: true,
        boss_name: 'Sneed'
      }
    },
    {
      id: 'DM_Ship_Dock',
      label: 'Underground Ship',
      x: 550, y: 250,
      metadata: {
        type: 'location',
        zone: 'The Deadmines',
        coordinates: { x: -144, y: -355, zone_id: 36 },
        danger_level: 'very_dangerous',
        boss_encounter: true,
        boss_name: 'Edwin VanCleef'
      }
    },
    {
      id: 'Stormwind_Harbor',
      label: 'Stormwind Harbor',
      x: 50, y: 50,
      metadata: {
        type: 'location',
        zone: 'Stormwind City',
        coordinates: { x: -8245, y: 816, zone_id: 0 },
        danger_level: 'safe',
        is_sanctuary: true
      }
    }
  ];

  dungeonLocations.forEach(loc => nodes.push(loc));

  // DUNGEON BOSSES AND NPCS - Real WoW Enemies
  const npcs = [
    {
      id: 'Edwin_VanCleef',
      label: 'Edwin VanCleef',
      x: 550, y: 250,
      metadata: {
        type: 'boss',
        level: 20,
        health: 2637,
        faction: 'Defias Brotherhood',
        abilities: ['Sinister Strike', 'Backstab', 'Thrash Blade'],
        loot_table: ['Blackened Defias Armor', 'VanCleef\'s Battlegear'],
        dungeon: 'Deadmines',
        elite: true
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
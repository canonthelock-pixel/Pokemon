import { Fighter, Move, PokemonType, DamageResult, BattleFighter } from "../types";
import { getMoveById } from "../data/moves";

// Gen 9 Type Effectiveness Chart
const typeChart: Record<PokemonType, { strong: PokemonType[]; weak: PokemonType[]; immune: PokemonType[] }> = {
  normal: { strong: [], weak: ["fighting"], immune: ["ghost"] },
  fire: { strong: ["grass", "ice", "bug", "steel", "fairy"], weak: ["water", "ground", "rock"], immune: [] },
  water: { strong: ["fire", "ground", "rock"], weak: ["electric", "grass"], immune: [] },
  electric: { strong: ["water", "flying"], weak: ["ground"], immune: [] },
  grass: { strong: ["water", "ground", "rock"], weak: ["fire", "ice", "poison", "flying", "bug"], immune: [] },
  ice: { strong: ["flying", "ground", "grass", "dragon"], weak: ["fire", "fighting", "rock", "steel"], immune: [] },
  fighting: { strong: ["normal", "ice", "rock", "dark", "steel"], weak: ["flying", "psychic", "fairy"], immune: [] },
  poison: { strong: ["grass", "fairy"], weak: ["ground", "psychic"], immune: [] },
  ground: { strong: ["fire", "electric", "poison", "rock", "steel"], weak: ["water", "grass", "ice"], immune: ["electric"] },
  flying: { strong: ["fighting", "bug", "grass"], weak: ["electric", "ice", "rock"], immune: ["ground"] },
  psychic: { strong: ["fighting", "poison"], weak: ["bug", "ghost", "dark"], immune: [] },
  bug: { strong: ["grass", "psychic", "dark"], weak: ["fire", "flying", "rock"], immune: [] },
  rock: { strong: ["fire", "ice", "flying", "bug"], weak: ["water", "grass", "fighting", "ground", "steel"], immune: [] },
  ghost: { strong: ["psychic", "ghost"], weak: ["ghost", "dark"], immune: ["normal", "fighting"] },
  dragon: { strong: ["dragon"], weak: ["ice", "dragon", "fairy"], immune: [] },
  dark: { strong: ["psychic", "ghost"], weak: ["fighting", "bug", "fairy"], immune: [] },
  steel: { strong: ["ice", "rock", "fairy"], weak: ["fire", "water", "electric", "ground"], immune: ["poison"] },
  fairy: { strong: ["fighting", "dragon", "dark"], weak: ["poison", "steel"], immune: [] },
};

export class DamageCalculator {
  /**
   * Calculate damage using Gen 9 formula
   * Damage = ((2 * Level / 5 + 2) * Power * Attack / Defense) / 50 + 2) * Modifiers
   */
  static calculateDamage(
    attacker: BattleFighter,
    defender: BattleFighter,
    move: Move,
    level: number = 50
  ): DamageResult {
    const moveAccuracy = Math.random() * 100 <= move.accuracy;
    
    if (!moveAccuracy) {
      return {
        damage: 0,
        effectiveness: "neutral",
        isCritical: false,
        moveAccuracy: false,
      };
    }

    if (move.power === null) {
      // Status move
      return {
        damage: 0,
        effectiveness: "neutral",
        isCritical: false,
        moveAccuracy: true,
      };
    }

    // Check immunity
    for (const immuneType of defender.fighter.immunities) {
      if (move.type === immuneType) {
        return {
          damage: 0,
          effectiveness: "immune",
          isCritical: false,
          moveAccuracy: true,
        };
      }
    }

    // Determine attack and defense stats
    let atkStat = attacker.fighter.stats.attack;
    let defStat = defender.fighter.stats.defense;

    if (move.category === "special") {
      atkStat = attacker.fighter.stats.spAtk;
      defStat = defender.fighter.stats.spDef;
    }

    // Apply stat stages (negative stages favor attacker, positive favor defender)
    const atkMultiplier = this.getStatMultiplier(attacker.statStages.attack);
    const defMultiplier = this.getStatMultiplier(defender.statStages.defense);
    const spAtkMultiplier = this.getStatMultiplier(attacker.statStages.spAtk);
    const spDefMultiplier = this.getStatMultiplier(defender.statStages.spDef);

    if (move.category === "physical") {
      atkStat = Math.floor(atkStat * atkMultiplier);
      defStat = Math.floor(defStat * defMultiplier);
    } else {
      atkStat = Math.floor(atkStat * spAtkMultiplier);
      defStat = Math.floor(defStat * spDefMultiplier);
    }

    // Base damage formula
    let damage = Math.floor(
      (((2 * level) / 5 + 2) * move.power * atkStat) / defStat / 50 + 2
    );

    // Check for critical hit (6.25% base chance, can be modified by items)
    const isCritical = Math.random() < 0.0625;
    if (isCritical) {
      damage = Math.floor(damage * 1.5);
    }

    // Items and abilities modifiers
    damage = this.applyItemModifiers(damage, attacker.fighter.item, move.category);
    damage = this.applyAbilityModifiers(damage, attacker.fighter.ability);

    // Type effectiveness
    const effectiveness = this.getTypeEffectiveness(move.type, defender.fighter.types);
    damage = Math.floor(damage * effectiveness.multiplier);

    // Random variance (85-100%)
    const variance = 0.85 + Math.random() * 0.15;
    damage = Math.floor(damage * variance);

    return {
      damage: Math.max(1, damage),
      effectiveness: effectiveness.description,
      isCritical,
      moveAccuracy: true,
    };
  }

  private static getStatMultiplier(stage: number): number {
    if (stage > 0) {
      return (2 + stage) / 2;
    } else if (stage < 0) {
      return 2 / (2 - stage);
    }
    return 1;
  }

  private static applyItemModifiers(damage: number, item: string, category: string): number {
    if (item === "Life Orb") {
      return Math.floor(damage * 1.3); // 30% boost
    }
    if (item === "Black Belt" && category === "physical") {
      return Math.floor(damage * 1.2); // 20% boost
    }
    return damage;
  }

  private static applyAbilityModifiers(damage: number, ability: string): number {
    if (ability === "Iron Fist") {
      return Math.floor(damage * 1.2); // 20% boost
    }
    return damage;
  }

  private static getTypeEffectiveness(
    attackType: PokemonType,
    defenderTypes: PokemonType[]
  ): { multiplier: number; description: string } {
    let multiplier = 1;

    for (const defType of defenderTypes) {
      const chart = typeChart[attackType];

      if (chart.strong.includes(defType)) {
        multiplier *= 2;
      } else if (chart.weak.includes(defType)) {
        multiplier *= 0.5;
      } else if (chart.immune.includes(defType)) {
        multiplier = 0;
      }
    }

    if (multiplier === 0) {
      return { multiplier: 0, description: "immune" };
    } else if (multiplier > 1) {
      return { multiplier, description: "super_effective" };
    } else if (multiplier < 1) {
      return { multiplier, description: "not_very_effective" };
    }
    return { multiplier: 1, description: "neutral" };
  }

  /**
   * Get type matchup for a specific type against a defender
   */
  static getTypeMatchup(
    attackType: PokemonType,
    defenderTypes: PokemonType[]
  ): { strong: boolean; weak: boolean; immune: boolean } {
    const chart = typeChart[attackType];
    let strong = false;
    let weak = false;
    let immune = false;

    for (const defType of defenderTypes) {
      if (chart.strong.includes(defType)) strong = true;
      if (chart.weak.includes(defType)) weak = true;
      if (chart.immune.includes(defType)) immune = true;
    }

    return { strong, weak, immune };
  }
}

import express, { Express, Request, Response } from "express";
import cors from "cors";
import path from "path";
import { BattleEngine } from "./engine/battle";
import { getAllFighterIds, getFighterById } from "./data/fighters";
import { getAllMoveIds, getMoveById } from "./data/moves";

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Store active battles
const activeBattles: Map<string, BattleEngine> = new Map();

// API Routes

/**
 * GET /api/fighters - Get all available fighters
 */
app.get("/api/fighters", (req: Request, res: Response) => {
  const allFighters = getAllFighterIds().map((id) => {
    const fighter = getFighterById(id);
    if (!fighter) return null;
    return {
      id: fighter.id,
      name: fighter.name,
      gender: fighter.gender,
      types: fighter.types,
      stats: fighter.stats,
      ability: fighter.ability,
      item: fighter.item,
      moves: fighter.moves.map((moveId) => getMoveById(moveId)),
    };
  });

  res.json(allFighters.filter((f) => f !== null));
});

/**
 * GET /api/fighters/:id - Get specific fighter
 */
app.get("/api/fighters/:id", (req: Request, res: Response) => {
  const fighter = getFighterById(req.params.id);
  if (!fighter) {
    return res.status(404).json({ error: "Fighter not found" });
  }

  res.json({
    id: fighter.id,
    name: fighter.name,
    gender: fighter.gender,
    types: fighter.types,
    stats: fighter.stats,
    ability: fighter.ability,
    item: fighter.item,
    moves: fighter.moves.map((moveId) => getMoveById(moveId)),
    weaknesses: fighter.weaknesses,
    resistances: fighter.resistances,
    immunities: fighter.immunities,
  });
});

/**
 * GET /api/moves - Get all available moves
 */
app.get("/api/moves", (req: Request, res: Response) => {
  const allMoves = getAllMoveIds().map((id) => getMoveById(id));
  res.json(allMoves);
});

/**
 * GET /api/moves/:id - Get specific move
 */
app.get("/api/moves/:id", (req: Request, res: Response) => {
  const move = getMoveById(req.params.id);
  if (!move) {
    return res.status(404).json({ error: "Move not found" });
  }
  res.json(move);
});

/**
 * POST /api/battles/1v1 - Start 1v1 battle
 */
app.post("/api/battles/1v1", (req: Request, res: Response) => {
  const { fighter1Id, fighter2Id } = req.body;

  if (!fighter1Id || !fighter2Id) {
    return res.status(400).json({ error: "Both fighter IDs required" });
  }

  const f1 = getFighterById(fighter1Id);
  const f2 = getFighterById(fighter2Id);

  if (!f1 || !f2) {
    return res.status(400).json({ error: "Invalid fighter ID" });
  }

  const battleId = `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const battle = new BattleEngine([fighter1Id], [fighter2Id]);
  activeBattles.set(battleId, battle);

  res.json({
    battleId,
    state: battle.getBattleState(),
    log: battle.getLog(),
  });
});

/**
 * POST /api/battles/6v6 - Start 6v6 team battle
 */
app.post("/api/battles/6v6", (req: Request, res: Response) => {
  const { team1, team2 } = req.body;

  if (!Array.isArray(team1) || !Array.isArray(team2) || team1.length === 0 || team2.length === 0) {
    return res.status(400).json({ error: "Valid teams required" });
  }

  const battleId = `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const battle = new BattleEngine(team1, team2);
  activeBattles.set(battleId, battle);

  res.json({
    battleId,
    state: battle.getBattleState(),
    log: battle.getLog(),
  });
});

/**
 * GET /api/battles/:battleId - Get battle state
 */
app.get("/api/battles/:battleId", (req: Request, res: Response) => {
  const battle = activeBattles.get(req.params.battleId);
  if (!battle) {
    return res.status(404).json({ error: "Battle not found" });
  }

  res.json({
    battleId: req.params.battleId,
    state: battle.getBattleState(),
    log: battle.getLog(),
    teamStatus: {
      player1: battle.getTeamStatus("player1"),
      player2: battle.getTeamStatus("player2"),
    },
  });
});

/**
 * POST /api/battles/:battleId/action - Execute battle action
 */
app.post("/api/battles/:battleId/action", (req: Request, res: Response) => {
  const { player, action } = req.body;
  const battle = activeBattles.get(req.params.battleId);

  if (!battle) {
    return res.status(404).json({ error: "Battle not found" });
  }

  if (!player || !action) {
    return res.status(400).json({ error: "Player and action required" });
  }

  battle.executeAction(player as "player1" | "player2", action);

  res.json({
    battleId: req.params.battleId,
    state: battle.getBattleState(),
    log: battle.getLog(),
    teamStatus: {
      player1: battle.getTeamStatus("player1"),
      player2: battle.getTeamStatus("player2"),
    },
  });
});

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", message: "Pokémon Battle Server Running" });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Pokémon Battle Server running on port ${PORT}`);
  console.log(`📊 Available fighters: ${getAllFighterIds().length}`);
  console.log(`⚡ Available moves: ${getAllMoveIds().length}`);
});

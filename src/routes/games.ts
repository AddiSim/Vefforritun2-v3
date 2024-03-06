import { NextFunction, Request, Response } from 'express';
import { 
  getGames, 
  insertGame, 
  updateGameByGameId, 
  deleteGameByGameId } from '../lib/db.js';

export async function listGames(req: Request, res: Response, next: NextFunction) {
  try {
    const games = await getGames();
    return res.json(games);
  } catch (error) {
    next(error);
  }
}

export async function createGame(req: Request, res: Response, next: NextFunction) {
  try {
    const newGame = await insertGame(req.body);
    console.log(newGame);
    return res.status(200).json(newGame);
  } catch (error) {
    next(error);
  }
}

export async function deleteGame(req: Request, res: Response, next: NextFunction) {
  const gameId = Number(req.params.gameId);
  if (!gameId) {
    return next();
  }
  const deleted = await deleteGameByGameId(gameId);
  if (!deleted) {
    return next(new Error('Unable to delete game'));
  }

  return res.status(204).json({});
  
}
export async function updateGame(req: Request, res: Response, next: NextFunction) {
  const gameId = Number(req.params.gameId); 
  if (!gameId) {
    return next();
  }
    const updateData = req.body;
    const updated = await updateGameByGameId(gameId, updateData);
    if (!updated) {
      return next(new Error('Unable to update game'));
    }
    return res.json(updated);
}

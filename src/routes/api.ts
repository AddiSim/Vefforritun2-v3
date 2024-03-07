import express, { Request, Response, NextFunction} from 'express';
import { 
    listGames, 
    createGame, 
    updateGame, 
    deleteGame,
    } from './games.js';
import { 
    listTeams, 
    listTeam, 
    createTeam, 
    deleteTeam, 
    updateTeam
     } from './teams.js';
import { 
    createGameValidations,
    updateGameValidations,
    createTeamValidations,
     updateTeamValidations,
      validationCheck } from '../lib/validation.js';

export const router = express.Router();

export async function index(req: Request, res: Response) {
    return res.json([
        {
            href: '/teams',
            methods: ['GET', 'POST'], 
        },
        {
            href: '/teams/:slug',
            methods: ['GET', 'PATCH', 'DELETE'], 
        },
        {
            href: '/games',
            methods: ['GET', 'POST'], 
        },
        {
            href: '/games/:gameId',
            methods: ['PATCH', 'DELETE'], 
        },
    ]);
}

// Teams
router.get('/', index);
router.get('/teams', listTeams);
router.post('/teams', ...createTeamValidations, validationCheck, createTeam);
router.get('/teams/:slug', listTeam);
router.patch('/teams/:slug', ...updateTeamValidations,validationCheck, updateTeam);
router.delete('/teams/:slug', deleteTeam);

// Games
router.get('/games', listGames);
router.post('/games', createGameValidations, (req: Request, res: Response, next: NextFunction) => createGame(req, res, next));
router.patch('/games/:gameId', updateGameValidations, (req: Request, res: Response, next: NextFunction) => updateGame(req, res, next));
router.delete('/games/:gameId', deleteGame);



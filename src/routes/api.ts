import express, { Request, Response, NextFunction } from 'express';
import { listGames, createGame, updateGame, deleteGame} from './games.js';
import { listTeams, listTeam, createTeam, deleteTeam, updateTeam } from './teams.js';

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
            methods: ['GET', 'PATCH', 'PUT'], 
        },
    ]);
}

// Teams
router.get('/', index);
router.get('/teams', listTeams);
router.post('/teams', createTeam);
router.get('/teams/:slug', listTeam);
router.patch('/teams/:slug', updateTeam);
router.delete('/teams/:slug', deleteTeam);

// Games
router.get('/games', listGames);
router.post('/games', createGame);
router.patch('/games/:gameId', updateGame); 
router.delete('/games/:gameId', deleteGame);



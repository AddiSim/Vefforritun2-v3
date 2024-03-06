import express, { Request, Response} from 'express';
import { 
    listGames, 
    createGame, 
    updateGame, 
    deleteGame} from './games.js';
import { 
    listTeams, 
    listTeam, 
    createTeam, 
    deleteTeam, 
    updateTeam } from './teams.js';
    import { 
        atLeastOneBodyValueValidator, 
        teamSlugDoesNotExistValidator,
        teamValidationRules,
        genericSanitizerMany,
        stringValidator,
        validationCheck,
        xssSanitizer } from '../lib/validation.js';

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
router.post('/teams', 
    [
        atLeastOneBodyValueValidator(['name', 'description']),
        stringValidator({ field: 'name', required: true, maxLength: 50 }),
        stringValidator({ field: 'description', required: false, maxLength: 255 }), 
        teamSlugDoesNotExistValidator,
        xssSanitizer('name'), 
        xssSanitizer('description'), 
        validationCheck
    ], 
    createTeam);
router.get('/teams/:slug', listTeam);
router.patch('/teams/:slug',
  [
    stringValidator({ field: 'name', required: false, maxLength: 50, optional: true }),
    stringValidator({ field: 'description', required: false, maxLength: 255, optional: true }),
    teamSlugDoesNotExistValidator,
    xssSanitizer('name'),
    xssSanitizer('description'),
    validationCheck,
  ],
    updateTeam );
router.delete('/teams/:slug', deleteTeam);

// Games
router.get('/games', listGames);
router.post('/games', createGame);
router.patch('/games/:gameId', updateGame); 
router.delete('/games/:gameId', deleteGame);



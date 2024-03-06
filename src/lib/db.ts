import pg from 'pg';
import dotenv from 'dotenv';
import slugify from 'slugify';
import { team, game } from '../types.js';
import { gameMapper, teamMapper } from './mappers.js';

let savedPool: pg.Pool | undefined;

dotenv.config();

export function getPool(): pg.Pool {
  if (savedPool) {
    return savedPool;
  }

  const { DATABASE_URL: connectionString } = process.env;
  if (!connectionString) {
    console.error('Missing DATABASE_URL in .env');
    throw new Error('Missing DATABASE_URL');
  }

  console.log(`Connecting to database with connection string: ${connectionString}`);
  savedPool = new pg.Pool({ connectionString });

  savedPool.on('error', (err) => {
    console.error('Database connection error, application will exit', err);
    throw new Error('Error in DB connection');
  });

  return savedPool;
}

export async function query(
  q: string,
  values: Array<unknown> = [],
  silent = false,
): Promise<pg.QueryResult<any> | null> {
  const pool = getPool();

  let client;
  try {
    client = await pool.connect();
    const result = await client.query(q, values);
    return result; 
  } catch (e) {
    if (!silent) {
      console.error('Unable to query', e);
      console.info(q, values);
    }
    return null;
  } finally {
    client?.release();
  }
}

export async function testConnection(): Promise<void> {
  try {
    const result = await query('SELECT 1 as number');
    if (result && result.rows.length > 0 && result.rows[0].number === 1) {
      console.log('Database connection test successful.');
    } else {
      console.error('Database connection test failed.');
      process.exit(1);
    }
  } catch (error) {
    console.error('Database connection test error:', error);
    process.exit(1);
  }
}

export async function updateTeamSlugs() {
  const teams = await query('SELECT id, name FROM teams');
  if (teams && teams.rows) {
    for (const team of teams.rows) {
      const slug = slugify(team.name);
      await query('UPDATE teams SET slug = LOWER($1) WHERE id = $2', [slug, team.id]);
    }
  } 
}


export async function insertTeam(team: Omit<team, 'id'>, silent = false): Promise<team | null> {
  const { name, slug, description } = team;
  const result = await query(
    'INSERT INTO teams (name, slug, description) VALUES ($1, $2, $3) RETURNING id, name, slug, description',
    [name, slug, description],
    silent,
  );
  await updateTeamSlugs();
  const mapped = teamMapper(result?.rows[0]);

  return mapped;
  
}

export async function insertGame(
  gameData: Omit<game, 'id' | 'home' | 'away'> & { homename: number; awayname: number },
  silent = false,
): Promise<game | null> {
  const { date, homename, awayname, homescore, awayscore } = gameData;
  const result = await query(
    'INSERT INTO games (date, homename, awayname, homescore, awayscore) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [date, homename, awayname, homescore, awayscore],
    silent,
  );
  console.log(result);
    
  return result ? gameMapper(result.rows[0]) : null;
}

export async function getTeams(): Promise<Array<team> | null> {
  try {
    const result = await query('SELECT * FROM teams');
    if (!result || result.rows.length === 0) return null;
    return result.rows.map(teamMapper).filter((t): t is team => t !== null);
  } catch (error) {
    console.error('Error fetching teams:', error);
    return null;
  }
}

export async function getTeamBySlug(slug: string): Promise<team | null> {
  const queryText = 'SELECT * FROM teams WHERE slug = $1';
  const values = [slug]; 
  const result = await query(queryText, values);
  if (result && result.rows.length === 0) return null;
  return result ? teamMapper(result.rows[0]) : null;
}

export async function deleteTeamBySlug(slug: string): Promise<boolean> {
  const result = await query('DELETE FROM teams WHERE slug = $1 RETURNING *', [slug]);

  return (result?.rowCount ?? 0) > 0;
}

export async function getGamesByTeamId(id: number): Promise<Array<game>> {
  const result = await query('SELECT * FROM games WHERE home = $1 OR away = $1', [id]);

  if (!result || result.rows.length === 0) return [];

  return result.rows.map(gameMapper).filter((g): g is game => g !== null);
}

export async function updateTeamBySlug(slug: string, data: Partial<team>): Promise<team | null> {
  const { name, description } = data;
  const updates = [];
  const values = [];

  if (name) {
    updates.push(`name = $${updates.length + 2}`);
    values.push(name);
  }
  if (description) {
    updates.push(`description = $${updates.length + 2}`);
    values.push(description);
  }

  if (!updates.length) {
    throw new Error('No update fields provided');
  }

  const setClause = updates.join(', ');
  values.unshift(slug); 

  try {
    const pool = getPool();
    const result = await pool.query(`
      UPDATE teams
      SET ${setClause}
      WHERE slug = $1
      RETURNING *;
    `, values);

    if (result.rows.length === 0) return null;
    return result.rows[0];
  } catch (error) {
    console.error('Failed to update team by slug', error);
    throw error; 
  }
}



export async function getGames(): Promise<Array<game> | null> {
  const queryText = `
    SELECT 
      g.id, 
      g.date, 
      g.homescore, 
      g.awayscore, 
      homeTeam.name AS homeTeamName, 
      awayTeam.name AS awayTeamName
    FROM 
      games g
    INNER JOIN 
      teams homeTeam ON g.homename = homeTeam.id
    INNER JOIN 
      teams awayTeam ON g.awayname = awayTeam.id;
  `;

  const result = await query(queryText);
  
  if (!result || result.rows.length === 0) return null;

  
  const mappedGames = result.rows.map(row => ({
    id: row.id,
    date: row.date,
    homescore: row.homescore,
    awayscore: row.awayscore,
    homename: row.hometeamname, 
    awayname: row.awayteamname,  
  }));
  
  return mappedGames;
}

export async function deleteGameByGameId(gameId: number): Promise<boolean> {
  const result = await query('DELETE FROM games WHERE id = $1 RETURNING *', [gameId]);
  return (result?.rowCount ?? 0) > 0;
}

export async function updateGameByGameId(gameId: number, data: Partial<game>): Promise<game | null> {
  const updates = Object.entries(data).filter(([key, value]) => value !== undefined && ["date", "homename", "awayname", "homescore", "awayscore"].includes(key))
                      .map(([key], index) => `${key} = $${index + 1}`);
  if (!updates.length) {
      throw new Error('No update fields provided');
  }

  const values = [...Object.values(data).filter(value => value !== undefined), gameId];
  const queryText = `UPDATE games SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING *;`;

  try {
      const pool = getPool();
      const result = await pool.query(queryText, values);
      if (result.rows.length === 0) {
          return null; 
      }
      return gameMapper(result.rows[0]);
  } catch (error) {
      console.error('Failed to update game by ID', error);
      throw error;
  }
}


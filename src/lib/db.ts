import pg from 'pg';
import { teams, games } from '../types.js';
import {
  courseMapper,
  coursesMapper,
  departmentMapper,
  departmentsMapper,
} from './mappers.js';

let savedPool: pg.Pool | undefined;

export function getPool(): pg.Pool {
  if (savedPool) {
    return savedPool;
  }

  const { DATABASE_URL: connectionString } = process.env;
  if (!connectionString) {
    console.error('vantar DATABASE_URL í .env');
    throw new Error('missing DATABASE_URL');
  }

  savedPool = new pg.Pool({ connectionString });

  savedPool.on('error', (err) => {
    console.error('Villa í tengingu við gagnagrunn, forrit hættir', err);
    throw new Error('error in db connection');
  });

  return savedPool;
}

export async function query(
  q: string,
  values: Array<unknown> = [],
  silent = false,
) {
  const pool = getPool();

  let client;
  try {
    client = await pool.connect();
  } catch (e) {
    if (!silent) console.error('unable to get client from pool', e);
    return null;
  }

  try {
    const result = await client.query(q, values);
    return result;
  } catch (e) {
    if (!silent) console.error('unable to query', e);
    if (!silent) console.info(q, values);
    return null;
  } finally {
    client.release();
  }
}

export async function conditionalUpdate(
  table: 'department' | 'course',
  id: number,
  fields: Array<string | null>,
  values: Array<string | number | null>,
) {
  const filteredFields = fields.filter((i) => typeof i === 'string');
  const filteredValues = values.filter(
    (i): i is string | number => typeof i === 'string' || typeof i === 'number',
  );

  if (filteredFields.length === 0) {
    return false;
  }

  if (filteredFields.length !== filteredValues.length) {
    throw new Error('fields and values must be of equal length');
  }

  // id is field = 1
  const updates = filteredFields.map((field, i) => `${field} = $${i + 2}`);

  const q = `
    UPDATE ${table}
      SET ${updates.join(', ')}
    WHERE
      id = $1
    RETURNING *
    `;

  const queryValues: Array<string | number> = (
    [id] as Array<string | number>
  ).concat(filteredValues);
  const result = await query(q, queryValues);

  return result;
}

export async function poolEnd() {
  const pool = getPool();
  await pool.end();
}

export async function getTeams(): Promise<Array<teams> | null> {
  const result = await query('SELECT * FROM teams');

  if (!result) {
    return null;
  }

  const teams = teamsMapper(result.rows).map((d) => {
    delete d.courses;
    return d;
  });

  return teams;
}

export async function getDepartmentBySlug(
  slug: string,
): Promise<Department | null> {
  const result = await query('SELECT * FROM department WHERE slug = $1', [
    slug,
  ]);

  if (!result) {
    return null;
  }

  const department = departmentMapper(result.rows[0]);

  return department;
}

export async function deleteDepartmentBySlug(slug: string): Promise<boolean> {
  const result = await query('DELETE FROM department WHERE slug = $1', [slug]);

  if (!result) {
    return false;
  }

  return result.rowCount === 1;
}

export async function insertDepartment(
  department: Omit<Department, 'id'>,
  silent = false,
): Promise<Department | null> {
  const { title, slug, description } = department;
  const result = await query(
    'INSERT INTO department (title, slug, description) VALUES ($1, $2, $3) RETURNING id, title, slug, description, created, updated',
    [title, slug, description],
    silent,
  );

  const mapped = departmentMapper(result?.rows[0]);

  return mapped;
}

export async function insertCourse(
  course: Omit<Course, 'id'>,
  departmentId: number,
  silent = false,
): Promise<Course | null> {
  const { title, units, semester, level, url, courseId } = course;
  const result = await query(
    'INSERT INTO course (title, units, semester, level, url, department_id, course_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
    [title, units, semester, level, url, departmentId, courseId],
    silent,
  );

  const mapped = courseMapper(result?.rows[0]);

  return mapped;
}

export async function getCoursesByDepartmentId(
  id: number,
): Promise<Array<Course>> {
  const result = await query(`SELECT * FROM course WHERE department_id = $1`, [
    id,
  ]);

  if (!result) {
    return [];
  }

  const courses = coursesMapper(result.rows);

  return courses;
}

export async function getCourseByTitle(title: string): Promise<Course | null> {
  const result = await query(`SELECT * FROM course WHERE title = $1`, [title]);

  if (!result) {
    return null;
  }

  const course = courseMapper(result.rows[0]);
  console.log('title, course :>> ', result.rows[0], title, course);
  return course;
}

export async function getCourseByCourseId(
  courseId: string,
): Promise<Course | null> {
  const result = await query(`SELECT * FROM course WHERE course_id = $1`, [
    courseId,
  ]);

  if (!result) {
    return null;
  }

  const course = courseMapper(result.rows[0]);

  return course;
}

export async function deleteCourseByCourseId(
  courseId: string,
): Promise<boolean> {
  const result = await query('DELETE FROM course WHERE course_id = $1', [
    courseId,
  ]);

  if (!result) {
    return false;
  }

  return result.rowCount === 1;
}
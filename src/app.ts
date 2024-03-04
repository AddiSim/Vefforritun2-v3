import dotenv from 'dotenv';
import express, { NextFunction, Request, Response } from 'express';
import { router } from './routes/api.js';
import { cors } from './lib/cors.js';
import { testConnection } from './lib/db.js'; // Make sure this path is correct

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors);
app.use(router);

const port = process.env.PORT || 3000;

// Define an async function to start the application
async function startApp() {
  try {
    // Test database connection before starting the server
    await testConnection();

    // Start the server if the database connection is successful
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}/`);
    });
  } catch (error) {
    console.error('Failed to start the application due to a database connection error:', error);
    process.exit(1); // Exit the application if the database connection fails
  }
}

startApp(); // Call the startApp function to boot the application

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'not found' });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('error handling route', err);
  return res.status(500).json({ error: err.message ?? 'internal server error' });
});

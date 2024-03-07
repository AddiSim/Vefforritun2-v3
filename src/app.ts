import dotenv from 'dotenv';
import express, { NextFunction, Request, Response } from 'express';
import { router } from './routes/api.js'; 
import { cors } from './lib/cors.js'; 
import { testConnection } from './lib/db.js'; 

dotenv.config();

const app = express();

app.use((req, res, next) => {
  console.log(`Received ${req.method} request on ${req.path}`);
  next();
});

app.use(express.json());
app.use(cors);
app.use(router);

const port = process.env.PORT || 3000;

async function startApp() {
  try {
    await testConnection();
    console.log(`Server running at http://localhost:${port}/`);

    app.listen(port, () => {
      console.log(`Express server listening on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start the application due to a database connection error:', error);
    process.exit(1); 
  }
}


app.use((req: Request, res: Response) => {
  console.log(`No route matched. Sending 404 for request: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'not found' });
});


app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(`Error handling ${req.method} request to ${req.originalUrl}:`, err);
  if (!res.headersSent) {
    res.status(500).json({ error: err.message ?? 'internal server error' });
  }
});

startApp();

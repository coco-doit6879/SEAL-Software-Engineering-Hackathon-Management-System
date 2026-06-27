import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler';
import { ApiError } from './utils/ApiError';
import { setupSwagger } from './config/swagger';

const app = express();

// ─── Global Middlewares ─────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Swagger Documentation ─────────────────────────────────────────────────
setupSwagger(app);

// ─── Health Check ───────────────────────────────────────────────────────────
app.get('/api/v1', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to SEAL-HMS API (Software Engineering Hackathon Management System)',
    version: '1.0.0',
  });
});

// ─── API Routes ─────────────────────────────────────────────────────────────
app.use('/api/v1', routes);

// ─── Handle Unmatched Routes ────────────────────────────────────────────────
app.all('*', (req: Request, _res: Response, next: NextFunction) => {
  next(ApiError.notFound(`Cannot find ${req.method} ${req.originalUrl} on this server.`));
});

// ─── Global Error Handler ───────────────────────────────────────────────────
app.use(errorHandler);

export default app;

import express, { Request, Response } from 'express';

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Placeholder routes for features
// Example: app.use('/api/habits', habitsRouter);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

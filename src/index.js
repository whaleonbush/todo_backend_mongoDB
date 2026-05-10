import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import todosRouter from './routes/todos.js';

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/todo';

const corsOptions = {
  origin: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
  maxAge: 86400,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Todo backend is running' });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

app.use('/api/todos', todosRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    const { host, port, name } = mongoose.connection;
    console.log(
      `몽고디비 연결 성공 (host: ${host}, port: ${port}, db: ${name})`
    );

    app.listen(PORT, () => {
      console.log(`서버 실행 중 - http://localhost:${PORT} (port: ${PORT})`);
    });
  } catch (err) {
    console.error('몽고디비 연결 실패:', err.message);
    process.exit(1);
  }
}

start();

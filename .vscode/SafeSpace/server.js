import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './db.js';
import authRoutes from './auth.js';
import usersRoutes from './users.js';
import messagesRoutes from './messages.js';
import postsRoutes from './posts.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Initialize database
await initializeDatabase();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/posts', postsRoutes);

// Test endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running ✅' });
});

// Serve HTML files
app.get('/', (req, res) => {
  res.sendFile('index.html', { root: '.' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════╗
║  🌿 SafeSpace Server Started  🌿  ║
║  🚀 http://localhost:${PORT}      ║
╚═══════════════════════════════════╝
  `);
});

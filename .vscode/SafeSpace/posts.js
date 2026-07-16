import express from 'express';
import pool from './db.js';
import authenticateToken from './middleware.js';

const router = express.Router();

// Create post
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { content } = req.body;
    const userId = req.user.id;

    if (!content) {
      return res.status(400).json({ error: 'Content required' });
    }

    const result = await pool.query(
      `INSERT INTO posts (user_id, content) 
       VALUES ($1, $2) 
       RETURNING id, user_id, content, likes, created_at`,
      [userId, content]
    );

    res.json({ message: 'Post created', post: result.rows[0] });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Get all posts (feed)
router.get('/feed', async (req, res) => {
  try {
    const limit = req.query.limit || 20;

    const result = await pool.query(
      `SELECT p.id, p.user_id, p.content, p.likes, p.created_at, 
              u.username, u.bio, u.anxiety_type
       FROM posts p
       JOIN users u ON p.user_id = u.id
       ORDER BY p.created_at DESC
       LIMIT $1`,
      [limit]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({ error: 'Failed to get feed' });
  }
});

// Get user's posts
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `SELECT p.id, p.user_id, p.content, p.likes, p.created_at
       FROM posts p
       WHERE p.user_id = $1
       ORDER BY p.created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ error: 'Failed to get posts' });
  }
});

// Like post
router.post('/:postId/like', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;

    const result = await pool.query(
      `UPDATE posts SET likes = likes + 1 WHERE id = $1 
       RETURNING id, likes`,
      [postId]
    );

    res.json({ message: 'Post liked', post: result.rows[0] });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ error: 'Failed to like post' });
  }
});

export default router;

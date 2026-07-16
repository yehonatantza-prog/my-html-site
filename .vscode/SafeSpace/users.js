import express from 'express';
import pool from './db.js';
import authenticateToken from './middleware.js';

const router = express.Router();

// Get all users (with search)
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    let query = 'SELECT id, username, bio, anxiety_type, created_at FROM users';
    let params = [];

    if (q) {
      query += ' WHERE username ILIKE $1 OR bio ILIKE $1';
      params = [`%${q}%`];
    }

    query += ' LIMIT 20';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Get user profile
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const userResult = await pool.query(
      'SELECT id, username, bio, anxiety_type, created_at FROM users WHERE id = $1',
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Get user's posts
    const postsResult = await pool.query(
      'SELECT id, content, likes, created_at FROM posts WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10',
      [id]
    );

    res.json({ ...user, posts: postsResult.rows });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Get current user profile
router.get('/me/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, bio, anxiety_type, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Update user profile
router.put('/me/update', authenticateToken, async (req, res) => {
  try {
    const { bio, anxiety_type } = req.body;

    const result = await pool.query(
      'UPDATE users SET bio = $1, anxiety_type = $2 WHERE id = $3 RETURNING id, username, email, bio, anxiety_type',
      [bio || '', anxiety_type || '', req.user.id]
    );

    res.json({ message: 'Profile updated', user: result.rows[0] });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;

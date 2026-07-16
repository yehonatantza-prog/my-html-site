import express from 'express';
import pool from './db.js';
import authenticateToken from './middleware.js';

const router = express.Router();

// Send message
router.post('/send', authenticateToken, async (req, res) => {
  try {
    const { receiver_id, content } = req.body;
    const sender_id = req.user.id;

    if (!receiver_id || !content) {
      return res.status(400).json({ error: 'Missing receiver_id or content' });
    }

    // Create or get conversation
    const convResult = await pool.query(
      `INSERT INTO conversations (user1_id, user2_id) 
       VALUES (LEAST($1, $2), GREATEST($1, $2))
       ON CONFLICT (user1_id, user2_id) DO UPDATE SET last_message_at = CURRENT_TIMESTAMP
       RETURNING id`,
      [sender_id, receiver_id]
    );

    // Insert message
    const msgResult = await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, content) 
       VALUES ($1, $2, $3) 
       RETURNING id, sender_id, receiver_id, content, created_at`,
      [sender_id, receiver_id, content]
    );

    res.json({ message: 'Message sent', data: msgResult.rows[0] });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get conversations
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT 
        CASE WHEN user1_id = $1 THEN user2_id ELSE user1_id END as other_user_id,
        u.username, u.bio,
        (SELECT content FROM messages 
         WHERE (sender_id = $1 AND receiver_id = CASE WHEN user1_id = $1 THEN user2_id ELSE user1_id END)
         OR (sender_id = CASE WHEN user1_id = $1 THEN user2_id ELSE user1_id END AND receiver_id = $1)
         ORDER BY created_at DESC LIMIT 1) as last_message,
        c.last_message_at
       FROM conversations c
       JOIN users u ON (u.id = CASE WHEN c.user1_id = $1 THEN c.user2_id ELSE c.user1_id END)
       WHERE user1_id = $1 OR user2_id = $1
       ORDER BY c.last_message_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
});

// Get messages with a user
router.get('/with/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    const result = await pool.query(
      `SELECT m.id, m.sender_id, m.receiver_id, m.content, m.created_at, 
              u.username as sender_name
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE (sender_id = $1 AND receiver_id = $2) 
          OR (sender_id = $2 AND receiver_id = $1)
       ORDER BY created_at ASC`,
      [currentUserId, userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

export default router;

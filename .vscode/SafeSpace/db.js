import pkg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pkg;
dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
};

const dbName = process.env.DB_NAME || 'safespace';

const realPool = new Pool({
  ...dbConfig,
  database: dbName,
});

const memoryState = {
  users: [],
  posts: [],
  messages: [],
  conversations: [],
};

let useMemoryStore = false;

function isMemoryFallbackError(error) {
  return Boolean(
    error && (
      error.code === '3D000' ||
      error.code === 'ECONNREFUSED' ||
      error.code === '28P01' ||
      error.message?.includes('does not exist') ||
      error.message?.includes('connect') ||
      error.message?.includes('ENOTFOUND')
    )
  );
}

function toTimestamp() {
  return new Date().toISOString();
}

function getUserById(userId) {
  return memoryState.users.find((user) => user.id === Number(userId));
}

function buildUserRow(user) {
  return { ...user, created_at: user.created_at || toTimestamp() };
}

async function handleMemoryQuery(text, params = []) {
  const normalized = text.trim().replace(/\s+/g, ' ').toLowerCase();

  if (normalized.includes('create table if not exists')) {
    return { rows: [], rowCount: 0 };
  }

  if (normalized.includes('select * from users where email = $1 or username = $2')) {
    const [email, username] = params;
    const rows = memoryState.users.filter(
      (user) => user.email === email || user.username === username
    );
    return { rows: rows.map(buildUserRow), rowCount: rows.length };
  }

  if (normalized.includes('select * from users where email = $1')) {
    const [email] = params;
    const rows = memoryState.users.filter((user) => user.email === email);
    return { rows: rows.map(buildUserRow), rowCount: rows.length };
  }

  if (normalized.includes('select id, username, bio, anxiety_type, created_at from users where id = $1')) {
    const [id] = params;
    const rows = memoryState.users.filter((user) => user.id === Number(id));
    return { rows: rows.map(buildUserRow), rowCount: rows.length };
  }

  if (normalized.includes('select id, username, bio, anxiety_type, created_at from users')) {
    const rows = memoryState.users.map(buildUserRow);
    return { rows, rowCount: rows.length };
  }

  if (normalized.includes('insert into users')) {
    const [username, email, password, anxietyType, bio] = params;
    const user = {
      id: memoryState.users.length + 1,
      username,
      email,
      password,
      bio: bio || 'Welcome to SafeSpace! 🌿',
      avatar_url: null,
      anxiety_type: anxietyType || null,
      created_at: toTimestamp(),
    };
    memoryState.users.push(user);
    return {
      rows: [{ id: user.id, username: user.username, email: user.email, anxiety_type: user.anxiety_type }],
      rowCount: 1,
    };
  }

  if (normalized.includes('update users set bio = $1, anxiety_type = $2 where id = $3 returning id, username, email, bio, anxiety_type')) {
    const [bio, anxietyType, userId] = params;
    const user = memoryState.users.find((entry) => entry.id === Number(userId));
    if (!user) {
      return { rows: [], rowCount: 0 };
    }
    user.bio = bio || '';
    user.anxiety_type = anxietyType || '';
    return {
      rows: [{ id: user.id, username: user.username, email: user.email, bio: user.bio, anxiety_type: user.anxiety_type }],
      rowCount: 1,
    };
  }

  if (normalized.includes('insert into posts')) {
    const [userId, content] = params;
    const post = {
      id: memoryState.posts.length + 1,
      user_id: Number(userId),
      content,
      likes: 0,
      created_at: toTimestamp(),
    };
    memoryState.posts.push(post);
    return { rows: [post], rowCount: 1 };
  }

  if (normalized.includes('select p.id, p.user_id, p.content, p.likes, p.created_at, u.username, u.bio, u.anxiety_type from posts p join users u on p.user_id = u.id')) {
    const limit = Number(params[0] || 20);
    const rows = memoryState.posts
      .slice()
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit)
      .map((post) => {
        const user = getUserById(post.user_id);
        return {
          id: post.id,
          user_id: post.user_id,
          content: post.content,
          likes: post.likes,
          created_at: post.created_at,
          username: user?.username || 'Unknown',
          bio: user?.bio || '',
          anxiety_type: user?.anxiety_type || null,
        };
      });
    return { rows, rowCount: rows.length };
  }

  if (normalized.includes('select p.id, p.user_id, p.content, p.likes, p.created_at from posts p where p.user_id = $1')) {
    const [userId] = params;
    const rows = memoryState.posts
      .filter((post) => post.user_id === Number(userId))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map((post) => ({ ...post }));
    return { rows, rowCount: rows.length };
  }

  if (normalized.includes('update posts set likes = likes + 1 where id = $1 returning id, likes')) {
    const [postId] = params;
    const post = memoryState.posts.find((entry) => entry.id === Number(postId));
    if (!post) {
      return { rows: [], rowCount: 0 };
    }
    post.likes += 1;
    return { rows: [{ id: post.id, likes: post.likes }], rowCount: 1 };
  }

  if (normalized.includes('insert into conversations')) {
    const [senderId, receiverId] = params;
    const normalizedPair = [Number(senderId), Number(receiverId)].sort((a, b) => a - b);
    const existing = memoryState.conversations.find(
      (conversation) =>
        conversation.user1_id === normalizedPair[0] && conversation.user2_id === normalizedPair[1]
    );
    if (existing) {
      existing.last_message_at = toTimestamp();
      return { rows: [{ id: existing.id }], rowCount: 1 };
    }
    const conversation = {
      id: memoryState.conversations.length + 1,
      user1_id: normalizedPair[0],
      user2_id: normalizedPair[1],
      last_message_at: toTimestamp(),
    };
    memoryState.conversations.push(conversation);
    return { rows: [{ id: conversation.id }], rowCount: 1 };
  }

  if (normalized.includes('insert into messages')) {
    const [senderId, receiverId, content] = params;
    const message = {
      id: memoryState.messages.length + 1,
      sender_id: Number(senderId),
      receiver_id: Number(receiverId),
      content,
      created_at: toTimestamp(),
      read: false,
    };
    memoryState.messages.push(message);
    return {
      rows: [{ id: message.id, sender_id: message.sender_id, receiver_id: message.receiver_id, content: message.content, created_at: message.created_at }],
      rowCount: 1,
    };
  }

  if (normalized.includes('select case when user1_id = $1 then user2_id else user1_id end as other_user_id')) {
    const [userId] = params;
    const rows = memoryState.conversations
      .filter((conversation) => conversation.user1_id === Number(userId) || conversation.user2_id === Number(userId))
      .map((conversation) => {
        const otherUserId = conversation.user1_id === Number(userId) ? conversation.user2_id : conversation.user1_id;
        const otherUser = getUserById(otherUserId);
        const lastMessage = memoryState.messages
          .filter((message) =>
            (message.sender_id === Number(userId) && message.receiver_id === otherUserId) ||
            (message.sender_id === otherUserId && message.receiver_id === Number(userId))
          )
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
        return {
          other_user_id: otherUserId,
          username: otherUser?.username || 'Unknown',
          bio: otherUser?.bio || '',
          last_message: lastMessage?.content || null,
          last_message_at: conversation.last_message_at,
        };
      });
    return { rows, rowCount: rows.length };
  }

  if (normalized.includes('select m.id, m.sender_id, m.receiver_id, m.content, m.created_at, u.username as sender_name')) {
    const [currentUserId, userId] = params;
    const rows = memoryState.messages
      .filter((message) =>
        (message.sender_id === Number(currentUserId) && message.receiver_id === Number(userId)) ||
        (message.sender_id === Number(userId) && message.receiver_id === Number(currentUserId))
      )
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .map((message) => ({
        id: message.id,
        sender_id: message.sender_id,
        receiver_id: message.receiver_id,
        content: message.content,
        created_at: message.created_at,
        sender_name: getUserById(message.sender_id)?.username || 'Unknown',
      }));
    return { rows, rowCount: rows.length };
  }

  throw new Error(`Unsupported memory query: ${text}`);
}

async function createDatabaseIfNotExists() {
  const adminPool = new Pool({
    ...dbConfig,
    database: 'postgres',
  });

  try {
    const { rows } = await adminPool.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName]
    );

    if (rows.length === 0) {
      const safeDbName = dbName.replace(/"/g, '""');
      await adminPool.query(`CREATE DATABASE "${safeDbName}"`);
      console.log(`✅ Created database ${dbName}`);
    }
  } catch (error) {
    if (error.message && error.message.includes('already exists')) {
      console.log(`ℹ️ Database ${dbName} already exists`);
    } else {
      console.error('❌ Database creation error:', error);
      throw error;
    }
  } finally {
    await adminPool.end();
  }
}

async function query(text, params = []) {
  if (useMemoryStore) {
    return handleMemoryQuery(text, params);
  }

  try {
    return await realPool.query(text, params);
  } catch (error) {
    if (isMemoryFallbackError(error)) {
      useMemoryStore = true;
      console.log('⚠️ PostgreSQL unavailable; using in-memory storage for SafeSpace.');
      return handleMemoryQuery(text, params);
    }
    throw error;
  }
}

// Create tables if they don't exist
export async function initializeDatabase() {
  try {
    await createDatabaseIfNotExists();
    await query('SELECT 1');

    // Users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        bio TEXT,
        avatar_url VARCHAR(255),
        anxiety_type VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Posts table
    await query(`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        likes INTEGER DEFAULT 0
      )
    `);

    // Messages table
    await query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Conversations table (to group messages)
    await query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id SERIAL PRIMARY KEY,
        user1_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        user2_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user1_id, user2_id)
      )
    `);

    console.log('✅ Database tables initialized');
  } catch (error) {
    if (isMemoryFallbackError(error)) {
      useMemoryStore = true;
      console.log('⚠️ PostgreSQL unavailable; using in-memory storage for SafeSpace.');
      return;
    }
    console.error('❌ Database initialization error:', error);
    throw error;
  }
}

const pool = {
  query,
  end: async () => realPool.end(),
};

export default pool;

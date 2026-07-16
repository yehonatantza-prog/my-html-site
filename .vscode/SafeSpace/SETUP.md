# SafeSpace - Full Stack Mental Health Support Community

## 🌿 Project Overview

SafeSpace is a comprehensive web-based mental health support community designed for people navigating anxiety, trauma, and mental health challenges. It features user authentication, real-time messaging, community posts, and educational resources.

## ⚙️ Tech Stack

**Frontend:**
- HTML5, CSS3, JavaScript
- Responsive design with CSS Grid and Flexbox
- Client-side API wrapper (api.js)

**Backend:**
- Node.js with Express.js
- PostgreSQL database
- JWT authentication with bcrypt
- REST API architecture

## 📋 Setup & Installation

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm

### Database Setup

1. Create a PostgreSQL database:
```sql
CREATE DATABASE safespace;
```

2. Set up environment variables in `.env`:
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=safespace
JWT_SECRET=your_jwt_secret_key_change_this
PORT=5000
NODE_ENV=development
```

3. Run the server once to auto-create tables:
```bash
node server.js
```

### Installation Steps

1. Navigate to the SafeSpace directory:
```bash
cd SafeSpace
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```
Or for development with auto-reload:
```bash
npm run dev
```

4. Open your browser and navigate to:
```
http://localhost:5000
```

## 🚀 Features

### Authentication
- User registration with email and password
- Secure login with JWT tokens
- Password hashing with bcrypt
- Session management in localStorage

### User Profiles
- Customizable bio and anxiety type selection
- Profile viewing for all users
- Public profile pages with user posts

### Messaging System
- Send direct messages to other users
- View conversation history
- Real-time conversation list
- Search users to start new conversations

### Community Posts
- Create and share posts in the community
- Like posts from other users
- View community feed with all posts
- Profile-specific post views

### People Discovery
- Search users by username or bio
- View user profiles before messaging
- Start conversations directly from search results

### Educational Resources
- Anxiety education and information
- Grounding techniques guide
- Daily wellness tips
- Crisis support hotlines by country
- Celebration of personal wins

## 📁 Project Structure

```
SafeSpace/
├── index.html              # Home/Login page
├── chats.html              # Messaging interface
├── MyPage.html             # User profile & posts
├── Social.html             # Community feed
├── Videos.html             # Video library
├── Resources.html          # Support resources
├── Understanding.html      # Anxiety education
├── Grounding.html          # Coping techniques
├── DailyTips.html          # Wellness routines
├── AnxietyTypes.html       # Type-specific support
├── Crisis.html             # Crisis resources
├── CelebrationWins.html    # Celebrate progress
├── About.html              # Mission & values
├── Sitemap.html            # Navigation guide
│
├── styles.css              # Complete styling system
├── api.js                  # Client-side API wrapper
│
├── server.js               # Express server entry point
├── db.js                   # PostgreSQL connection & schema
├── middleware.js           # JWT authentication
├── auth.js                 # Authentication routes
├── users.js                # User profile routes
├── messages.js             # Messaging routes
├── posts.js                # Posts routes
│
├── package.json            # Dependencies
├── .env                    # Environment variables
└── README.md              # This file
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Create new user
- `POST /api/auth/login` - User login

### Users
- `GET /api/users/search?q=query` - Search users
- `GET /api/users/:id` - Get user profile
- `GET /api/users/me/profile` - Get current user profile (protected)
- `PUT /api/users/me/update` - Update profile (protected)

### Messages
- `POST /api/messages/send` - Send message (protected)
- `GET /api/messages/conversations` - Get user conversations (protected)
- `GET /api/messages/with/:userId` - Get messages with specific user (protected)

### Posts
- `POST /api/posts/create` - Create new post (protected)
- `GET /api/posts/feed` - Get community feed
- `GET /api/posts/user/:userId` - Get user's posts
- `POST /api/posts/:postId/like` - Like a post (protected)

## 🔐 Security Features

- Password hashing with bcrypt (10 salt rounds)
- JWT authentication with 7-day expiration
- Environment variables for sensitive data
- Parameterized database queries (SQL injection prevention)
- CORS enabled for API access
- Protected routes with authentication middleware

## 🎨 Design System

**Color Palette:**
- Primary: Purple #667eea to #764ba2
- Accent: Pink #f093fb to #f5576c
- Cyan: #4facfe to #00f2fe
- Gold: #ffeaa7 to #fdcb6e
- Neutral: White background with gray text

**Typography:**
- System fonts: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto
- Sizes: 42px (h1), 26px (h2), 20px (h3), 16px (body), 14px (small)

**Components:**
- Fixed sidebar navigation (100px width)
- Card-based layout with 5px colored left borders
- Responsive grid (auto-fit with minmax)
- Smooth transitions (cubic-bezier(0.34, 1.56, 0.64, 1))

## 🎯 Target Audience

SafeSpace is designed for people experiencing:
- General anxiety disorders
- Social anxiety
- Panic attacks
- PTSD and trauma
- Other mental health challenges
- Anyone seeking mental health support and community

## 🤝 Community Guidelines

- Be kind and compassionate to yourself and others
- Respect boundaries and privacy
- No judgment - everyone's journey is unique
- Maintain confidentiality of personal information
- No harmful, hateful, or discriminatory content
- Seek professional help for crisis situations

## 📱 Responsive Design

- Mobile-first approach
- Breakpoint at 768px for tablets/desktop
- Collapsible sidebar on smaller screens
- Touch-friendly button sizes
- Optimized typography scaling

## 🔧 Troubleshooting

**Cannot connect to database:**
- Verify PostgreSQL is running
- Check database connection credentials in .env
- Ensure database name matches in .env

**Port already in use:**
- Change PORT in .env file
- Or kill the process using port 5000

**Module not found:**
- Run `npm install` to install dependencies
- Check that all files are in the correct directories

**Token errors on login:**
- Clear browser localStorage and retry login
- Verify JWT_SECRET is set in .env

## 📈 Future Enhancements

- Real-time notifications with Socket.io
- Video upload and streaming capabilities
- User verification system
- Advanced search and filtering
- In-app notifications
- Admin dashboard
- Content moderation tools
- Mobile app (React Native)
- Two-factor authentication
- Email verification

## 📄 License

This project is designed for mental health support. Please ensure compliance with local healthcare regulations if deploying in production.

## 🆘 Crisis Resources

If you or someone you know is in crisis:
- **US**: National Suicide Prevention Lifeline: 988
- **US**: Crisis Text Line: Text HOME to 741741
- **International**: Visit findahelpline.com

Remember: Seeking help is a sign of strength, not weakness.

---

Built with 💜 for mental health support and community compassion.

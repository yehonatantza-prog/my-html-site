const API_URL = 'http://localhost:5000/api';

// Auth Functions
async function register(username, email, password, anxiety_type) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password, anxiety_type })
  });
  const data = await response.json();
  if (response.ok) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  }
  return data;
}

async function login(email, password) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  if (response.ok) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  }
  return data;
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/index.html';
}

function getToken() {
  return localStorage.getItem('token');
}

function getCurrentUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

function isLoggedIn() {
  return !!getToken();
}

// Headers with auth
function getAuthHeaders() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

// Users Functions
async function searchUsers(query) {
  const response = await fetch(`${API_URL}/users/search?q=${encodeURIComponent(query)}`);
  return response.json();
}

async function getUserProfile(userId) {
  const response = await fetch(`${API_URL}/users/${userId}`);
  return response.json();
}

async function getMyProfile() {
  const response = await fetch(`${API_URL}/users/me/profile`, {
    headers: getAuthHeaders()
  });
  return response.json();
}

async function updateProfile(bio, anxiety_type) {
  const response = await fetch(`${API_URL}/users/me/update`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ bio, anxiety_type })
  });
  return response.json();
}

// Messages Functions
async function sendMessage(receiver_id, content) {
  const response = await fetch(`${API_URL}/messages/send`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ receiver_id, content })
  });
  return response.json();
}

async function getConversations() {
  const response = await fetch(`${API_URL}/messages/conversations`, {
    headers: getAuthHeaders()
  });
  return response.json();
}

async function getMessagesWith(userId) {
  const response = await fetch(`${API_URL}/messages/with/${userId}`, {
    headers: getAuthHeaders()
  });
  return response.json();
}

// Posts Functions
async function createPost(content) {
  const response = await fetch(`${API_URL}/posts/create`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ content })
  });
  return response.json();
}

async function getFeed() {
  const response = await fetch(`${API_URL}/posts/feed`);
  return response.json();
}

async function getUserPosts(userId) {
  const response = await fetch(`${API_URL}/posts/user/${userId}`);
  return response.json();
}

async function likePost(postId) {
  const response = await fetch(`${API_URL}/posts/${postId}/like`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  return response.json();
}

// Export for use in HTML
if (typeof window !== 'undefined') {
  window.SafeSpaceAPI = {
    // Auth
    register, login, logout, isLoggedIn, getCurrentUser, getToken,
    // Users
    searchUsers, getUserProfile, getMyProfile, updateProfile,
    // Messages
    sendMessage, getConversations, getMessagesWith,
    // Posts
    createPost, getFeed, getUserPosts, likePost
  };
}

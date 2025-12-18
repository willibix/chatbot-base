const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1';

interface ApiError {
  detail: string;
}

async function fetchWithAuth(
  endpoint: string,
  options: RequestInit = {},
): Promise<Response> {
  const accessToken = localStorage.getItem('accessToken');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (accessToken) {
    (headers as Record<string, string>).Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle token refresh if needed
  if (response.status === 401) {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (refreshResponse.ok) {
        const tokens = (await refreshResponse.json()) as {
          access_token: string;
          refresh_token: string;
        };
        localStorage.setItem('accessToken', tokens.access_token);
        localStorage.setItem('refreshToken', tokens.refresh_token);

        // Retry the original request
        (headers as Record<string, string>).Authorization = `Bearer ${tokens.access_token}`;
        return fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
      }
    }

    // Clear tokens if refresh fails
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  return response;
}

// Auth API
export async function login(username: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const error = (await response.json()) as ApiError;
    throw new Error(error.detail || 'Login failed');
  }

  return response.json() as Promise<{
    access_token: string;
    refresh_token: string;
    token_type: string;
  }>;
}

export async function register(email: string, username: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, username, password }),
  });

  if (!response.ok) {
    const error = (await response.json()) as ApiError;
    throw new Error(error.detail || 'Registration failed');
  }

  return response.json() as Promise<{
    id: string;
    email: string;
    username: string;
    created_at: string;
  }>;
}

export async function getCurrentUser() {
  const response = await fetchWithAuth('/auth/me');

  if (!response.ok) {
    throw new Error('Failed to get current user');
  }

  return response.json() as Promise<{
    id: string;
    email: string;
    username: string;
    created_at: string;
  }>;
}

// Chat API
export async function getChatSessions() {
  const response = await fetchWithAuth('/chat/sessions');

  if (!response.ok) {
    throw new Error('Failed to get chat sessions');
  }

  return response.json() as Promise<
    Array<{
      id: string;
      user_id: string;
      title: string | null;
      created_at: string;
      updated_at: string;
    }>
  >;
}

export async function createChatSession(title?: string) {
  const response = await fetchWithAuth('/chat/sessions', {
    method: 'POST',
    body: JSON.stringify({ title }),
  });

  if (!response.ok) {
    throw new Error('Failed to create chat session');
  }

  return response.json() as Promise<{
    id: string;
    user_id: string;
    title: string | null;
    created_at: string;
    updated_at: string;
  }>;
}

export async function getChatSession(sessionId: string) {
  const response = await fetchWithAuth(`/chat/sessions/${sessionId}`);

  if (!response.ok) {
    throw new Error('Failed to get chat session');
  }

  return response.json() as Promise<{
    id: string;
    user_id: string;
    title: string | null;
    created_at: string;
    updated_at: string;
    messages: Array<{
      id: string;
      chat_session_id: string;
      content: string;
      role: 'user' | 'assistant' | 'system';
      created_at: string;
    }>;
  }>;
}

export async function deleteChatSession(sessionId: string) {
  const response = await fetchWithAuth(`/chat/sessions/${sessionId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete chat session');
  }
}

export async function sendMessage(sessionId: string, content: string) {
  const response = await fetchWithAuth(`/chat/sessions/${sessionId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    throw new Error('Failed to send message');
  }

  return response.json() as Promise<{
    id: string;
    chat_session_id: string;
    content: string;
    role: 'user' | 'assistant' | 'system';
    created_at: string;
  }>;
}

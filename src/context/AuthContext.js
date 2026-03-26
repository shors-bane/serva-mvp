import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────
const API_URL = process.env.REACT_APP_API_URL || 'https://serva-backend.onrender.com';

// Single source of truth for auth state shape.
// We deliberately do NOT optimistically read userRole from localStorage here;
// role is derived from the decoded JWT returned by the /me endpoint so there
// is no mismatch between token claims and localStorage.
const initialState = {
  user: null,          // Full user object from API
  token: null,         // Raw JWT string
  isAuthenticated: false,
  isLoading: true,     // true until hydration resolves on mount
  error: null,
};

// ─── Reducer ─────────────────────────────────────────────────────────────────
const AUTH_ACTIONS = {
  HYDRATE_START:  'HYDRATE_START',
  HYDRATE_SUCCESS:'HYDRATE_SUCCESS',
  HYDRATE_FAILURE:'HYDRATE_FAILURE',
  LOGIN_SUCCESS:  'LOGIN_SUCCESS',
  LOGOUT:         'LOGOUT',
  UPDATE_USER:    'UPDATE_USER',
  CLEAR_ERROR:    'CLEAR_ERROR',
  SET_ERROR:      'SET_ERROR',
};

const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.HYDRATE_START:
      return { ...state, isLoading: true, error: null };

    case AUTH_ACTIONS.HYDRATE_SUCCESS:
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.HYDRATE_FAILURE:
      // Token was present but invalid / network down – clear everything cleanly.
      return { ...initialState, isLoading: false };

    case AUTH_ACTIONS.LOGOUT:
      return { ...initialState, isLoading: false };

    case AUTH_ACTIONS.UPDATE_USER:
      return { ...state, user: { ...state.user, ...action.payload } };

    case AUTH_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, isLoading: false };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };

    default:
      return state;
  }
};

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  /**
   * Persist or remove the JWT from localStorage.
   * This is the ONLY place we touch localStorage for tokens.
   */
  const persistToken = (token) => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  };

  /**
   * Hydrate auth state from an existing JWT in localStorage.
   *
   * Architecture decision: we always validate the token against the /me
   * endpoint on mount.  This handles the case where the token has been
   * revoked or the user was deactivated server-side.  We accept the ~200ms
   * loading state (spinner in ProtectedRoute) as the correct UX rather than
   * showing stale optimistic data that then crashes.
   */
  const hydrateFromToken = useCallback(async () => {
    const token = localStorage.getItem('token');

    // No token → resolve immediately as unauthenticated.
    if (!token) {
      dispatch({ type: AUTH_ACTIONS.HYDRATE_FAILURE });
      return;
    }

    dispatch({ type: AUTH_ACTIONS.HYDRATE_START });

    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        dispatch({
          type: AUTH_ACTIONS.HYDRATE_SUCCESS,
          payload: { user: data.data.user, token },
        });
      } else {
        // Token rejected by server (expired, invalid, user deleted).
        persistToken(null);
        dispatch({ type: AUTH_ACTIONS.HYDRATE_FAILURE });
      }
    } catch {
      // Network error: we cannot confirm the token is valid.
      // Fail secure – clear state until next successful verification.
      persistToken(null);
      dispatch({ type: AUTH_ACTIONS.HYDRATE_FAILURE });
    }
  }, []);

  // Run hydration exactly once on initial mount.
  useEffect(() => {
    hydrateFromToken();
  }, [hydrateFromToken]);

  // ─── Auth Actions ───────────────────────────────────────────────────────────

  /**
   * Email / password login.
   * Returns { success: true, user } or { success: false, error: string }.
   */
  const login = async (email, password) => {
    if (!email || !password) {
      const error = 'Email and password are required';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: error });
      return { success: false, error };
    }

    dispatch({ type: AUTH_ACTIONS.HYDRATE_START }); // reuse loading flag

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        persistToken(data.token);
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { user: data.user, token: data.token },
        });
        return { success: true, user: data.user };
      }

      const error = data.message || 'Login failed';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: error });
      return { success: false, error };
    } catch (err) {
      const error =
        err.name === 'AbortError'
          ? 'Request timed out. Please try again.'
          : 'Network error. Please check your connection.';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: error });
      return { success: false, error };
    }
  };

  /**
   * New user registration.
   */
  const register = async (userData) => {
    dispatch({ type: AUTH_ACTIONS.HYDRATE_START });

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const token = data.token || data.data?.token;
        const user  = data.user  || data.data?.user;

        if (token && user) {
          persistToken(token);
          dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: { user, token } });
          return { success: true, user };
        }
      }

      const error = data.message || 'Registration failed';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: error });
      return { success: false, error };
    } catch {
      const error = 'Network error during registration';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: error });
      return { success: false, error };
    }
  };

  /**
   * Logout – always clear local state even if the server call fails.
   */
  const logout = async () => {
    const token = localStorage.getItem('token');
    try {
      if (token) {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch {
      // Best-effort server logout; client state is cleared regardless.
    } finally {
      persistToken(null);
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  /**
   * Patch user fields in state after a successful profile update.
   * The calling component is responsible for the API call.
   */
  const updateUser = (updatedFields) => {
    dispatch({ type: AUTH_ACTIONS.UPDATE_USER, payload: updatedFields });
  };

  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateUser,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ─── Hook ──────────────────────────────────────────────────────────────────────
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

import { useCallback, useEffect, useState } from "react";
import { AuthContext } from "./authContext";
import {
  getCurrentUser,
  refreshAccessToken,
  logoutUser as logoutApi,
} from "../services/authService";
import {
  setApiAccessToken,
  setAuthCallbacks,
} from "../services/api";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const login = useCallback((userData, token) => {
    if (!userData || !token) {
      throw new Error("User data and access token are required.");
    }

    setApiAccessToken(token);
    setUser(userData);
    setAccessToken(token);
    setIsAuthenticated(true);
    setIsLoading(false);
  }, []);

  const clearAuthState = useCallback(() => {
    setApiAccessToken(null);
    setUser(null);
    setAccessToken(null);
    setIsAuthenticated(false);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      clearAuthState();
    }
  }, [clearAuthState]);

  // Keep Axios token refreshes synchronized with React state.
  useEffect(() => {
    setAuthCallbacks({
      onTokenRefreshed: (newToken) => {
        setAccessToken(newToken);
      },
      onAuthExpired: () => {
        clearAuthState();
      },
    });

    return () => {
      setAuthCallbacks({});
    };
  }, [clearAuthState]);

  // Restore the user's session when the application loads.
  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      try {
        const tokenResult = await refreshAccessToken();
        const token = tokenResult?.accessToken;

        if (!token) {
          throw new Error("No access token returned.");
        }

        // Set token before requesting the user profile.
        setApiAccessToken(token);

        const userResult = await getCurrentUser(token);
        const restoredUser = userResult?.user;

        if (!restoredUser) {
          throw new Error("Unable to restore user session.");
        }

        if (!cancelled) {
          setAccessToken(token);
          setUser(restoredUser);
          setIsAuthenticated(true);
        }
      } catch (error) {
        if (!cancelled) {
          clearAuthState();
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, [clearAuthState]);

  const value = {
    user,
    accessToken,
    isAuthenticated,
    isLoading,
    login,
    logout,
    setUser,
    setAccessToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
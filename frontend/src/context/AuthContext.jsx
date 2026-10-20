import { useCallback, useEffect, useState } from "react";
import { AuthContext } from "./authContext";
import {
  getCurrentUser,
  refreshAccessToken,
  logoutUser as logoutApi,
} from "../services/authService";
import { setApiAccessToken } from "../services/api";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Keep React state and the Axios request token synchronized.
  const login = useCallback((userData, token) => {
    if (!userData || !token) {
      throw new Error("User data and access token are required.");
    }

    setApiAccessToken(token);
    setUser(userData);
    setAccessToken(token);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      // Always clear local authentication, even if the server is unavailable.
      setApiAccessToken(null);
      setUser(null);
      setAccessToken(null);
      setIsAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      try {
        const tokenResult = await refreshAccessToken();
        const token = tokenResult?.accessToken;

        if (!token) {
          throw new Error("No access token returned.");
        }

        const userResult = await getCurrentUser(token);
        const restoredUser = userResult?.user;

        if (!restoredUser) {
          throw new Error("Unable to restore user session.");
        }

        if (!cancelled) {
          setApiAccessToken(token);
          setAccessToken(token);
          setUser(restoredUser);
          setIsAuthenticated(true);
        }
      } catch {
        if (!cancelled) {
          setApiAccessToken(null);
          setAccessToken(null);
          setUser(null);
          setIsAuthenticated(false);
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
  }, []);

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
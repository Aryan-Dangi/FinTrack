import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Separate instance: refresh requests must not trigger the API interceptors.
const refreshClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let currentAccessToken = null;
let refreshPromise = null;

let onTokenRefreshed = null;
let onAuthExpired = null;

export const setApiAccessToken = (token) => {
  currentAccessToken = token || null;
};

export const setAuthCallbacks = (callbacks = {}) => {
  onTokenRefreshed = callbacks.onTokenRefreshed || null;
  onAuthExpired = callbacks.onAuthExpired || null;
};

const clearLegacyTokens = () => {
  ["accessToken", "access_token", "token"].forEach((key) => {
    localStorage.removeItem(key);
  });
};

const refreshToken = async () => {
  // Reuse an ongoing refresh request if multiple APIs fail together.
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post("/auth/refresh-token")
      .then((response) => {
        const newToken = response.data?.accessToken;

        if (!newToken) {
          throw new Error("Refresh response did not contain an access token.");
        }

        currentAccessToken = newToken;
        onTokenRefreshed?.(newToken);

        return newToken;
      })
      .catch((error) => {
        currentAccessToken = null;
        clearLegacyTokens();
        onAuthExpired?.();

        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

// Attach the latest access token to outgoing requests.
api.interceptors.request.use(
  (config) => {
    config.headers = config.headers || {};

    if (currentAccessToken) {
      config.headers.Authorization = `Bearer ${currentAccessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Refresh expired tokens and retry failed requests.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (!originalRequest || status !== 401) {
      return Promise.reject(error);
    }

    const requestUrl = originalRequest.url || "";

    // Never attempt refresh for authentication endpoints themselves.
    const excludedEndpoints = [
      "/auth/login",
      "/auth/signup",
      "/auth/refresh-token",
      "/auth/logout",
    ];

    const isExcluded = excludedEndpoints.some((endpoint) =>
      requestUrl.includes(endpoint)
    );

    if (isExcluded || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const newToken = await refreshToken();

      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${newToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  }
);

export default api;
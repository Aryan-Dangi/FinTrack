import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let currentAccessToken = null;

export const setApiAccessToken = (token) => {
  currentAccessToken = token || null;
};

api.interceptors.request.use(
  (config) => {
    // Preserve an explicitly supplied Authorization header.
    // Otherwise, attach the current in-memory access token.
    if (!config.headers.Authorization && currentAccessToken) {
      config.headers.Authorization = `Bearer ${currentAccessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
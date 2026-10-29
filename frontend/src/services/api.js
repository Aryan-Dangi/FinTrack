
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

const getStoredAccessToken = () => {
  const keys = ["accessToken", "access_token", "token"];

  for (const key of keys) {
    const value = localStorage.getItem(key);

    if (value) {
      return value;
    }
  }

  return null;
};

api.interceptors.request.use(
  (config) => {
    // Preserve an explicitly supplied Authorization header.
    if (config.headers.Authorization) {
      return config;
    }

    const token = currentAccessToken || getStoredAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;

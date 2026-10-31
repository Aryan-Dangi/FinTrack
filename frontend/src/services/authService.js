import api from "./api";

export const signupUser = async (userData) => {
  const response = await api.post("/auth/signup", userData);
  return response.data;
};

export const loginUser = async (credentials) => {
  const response = await api.post("/auth/login", credentials);
  return response.data;
};

export const refreshAccessToken = async () => {
  const response = await api.post("/auth/refresh-token");
  return response.data;
};

export const getCurrentUser = async (accessToken) => {
  const response = await api.get("/auth/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return response.data;
};

export const logoutUser = async () => {
  const response = await api.post("/auth/logout");
  return response.data;
};

export const updateUserProfile = async (profileData) => {
  const response = await api.patch("/auth/profile", profileData);
  return response.data;
};

export const changeUserPassword = async (passwordData) => {
  const response = await api.patch("/auth/change-password", passwordData);
  return response.data;
};
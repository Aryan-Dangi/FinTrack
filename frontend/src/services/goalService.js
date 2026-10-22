
import api from "./api";

export const getGoals = async (status = "") => {
  const response = await api.get("/goals", {
    params: status ? { status } : {},
  });

  return response.data;
};

export const createGoal = async (goalData) => {
  const response = await api.post("/goals", goalData);
  return response.data;
};

export const updateGoal = async (goalId, goalData) => {
  const response = await api.patch(`/goals/${goalId}`, goalData);
  return response.data;
};

export const deleteGoal = async (goalId) => {
  const response = await api.delete(`/goals/${goalId}`);
  return response.data;
};

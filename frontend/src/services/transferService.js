import api from "./api";

export const getTransfers = async (accountId = "") => {
  const response = await api.get("/transfers", {
    params: accountId ? { account: accountId } : {},
  });

  return response.data;
};

export const createTransfer = async (transferData) => {
  const response = await api.post("/transfers", transferData);
  return response.data;
};

export const deleteTransfer = async (transferId) => {
  const response = await api.delete(`/transfers/${transferId}`);
  return response.data;
};
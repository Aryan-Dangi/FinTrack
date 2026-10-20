
import api from "./api";

export const getAccounts = async (includeArchived = false) => {
  const response = await api.get("/accounts", {
    params: includeArchived ? { includeArchived: "true" } : {},
  });
  return response.data;
};

export const getAccountBalances = async () => {
  const response = await api.get("/accounts/balances");
  return response.data;
};

export const createAccount = async (accountData) => {
  const response = await api.post("/accounts", accountData);
  return response.data;
};

export const updateAccount = async (accountId, accountData) => {
  const response = await api.patch(`/accounts/${accountId}`, accountData);
  return response.data;
};

export const archiveAccount = async (accountId) => {
  const response = await api.delete(`/accounts/${accountId}`);
  return response.data;
};

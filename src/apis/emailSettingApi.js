import apiClient from "./apiClient";

export const fetchEmailSettings = async ({ headOfficeId, schoolId } = {}) => {
  const params = new URLSearchParams();
  if (headOfficeId != null && String(headOfficeId).trim() !== "") {
    params.set("headOfficeId", String(headOfficeId));
  }
  if (schoolId != null && String(schoolId).trim() !== "") {
    params.set("schoolId", String(schoolId));
  }

  const query = params.toString();
  const url = query ? `/api/email-settings?${query}` : "/api/email-settings";
  const { data } = await apiClient.get(url);
  return data;
};

export const fetchEmailSettingById = async (id) => {
  const { data } = await apiClient.get(`/api/email-settings/${id}`);
  return data;
};

export const createEmailSetting = async (payload) => {
  const { data } = await apiClient.post("/api/email-settings", payload);
  return data;
};

export const updateEmailSetting = async (id, payload) => {
  const { data } = await apiClient.put(`/api/email-settings/${id}`, payload);
  return data;
};

export const deleteEmailSetting = async (id) => {
  const { data } = await apiClient.delete(`/api/email-settings/${id}`);
  return data;
};

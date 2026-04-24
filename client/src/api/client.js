import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

let accessToken = null;
let isRefreshing = false;
let refreshQueue = [];

export function setAccessToken(token) {
  accessToken = token ?? null;
}

export function getAccessToken() {
  return accessToken;
}

function flushRefreshQueue(error, token = null) {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
      return;
    }

    resolve(token);
  });
  refreshQueue = [];
}

function shouldRefreshToken(error) {
  const originalRequest = error.config ?? {};
  const requestUrl = String(originalRequest.url || "");

  return (
    error.response?.status === 401 &&
    !originalRequest._retry &&
    !originalRequest._skipAuthRefresh &&
    !requestUrl.includes("/auth/login") &&
    !requestUrl.includes("/auth/register") &&
    !requestUrl.includes("/auth/refresh")
  );
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config ?? {};

    if (!shouldRefreshToken(error)) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post("/api/auth/refresh", null, {
        withCredentials: true,
      });

      accessToken = data.accessToken;
      isRefreshing = false;
      flushRefreshQueue(null, data.accessToken);

      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      isRefreshing = false;
      accessToken = null;
      flushRefreshQueue(refreshError);

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("auth:logout"));
      }

      return Promise.reject(refreshError);
    }
  }
);

export default api;

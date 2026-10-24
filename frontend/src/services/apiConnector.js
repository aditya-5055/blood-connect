import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { store } from "../store"; 
import { logout } from "../slices/authSlice"; 

const axiosInstance = axios.create({
  baseURL: BASE_URL,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || "";
    // Redirect to login on 401 unless the request was to an auth route (login/signup)
    if (status === 401 && !url.includes("/api/auth/")) {
      store.dispatch(logout());
      window.location.href = "/donor/login";
    }
    return Promise.reject(error);
  }
);

// Updated apiConnector to properly spread headers
export const apiConnector = (method, url, data, headers, params) => {
  return axiosInstance({
    method: `${method}`,
    url: `${url}`,
    data: data ? data : null,
    headers: headers ? headers : null,
    params: params ? params : null,
  });
};

export default axiosInstance;
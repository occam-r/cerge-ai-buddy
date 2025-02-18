import axios from "axios";

export const BASE_URL = "https://stingray-app-hu6at.ondigitalocean.app";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 300000,
});

// Request Interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    console.debug(
      `[REQUEST] ${config.method?.toUpperCase()} ${config.url} ${JSON.stringify(
        config.params
      )}`
    );
    return config;
  },
  (error) => {
    console.error("[REQUEST ERROR]", error.message);
    return Promise.reject(error);
  }
);

// Response Interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    console.debug(
      `[RESPONSE] ${response.config.method?.toUpperCase()} ${
        response.config.url
      } ${JSON.stringify(response.data?.message)}`
    );
    return response;
  },
  (error) => {
    const { response, message, code, config } = error;
    console.error("[RESPONSE ERROR]", {
      message,
      status: response?.status,
      code,
      url: config?.url,
      method: config?.method,
    });

    return Promise.reject(error);
  }
);

export default axiosInstance;

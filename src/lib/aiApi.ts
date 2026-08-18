import axios from "axios";

const aiApi = axios.create({
  baseURL: import.meta.env.VITE_AI_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export default aiApi;

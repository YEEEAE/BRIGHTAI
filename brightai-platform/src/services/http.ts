import axios from "axios";
import { APP_DEFAULT_LOCALE } from "../constants/app";

// عميل موحد للطلبات الشبكية
export const http = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || "",
  headers: {
    "Accept-Language": APP_DEFAULT_LOCALE,
  },
});

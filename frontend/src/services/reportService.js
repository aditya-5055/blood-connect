import { apiConnector } from "./apiConnector";
import { REPORT_APIS } from "./apis";

// 1. Get Camp Data
export const getCampReportData = async () => {
  const response = await apiConnector("GET", REPORT_APIS.GET_CAMP_REPORT);
  return response.data;
};

// 2. Get Proactive Donor Data (Supports Daily, Monthly, Yearly, Custom)
export const getProactiveReportData = async (params) => {
  // params = { type, year, month, startDate, endDate }
  const queryString = new URLSearchParams(params).toString();
  const response = await apiConnector("GET", `${REPORT_APIS.GET_PROACTIVE_REPORT}?${queryString}`);
  return response.data;
};

// 3. Get Inventory & Hospital Data
export const getInventoryReportData = async (params) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await apiConnector("GET", `${REPORT_APIS.GET_INVENTORY_REPORT}?${queryString}`);
  return response.data;
};
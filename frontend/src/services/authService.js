

import { apiConnector } from "./apiConnector";
import { AUTH_APIS } from "./apis";


// ─────────────────────────────────
// Send OTP — Donor
// ─────────────────────────────────
export const sendDonorOTP = async (email) => {
  const response = await apiConnector("POST", AUTH_APIS.DONOR_SEND_OTP, { email });
  return response.data;
};

// ─────────────────────────────────
// Register Donor
// ─────────────────────────────────
export const registerDonor = async (data) => {
  const response = await apiConnector("POST", AUTH_APIS.DONOR_REGISTER, data);
  return response.data;
};

// ─────────────────────────────────
// Login Donor
// ─────────────────────────────────
export const loginDonor = async (data) => {
  const response = await apiConnector("POST", AUTH_APIS.DONOR_LOGIN, data);
  return response.data;
};

// ─────────────────────────────────
// Send OTP — Facility
// ─────────────────────────────────
export const sendFacilityOTP = async (email) => {
  const response = await apiConnector("POST", AUTH_APIS.FACILITY_SEND_OTP, { email });
  return response.data;
};

// ─────────────────────────────────
// Register Facility
// ─────────────────────────────────
export const registerFacility = async (data) => {
  const response = await apiConnector("POST", AUTH_APIS.FACILITY_REGISTER, data);
  return response.data;
};

// ─────────────────────────────────
// Login Facility
// ─────────────────────────────────
export const loginFacility = async (data) => {
  const response = await apiConnector("POST", AUTH_APIS.FACILITY_LOGIN, data);
  return response.data;
};

// ─────────────────────────────────
// Login Admin
// ─────────────────────────────────
export const loginAdmin = async (data) => {
  const response = await apiConnector("POST", AUTH_APIS.ADMIN_LOGIN, data);
  return response.data;
};

// ─────────────────────────────────
// Google OAuth
// ─────────────────────────────────
export const googleDonorLogin = async (credential) => {
  const response = await apiConnector("POST", AUTH_APIS.GOOGLE_DONOR_LOGIN, { credential });
  return response.data;
};

export const googleFacilityLogin = async (credential) => {
  const response = await apiConnector("POST", AUTH_APIS.GOOGLE_FACILITY_LOGIN, { credential });
  return response.data;
};

// ─────────────────────────────────
// ✅ NEW — Forgot Password
// Step 1: Send reset link to email
// ─────────────────────────────────
export const resetPasswordToken = async (email, userType) => {
  const response = await apiConnector("POST", AUTH_APIS.RESET_PASSWORD_TOKEN, {
    email,
    userType,
  });
  return response.data;
};

// ─────────────────────────────────
// ✅ NEW — Reset Password
// Step 2: Submit new password using token from URL
// ─────────────────────────────────
export const resetPassword = async (password, confirmPassword, token, userType) => {
  const response = await apiConnector("POST", AUTH_APIS.RESET_PASSWORD, {
    password,
    confirmPassword,
    token,
    userType,
  });
  return response.data;
};
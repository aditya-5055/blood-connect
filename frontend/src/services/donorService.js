import { apiConnector } from "./apiConnector";
import { DONOR_APIS } from "./apis";

// --- Profile & Settings ---
export const getDonorProfile = async () => {
  const response = await apiConnector("GET", DONOR_APIS.GET_PROFILE);
  return response.data;
};

export const updateDonorProfile = async (data) => {
  const response = await apiConnector("PUT", DONOR_APIS.UPDATE_PROFILE, data);
  return response.data;
};

export const toggleAvailability = async () => {
  const response = await apiConnector("PUT", DONOR_APIS.TOGGLE_AVAILABILITY);
  return response.data;
};

// --- History & Tracking ---
export const getDonationHistory = async () => {
  const response = await apiConnector("GET", DONOR_APIS.GET_DONATION_HISTORY);
  return response.data;
};

// --- Finding Nearby Facilities ---
export const getNearbyBloodBanks = async (longitude, latitude) => {
  const response = await apiConnector("GET", DONOR_APIS.GET_NEARBY_BLOOD_BANKS, null, null, { longitude, latitude });
  return response.data;
};

export const getNearbyCamps = async (longitude, latitude) => {
  const response = await apiConnector("GET", DONOR_APIS.GET_NEARBY_CAMPS, null, null, { longitude, latitude });
  return response.data;
};

export const getNearbyRequests = async (longitude, latitude) => {
  const response = await apiConnector("GET", DONOR_APIS.GET_NEARBY_REQUESTS, null, null, { longitude, latitude });
  return response.data;
};

// --- Proactive Donation Workflow (Donor -> Bank) ---
export const getAvailableSlotsForBank = async (bankId) => {
  const response = await apiConnector("GET", DONOR_APIS.GET_BANK_SLOTS(bankId));
  return response.data;
};

export const proactiveDonate = async (data) => {
  const response = await apiConnector("POST", DONOR_APIS.BOOK_SLOT, data);
  return response.data;
};

export const getMyDonationRequests = async () => {
  const response = await apiConnector("GET", DONOR_APIS.GET_MY_BOOKINGS);
  return response.data;
};

export const cancelDonationRequest = async (id) => {
  const response = await apiConnector("PUT", DONOR_APIS.CANCEL_BOOKING(id));
  return response.data;
};

// --- Camp Workflow ---
export const registerForCamp = async (campId) => {
  const response = await apiConnector("POST", DONOR_APIS.REGISTER_FOR_CAMP(campId));
  return response.data;
};

export const getMyCamps = async () => {
  const response = await apiConnector("GET", DONOR_APIS.GET_MY_CAMPS);
  return response.data;
};

// --- Direct Request Workflow (Hospital -> Donor) ---
export const acceptBloodRequest = async (requestId) => {
  const response = await apiConnector("PUT", DONOR_APIS.ACCEPT_BLOOD_REQUEST(requestId));
  return response.data;
};

export const declineBloodRequest = async (requestId) => {
  const response = await apiConnector("PUT", DONOR_APIS.DECLINE_BLOOD_REQUEST(requestId));
  return response.data;
};
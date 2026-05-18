const express = require("express");
const router = express.Router();
const {
  getProfile,
  updateProfile,
  toggleAvailability,
  getDonationHistory,
  getNearbyBloodBanks,
  getNearbyCamps,
  proactiveDonate,
  registerForCamp,
  getMyDonationRequests,
  getNearbyBloodRequests,
  acceptBloodRequest,
  getMyCampRegistrations,
  declineBloodRequest,
  cancelDonationAppointment, 
  cancelDonationRequest,      
  confirmDonationInvite,
} = require("../controllers/donorController");

const { auth, isDonor } = require("../middleware/authMiddleware");

// Discovery & Profile
router.get("/profile", auth, isDonor, getProfile);
router.put("/update-profile", auth, isDonor, updateProfile);
router.put("/toggle-availability", auth, isDonor, toggleAvailability);
router.get("/donation-history", auth, isDonor, getDonationHistory);
router.get("/nearby-bloodbanks", auth, isDonor, getNearbyBloodBanks);
router.get("/nearby-camps", auth, isDonor, getNearbyCamps);
router.get("/nearby-requests", auth, isDonor, getNearbyBloodRequests);

// Donation Flow
router.post("/proactive-donate", auth, isDonor, proactiveDonate);
router.get("/my-donation-requests", auth, isDonor, getMyDonationRequests);

// ✅ Standardized parameter to :id
router.put("/confirm-invite/:id", auth, isDonor, confirmDonationInvite);

// Camps & Direct Hospital Requests
router.post("/register-camp/:id", auth, isDonor, registerForCamp);
router.put("/accept-request/:id", auth, isDonor, acceptBloodRequest);
router.put("/decline-request/:id", auth, isDonor, declineBloodRequest);
router.get("/my-camps", auth, isDonor, getMyCampRegistrations);

// --- Cancellation / Decline Logic ---
router.put("/cancel-appointment/:id", auth, isDonor, cancelDonationAppointment);
// ✅ Standardized parameter to :id to match DONOR_APIS
router.patch("/cancel-request/:id", auth, isDonor, cancelDonationRequest);

module.exports = router;
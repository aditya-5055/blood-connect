const express = require("express");
const router = express.Router();
const {
  getProfile,
  updateProfile,
  toggleAvailability,
  getDonationHistory,
  getNearbyBloodBanks,
  getNearbyCamps,
  registerForCamp,
  getNearbyBloodRequests,
  acceptBloodRequest,
  getMyCampRegistrations,
  declineBloodRequest,
  // Slot Booking Endpoints
  getAvailableSlotsForBank,
  bookSlot,
  getMyBookings,
  cancelBooking,
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

// Slot Booking Flow
router.get("/bloodbanks/:bankId/slots", auth, isDonor, getAvailableSlotsForBank);
router.post("/book-slot", auth, isDonor, bookSlot);
router.get("/my-bookings", auth, isDonor, getMyBookings);
router.put("/cancel-booking/:id", auth, isDonor, cancelBooking);

// Camps & Direct Hospital Requests
router.post("/register-camp/:id", auth, isDonor, registerForCamp);
router.put("/accept-request/:id", auth, isDonor, acceptBloodRequest);
router.put("/decline-request/:id", auth, isDonor, declineBloodRequest);
router.get("/my-camps", auth, isDonor, getMyCampRegistrations);

module.exports = router;
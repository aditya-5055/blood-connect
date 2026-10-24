const Donor = require("../models/donorModel");
const Facility = require("../models/facilityModel");
const ProactiveDonation = require("../models/proactiveDonationModel");
const AppointmentSlot = require("../models/appointmentSlotModel");
const BloodRequest = require("../models/bloodRequestModel");
const Camp = require("../models/campModel");
const mailSender = require("../utils/mailSender");
const bloodRequestAcceptedTemplate = require("../mail/templates/bloodRequestAcceptedTemplate");
const campRegistrationTemplate = require("../mail/templates/campRegistrationTemplate");
const mongoose = require("mongoose");
// ✅ NEW: Import the notification utility
const sendNotification = require("../utils/sendNotification");
const { getDonorRadius, calculateDistance } = require("../utils/requestRadius");

const getTrustRestrictionMessage = (donor) => {
  const now = new Date();

  if (donor.penaltyUntil && donor.penaltyUntil > now) {
    return `Your account is temporarily restricted due to a missed confirmed appointment. You can request again after ${new Date(donor.penaltyUntil).toDateString()}.`;
  }

  if ((donor.trustScore || 100) < 40) {
    return "Your trust score is too low to create new requests right now. Complete future commitments on time to improve your score.";
  }

  return null;
};

// ─────────────────────────────────
// @route  GET /api/donor/profile
// @access Donor only
// ─────────────────────────────────
exports.getProfile = async (req, res) => {
  try {
    const donor = await Donor.findById(req.user.id).select("-password");

    if (!donor) {
      return res.status(404).json({
        success: false,
        message: "Donor not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      donor,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
      error: error.message,
    });
  }
};

// ─────────────────────────────────
// @route  PUT /api/donor/update-profile
// @access Donor only
// ─────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const { fullName, phone, address, weight, location } = req.body;

    const donor = await Donor.findById(req.user.id);
    if (!donor) {
      return res.status(404).json({
        success: false,
        message: "Donor not found",
      });
    }

    if (fullName) donor.fullName = fullName;
    if (phone) donor.phone = phone;
    if (address) donor.address = address;
    if (weight) donor.weight = weight;
    if (location) donor.location = location;

    await donor.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      donor: {
        id: donor._id,
        fullName: donor.fullName,
        phone: donor.phone,
        address: donor.address,
        weight: donor.weight,
        location: donor.location,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message,
    });
  }
};

// ─────────────────────────────────
// @route  PUT /api/donor/toggle-availability
// @access Donor only
// ─────────────────────────────────
exports.toggleAvailability = async (req, res) => {
  try {
    const donor = await Donor.findById(req.user.id);
    if (!donor) {
      return res.status(404).json({
        success: false,
        message: "Donor not found",
      });
    }

    donor.isAvailable = !donor.isAvailable;
    await donor.save();

    return res.status(200).json({
      success: true,
      message: donor.isAvailable
        ? "You are now available to donate"
        : "You are now unavailable to donate",
      isAvailable: donor.isAvailable,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to toggle availability",
      error: error.message,
    });
  }
};

// ─────────────────────────────────
// @route  GET /api/donor/donation-history
// @access Donor only
// ─────────────────────────────────
exports.getDonationHistory = async (req, res) => {
  try {
    const donor = await Donor.findById(req.user.id).populate(
      "donationHistory.facility",
      "name address phone facilityType",
    );

    if (!donor) {
      return res.status(404).json({
        success: false,
        message: "Donor not found",
      });
    }

    let nextEligibleDate = null;
    if (donor.lastDonationDate) {
      const last = new Date(donor.lastDonationDate);
      nextEligibleDate = new Date(last.getTime() + 90 * 24 * 60 * 60 * 1000);
    }

    return res.status(200).json({
      success: true,
      message: "Donation history fetched successfully",
      count: donor.donationHistory.length,
      trustScore: donor.trustScore,
      penaltyUntil: donor.penaltyUntil,
      medicalLockUntil: donor.medicalLockUntil,
      nextEligibleDate,
      donationHistory: donor.donationHistory,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch donation history",
      error: error.message,
    });
  }
};

// ─────────────────────────────────
// @route  GET /api/donor/nearby-bloodbanks
// @access Donor only
// ─────────────────────────────────
exports.getNearbyBloodBanks = async (req, res) => {
  try {
    let { longitude, latitude } = req.query;

    if (!longitude || !latitude) {
      const donor = await Donor.findById(req.user.id);
      if (donor?.location?.coordinates?.[0] !== 0) {
        longitude = donor.location.coordinates[0];
        latitude = donor.location.coordinates[1];
      } else {
        return res.status(400).json({
          success: false,
          message: "Location not set. Please update your location from profile.",
        });
      }
    }

    const bloodBanks = await Facility.find({
      facilityType: "blood-bank",
      status: "approved",
      isActive: true,
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: 10000,
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Nearby blood banks fetched successfully",
      count: bloodBanks.length,
      bloodBanks,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch nearby blood banks",
      error: error.message,
    });
  }
};

// ─────────────────────────────────
// @route  GET /api/donor/nearby-camps
// @access Donor only
// ─────────────────────────────────
exports.getNearbyCamps = async (req, res) => {
  try {
    let { longitude, latitude } = req.query;

    if (!longitude || !latitude) {
      const donor = await Donor.findById(req.user.id);
      if (donor?.location?.coordinates?.[0] !== 0) {
        longitude = donor.location.coordinates[0];
        latitude = donor.location.coordinates[1];
      } else {
        return res.status(400).json({
          success: false,
          message: "Location not set. Please update your location from profile.",
        });
      }
    }

    const camps = await Camp.find({
      status: { $in: ["upcoming", "ongoing"] },
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: 10000,
        },
      },
    }).populate("bloodBankId", "name phone address");

    const campsWithSeats = camps.map((camp) => {
      const campObj = camp.toObject();
      const availableSeats = camp.capacity - camp.registeredDonors.length;
      const isRegistered = camp.registeredDonors.some(
        (d) => d.donorId.toString() === req.user.id
      );
      delete campObj.registeredDonors;
      delete campObj.actualDonors;
      return { ...campObj, availableSeats, isRegistered };
    });

    return res.status(200).json({
      success: true,
      message: "Nearby camps fetched successfully",
      count: camps.length,
      camps: campsWithSeats,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch nearby camps",
      error: error.message,
    });
  }
};

// ─────────────────────────────────
// @route  GET /api/donor/my-camps
// @access Donor only
// ─────────────────────────────────
exports.getMyCampRegistrations = async (req, res) => {
  try {
    const camps = await Camp.find({
      "registeredDonors.donorId": req.user.id,
    }).populate("bloodBankId", "name phone address");

    const myCamps = camps.map((camp) => {
      const myRegistration = camp.registeredDonors.find(
        (d) => d.donorId.toString() === req.user.id.toString()
      );

      if (!myRegistration) return null;

      return {
        campId: camp._id,
        name: camp.name,
        campDate: camp.campDate,
        startTime: camp.startTime,
        endTime: camp.endTime,
        address: camp.address,
        status: camp.status,
        bloodBank: camp.bloodBankId,
        myStatus: myRegistration.donationStatus,
        registeredAt: myRegistration.registeredAt,
      };
    }).filter(camp => camp !== null);

    return res.status(200).json({
      success: true,
      message: "Camp registrations fetched successfully",
      count: myCamps.length,
      camps: myCamps,
    });

  } catch (error) {
    console.log("Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch camp registrations",
      error: error.message,
    });
  }
};

// ─────────────────────────────────
// @route  GET /api/donor/bloodbanks/:bankId/slots
// @desc   Get available slots for a specific blood bank
// @access Donor only
// ─────────────────────────────────
exports.getAvailableSlotsForBank = async (req, res) => {
  try {
    const { bankId } = req.params;
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Include today's slots

    const slots = await AppointmentSlot.find({
      bloodBankId: bankId,
      date: { $gte: now },
      isActive: true,
    }).sort({ date: 1, startTime: 1 });

    return res.status(200).json({
      success: true,
      message: "Available slots fetched successfully",
      slots,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────
// @route  POST /api/donor/book-slot
// @desc   Donor books an available slot
// @access Donor only
// ─────────────────────────────────
exports.bookSlot = async (req, res) => {
  try {
    const { slotId, notes } = req.body;
    const donor = await Donor.findById(req.user.id);

    if (!donor) {
      return res.status(404).json({ success: false, message: "Donor not found" });
    }

    const trustRestrictionMessage = getTrustRestrictionMessage(donor);
    if (trustRestrictionMessage) {
      return res.status(403).json({ success: false, message: trustRestrictionMessage });
    }

    if (donor.medicalLockUntil && new Date() < donor.medicalLockUntil) {
      return res.status(403).json({
        success: false,
        message: `You are on medical recovery. Eligible after ${donor.medicalLockUntil.toDateString()}.`,
      });
    }

    if (donor.lastDonationDate) {
      const lastDonation = new Date(donor.lastDonationDate);
      const now = new Date();
      const diffDays = (now - lastDonation) / (1000 * 60 * 60 * 24);
      if (diffDays < 90) {
        return res.status(400).json({
          success: false,
          message: `You are not eligible to donate yet. You can donate after ${Math.ceil(90 - diffDays)} days`,
        });
      } else {
        donor.eligibleToDonate = true;
        await donor.save();
      }
    }

    if (!donor.eligibleToDonate) {
      return res.status(400).json({
        success: false,
        message: "You already have a booked donation request. Please complete or cancel it first.",
      });
    }

    const slot = await AppointmentSlot.findById(slotId);
    if (!slot || !slot.isActive) {
      return res.status(404).json({ success: false, message: "Appointment slot not found or inactive" });
    }

    const slotStart = new Date(slot.date);
    const [hours, minutes] = slot.startTime.split(":").map(Number);
    slotStart.setHours(hours, minutes, 0, 0);

    if (new Date() >= slotStart) {
      return res.status(400).json({ success: false, message: "This slot time has already passed." });
    }

    if (slot.bookedCount >= slot.capacity) {
      return res.status(400).json({ success: false, message: "This slot is fully booked." });
    }

    const existingBooking = await ProactiveDonation.findOne({
      donorId: req.user.id,
      status: "booked",
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: "You already have an active slot booked. Please complete or cancel it first.",
      });
    }

    slot.bookedCount += 1;
    await slot.save();

    const booking = await ProactiveDonation.create({
      donorId: req.user.id,
      bloodBankId: slot.bloodBankId,
      slotId,
      bloodGroup: donor.bloodGroup,
      notes,
      status: "booked",
    });

    donor.eligibleToDonate = false;
    await donor.save();

    const bloodBank = await Facility.findById(slot.bloodBankId);

    await sendNotification(
      bloodBank._id,
      "Facility",
      "New Appointment Booking 📅",
      `${donor.fullName} (${donor.bloodGroup}) booked an appointment slot on ${new Date(slot.date).toDateString()} at ${slot.startTime}.`,
      "/bloodbank/donation-requests"
    );

    return res.status(201).json({
      success: true,
      message: "Appointment slot booked successfully!",
      booking,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────
// @route  POST /api/donor/register-camp/:id
// @access Donor only
// ─────────────────────────────────
exports.registerForCamp = async (req, res) => {
  try {
    const donor = await Donor.findById(req.user.id);
    if (!donor) {
      return res.status(404).json({
        success: false,
        message: "Donor not found",
      });
    }

    const trustRestrictionMessage = getTrustRestrictionMessage(donor);
    if (trustRestrictionMessage) {
      return res.status(403).json({
        success: false,
        message: trustRestrictionMessage,
      });
    }

    if (donor.lastDonationDate) {
      const lastDonation = new Date(donor.lastDonationDate);
      const now = new Date();
      const diffDays = (now - lastDonation) / (1000 * 60 * 60 * 24);
      if (diffDays < 90) {
        return res.status(400).json({
          success: false,
          message: `You are not eligible to donate yet. You can donate after ${Math.ceil(90 - diffDays)} days`,
        });
      } else {
        donor.eligibleToDonate = true;
        await donor.save();
      }
    }

    if (!donor.eligibleToDonate) {
      return res.status(400).json({
        success: false,
        message: "You are not eligible to donate yet. Please wait 90 days from last donation.",
      });
    }

    const confirmedRequest = await ProactiveDonation.findOne({
      donorId: req.user.id,
      status: "confirmed",
    });
    if (confirmedRequest) {
      return res.status(400).json({
        success: false,
        message: "You have a confirmed donation request with a blood bank. Please complete it first.",
      });
    }

    const camp = await Camp.findById(req.params.id);
    if (!camp) {
      return res.status(404).json({
        success: false,
        message: "Camp not found",
      });
    }

    if (!["upcoming", "ongoing"].includes(camp.status)) {
      return res.status(400).json({
        success: false,
        message: "Camp is not accepting registrations",
      });
    }

    const availableSeats = camp.capacity - camp.registeredDonors.length;
    if (availableSeats <= 0) {
      return res.status(400).json({
        success: false,
        message: "Camp is full. No seats available.",
      });
    }

    const alreadyRegistered = camp.registeredDonors.find(
      (d) => d.donorId.toString() === req.user.id
    );
    if (alreadyRegistered) {
      return res.status(400).json({
        success: false,
        message: "You are already registered for this camp",
      });
    }

    const conflictingCamp = await Camp.findOne({
      status: { $in: ["upcoming", "ongoing"] },
      campDate: {
        $gte: new Date(new Date(camp.campDate).setHours(0, 0, 0, 0)),
        $lte: new Date(new Date(camp.campDate).setHours(23, 59, 59, 999)),
      },
      "registeredDonors.donorId": req.user.id,
      _id: { $ne: camp._id },
    });

    if (conflictingCamp) {
      return res.status(400).json({
        success: false,
        message: "You are already registered for another camp on this date",
      });
    }

    camp.registeredDonors.push({
      donorId: req.user.id,
      registeredAt: new Date(),
      donationStatus: "registered",
    });
    await camp.save();

    const bloodBank = await Facility.findById(camp.bloodBankId);
    
    // Send camp registration email to donor
    try {
      await mailSender(
        donor.email,
        "Camp Registration Confirmed - Blood Donation System",
        campRegistrationTemplate(
          donor.fullName,
          camp.name,
          camp.campDate,
          camp.startTime,
          camp.endTime,
          camp.address,
          bloodBank.name
        )
      );
    } catch (emailError) {
      console.error("Camp registration email failed:", emailError.message);
    }

    // ✅ NEW: In-App Notification to Blood Bank that created the camp
    await sendNotification(
      camp.bloodBankId,
      "Facility",
      "Camp Registration 📋",
      `${donor.fullName} registered for your upcoming camp: ${camp.name}.`,
      `/bloodbank/camps` 
    );

    return res.status(200).json({
      success: true,
      message: "Registered for camp successfully",
      camp: {
        id: camp._id,
        name: camp.name,
        campDate: camp.campDate,
        startTime: camp.startTime,
        endTime: camp.endTime,
        address: camp.address,
        availableSeats: availableSeats - 1,
      },
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to register for camp",
      error: error.message,
    });
  }
};

// ─────────────────────────────────
// @route  GET /api/donor/my-donation-requests
// @access Donor only
// ─────────────────────────────────
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await ProactiveDonation.find({
      donorId: req.user.id,
    })
      .populate("bloodBankId", "name phone address operatingHours")
      .populate("slotId", "date startTime endTime capacity bookedCount");

    return res.status(200).json({
      success: true,
      message: "Donation bookings fetched successfully",
      count: bookings.length,
      donationRequests: bookings,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch donation bookings",
      error: error.message,
    });
  }
};

// ─────────────────────────────────
// @route  GET /api/donor/nearby-requests
// @access Donor only
// ─────────────────────────────────
exports.getNearbyBloodRequests = async (req, res) => {
  try {
    let { longitude, latitude } = req.query;

    const donor = await Donor.findById(req.user.id);
    if (!donor) {
      return res.status(404).json({
        success: false,
        message: "Donor not found",
      });
    }

    if (donor.lastDonationDate) {
      const lastDonation = new Date(donor.lastDonationDate);
      const now = new Date();
      const diffDays = (now - lastDonation) / (1000 * 60 * 60 * 24);
      if (diffDays >= 90 && !donor.eligibleToDonate) {
        donor.eligibleToDonate = true;
        await donor.save();
      }
    }

    if (!donor.eligibleToDonate) {
      return res.status(200).json({
        success: true,
        message: "You are not eligible to donate yet",
        count: 0,
        requests: [],
      });
    }

    if (!donor.isAvailable) {
      return res.status(200).json({
        success: true,
        message: "You are marked as unavailable",
        count: 0,
        requests: [],
      });
    }

    if (!longitude || !latitude) {
      if (donor?.location?.coordinates?.[0] !== 0) {
        longitude = donor.location.coordinates[0];
        latitude = donor.location.coordinates[1];
      } else {
        return res.status(400).json({
          success: false,
          message: "Location not set. Please update your location from profile.",
        });
      }
    }

    const allRequests = await BloodRequest.find({
      stage: "both",
      status: "active",
      bloodGroup: donor.bloodGroup,
      deadline: { $gt: new Date() },
      declinedBy: { $nin: [req.user.id] },
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: 30000, // Query up to the maximum possible donor search radius (30km)
        },
      },
    }).populate("hospitalId", "name address phone");

    const requests = allRequests.filter((request) => {
      const distance = calculateDistance(
        [parseFloat(longitude), parseFloat(latitude)],
        request.location.coordinates
      );
      return distance <= getDonorRadius(request.urgencyLevel);
    });

    return res.status(200).json({
      success: true,
      message: "Nearby blood requests fetched successfully",
      count: requests.length,
      requests,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch nearby requests",
      error: error.message,
    });
  }
};

// ─────────────────────────────────
// @route  PUT /api/donor/accept-request/:id
// @access Donor only
// ─────────────────────────────────
exports.acceptBloodRequest = async (req, res) => {
  try {
    const request = await BloodRequest.findById(req.params.id).populate(
      "hospitalId",
      "name email phone address"
    );
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Blood request not found",
      });
    }

    if (request.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "This request is already confirmed by someone else",
      });
    }

    if (new Date() > request.deadline) {
      return res.status(400).json({
        success: false,
        message: "This request has expired",
      });
    }

    if (request.stage !== "both") {
      return res.status(400).json({
        success: false,
        message: "This request is not available for donors yet",
      });
    }

    const donor = await Donor.findById(req.user.id);
    if (!donor) {
      return res.status(404).json({
        success: false,
        message: "Donor not found",
      });
    }

    const trustRestrictionMessage = getTrustRestrictionMessage(donor);
    if (trustRestrictionMessage) {
      return res.status(403).json({
        success: false,
        message: trustRestrictionMessage,
      });
    }

    if (donor.lastDonationDate) {
      const lastDonation = new Date(donor.lastDonationDate);
      const now = new Date();
      const diffDays = (now - lastDonation) / (1000 * 60 * 60 * 24);
      if (diffDays < 90) {
        return res.status(400).json({
          success: false,
          message: `You are not eligible to donate yet. You can donate after ${Math.ceil(90 - diffDays)} days`,
        });
      } else {
        donor.eligibleToDonate = true;
        await donor.save();
      }
    }

    if (!donor.eligibleToDonate) {
      return res.status(400).json({
        success: false,
        message: "You are not eligible to donate yet. Please wait 90 days from last donation.",
      });
    }

    if (!donor.isAvailable) {
      return res.status(400).json({
        success: false,
        message: "You are marked as unavailable. Please update your availability from profile.",
      });
    }

    const confirmedRequest = await ProactiveDonation.findOne({
      donorId: req.user.id,
      status: "confirmed",
    });
    if (confirmedRequest) {
      return res.status(400).json({
        success: false,
        message: "You have a confirmed donation request with a blood bank. Please complete it first.",
      });
    }

    request.status = "confirmed";
    request.respondedBy = {
      responderType: "donor",
      responderId: req.user.id,
    };
    await request.save();

    donor.eligibleToDonate = false;
    await donor.save();

    // 1️⃣2️⃣ Notify hospital that donor accepted
    try {
      await mailSender(
        request.hospitalId.email,
        "A donor has accepted your blood request - Blood Donation System",
        bloodRequestAcceptedTemplate(
          request.hospitalId.name,
          donor.fullName,
          "donor",
          request.bloodGroup,
          request.units,
          donor.phone,
          null
        )
      );
    } catch (emailError) {
      console.error("Hospital notification email failed:", emailError.message);
    }

    // ✅ NEW: In-App Notification to the Hospital
    await sendNotification(
      request.hospitalId._id,
      "Facility",
      "Donor Responding! 🏃‍♂️",
      `${donor.fullName} (${donor.bloodGroup}) accepted your urgent blood request and is on their way.`,
      "/hospital/my-requests"
    );

    return res.status(200).json({
      success: true,
      message: "Blood request accepted. Please visit hospital as soon as possible.",
      request: {
        id: request._id,
        bloodGroup: request.bloodGroup,
        units: request.units,
        status: request.status,
        urgencyLevel: request.urgencyLevel,
        hospital: {
          name: request.hospitalId.name,
          phone: request.hospitalId.phone,
          address: request.hospitalId.address,
        },
      },
      donor: {
        name: donor.fullName,
        phone: donor.phone,
        bloodGroup: donor.bloodGroup,
      },
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to accept request",
      error: error.message,
    });
  }
};

// ─────────────────────────────────
// @route  PUT /api/donor/decline-request/:id
// @access Donor only
// ─────────────────────────────────
exports.declineBloodRequest = async (req, res) => {
  try {
    const request = await BloodRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Blood request not found",
      });
    }

    if (request.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "This request is no longer active",
      });
    }

    if (!request.declinedBy.includes(req.user.id)) {
      request.declinedBy.push(req.user.id);
    }
    await request.save();

    return res.status(200).json({
      success: true,
      message: "Blood request declined",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to decline request",
      error: error.message,
    });
  }
};
// ─────────────────────────────────
// @route  PATCH /api/donor/cancel-request/:id
// ─────────────────────────────────
exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const donorId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID format" });
    }

    const booking = await ProactiveDonation.findOne({ _id: id, donorId }).populate("slotId");
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking request not found" });
    }

    if (booking.status !== "booked") {
      return res.status(400).json({ success: false, message: "Only active booked slots can be cancelled" });
    }

    const slot = booking.slotId;
    if (!slot) {
      return res.status(400).json({ success: false, message: "Associated slot not found" });
    }

    const slotStart = new Date(slot.date);
    const [hours, minutes] = slot.startTime.split(":").map(Number);
    slotStart.setHours(hours, minutes, 0, 0);

    const cutoffTime = slotStart.getTime() - 6 * 60 * 60 * 1000;
    if (Date.now() > cutoffTime) {
      return res.status(400).json({
        success: false,
        message: "Cancellation not allowed within 6 hours of the slot start time.",
      });
    }

    booking.status = "cancelled";
    await booking.save();

    slot.bookedCount = Math.max(0, slot.bookedCount - 1);
    await slot.save();

    await Donor.findByIdAndUpdate(donorId, { eligibleToDonate: true });

    return res.status(200).json({
      success: true,
      message: "Booking successfully cancelled",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
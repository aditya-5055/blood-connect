const Facility = require("../models/facilityModel");
const ProactiveDonation = require("../models/proactiveDonationModel");
const BloodRequest = require("../models/bloodRequestModel");
const BloodStock = require("../models/bloodStockModel");
const Camp = require("../models/campModel");
const Donor = require("../models/donorModel");
const updateCampStatuses = require("../utils/campStatusUpdater");
const TransactionHistory = require("../models/transactionHistoryModel");
const updateBloodRequestStages = require("../utils/bloodRequestUpdater");
const mailSender = require("../utils/mailSender");
const proactiveConfirmedTemplate = require("../mail/templates/proactiveConfirmedTemplate");
const proactiveDeclinedTemplate = require("../mail/templates/proactiveDeclinedTemplate");
const campRegistrationTemplate = require("../mail/templates/campRegistrationTemplate");
const donationCompletedTemplate = require("../mail/templates/donationCompletedTemplate");
const campCompletedTemplate = require("../mail/templates/campCompletedTemplate");
const newHospitalRequestTemplate = require("../mail/templates/newHospitalRequestTemplate");
const newProactiveDonorTemplate = require("../mail/templates/newProactiveDonorTemplate");
const bloodRequestAcceptedTemplate = require("../mail/templates/bloodRequestAcceptedTemplate");

// ✅ NEW: Import the notification utility
const sendNotification = require("../utils/sendNotification");

const notifyHospitalRequestAccepted = async (request, bloodBank) => {
  try {
    const jobs = [];

    if (request.hospitalId?.email && bloodBank) {
      jobs.push(
        mailSender(
          request.hospitalId.email,
          "Your blood request has been accepted - Blood Donation System",
          bloodRequestAcceptedTemplate(
            request.hospitalId.name,
            bloodBank.name,
            "bloodbank",
            request.bloodGroup,
            request.units,
            bloodBank.phone,
            bloodBank.address
          )
        )
      );
    }

    if (request.hospitalId?._id && bloodBank) {
      jobs.push(
        sendNotification(
          request.hospitalId._id,
          "Facility",
          "Request Accepted ✅",
          `${bloodBank.name} has accepted your request for ${request.units} units of ${request.bloodGroup} blood.`,
          "/hospital/my-requests"
        )
      );
    }

    await Promise.allSettled(jobs);
  } catch (error) {
    console.error("Background accepted-request notification failed:", error.message);
  }
};

const notifyNearbyDonorsForEscalatedRequest = async (requestId) => {
  try {
    const request = await BloodRequest.findById(requestId).select(
      "bloodGroup units location status stage"
    );
    if (!request || request.status !== "active" || request.stage !== "both") {
      return;
    }

    const nearbyDonors = await Donor.find({
      bloodGroup: request.bloodGroup,
      isAvailable: true,
      eligibleToDonate: true,
      location: {
        $near: {
          $geometry: request.location,
          $maxDistance: 10000,
        },
      },
    }).select("_id");

    await Promise.allSettled(
      nearbyDonors.map((donor) =>
        sendNotification(
          donor._id,
          "Donor",
          "URGENT: Blood Needed 🚨",
          `A nearby hospital needs ${request.bloodGroup} blood. All local banks are unavailable. Can you help?`,
          "/donor/nearby-requests"
        )
      )
    );
  } catch (error) {
    console.error("Background donor escalation notification failed:", error.message);
  }
};

// ─────────────────────────────────
// @route  GET /api/bloodbank/profile
// @access Blood Bank only
// ─────────────────────────────────
exports.getProfile = async (req, res) => {
  try {
    const bloodBank = await Facility.findById(req.user.id);
    if (!bloodBank) {
      return res.status(404).json({
        success: false,
        message: "Blood bank not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      bloodBank,
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
// @route  PUT /api/bloodbank/update-profile
// @access Blood Bank only
// ─────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const { phone, emergencyContact, address, operatingHours, is24x7, location } =
      req.body;

    const bloodBank = await Facility.findById(req.user.id);
    if (!bloodBank) {
      return res.status(404).json({
        success: false,
        message: "Blood bank not found",
      });
    }

    if (phone) bloodBank.phone = phone;
    if (emergencyContact) bloodBank.emergencyContact = emergencyContact;
    if (address) bloodBank.address = address;
    if (operatingHours) bloodBank.operatingHours = operatingHours;
    if (is24x7 !== undefined) bloodBank.is24x7 = is24x7;
    if (location) bloodBank.location = location;
    
    await bloodBank.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      bloodBank: {
        id: bloodBank._id,
        name: bloodBank.name,
        phone: bloodBank.phone,
        emergencyContact: bloodBank.emergencyContact,
        address: bloodBank.address,
        operatingHours: bloodBank.operatingHours,
        is24x7: bloodBank.is24x7,
        location: bloodBank.location, 
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
// @route  GET /api/bloodbank/inventory
// @access Blood Bank only
// ─────────────────────────────────
exports.getInventory = async (req, res) => {
  try {
    const now = new Date();

    await BloodStock.updateMany(
      {
        bloodBankId: req.user.id,
        status: "available",
        expiryDate: { $lt: now },
      },
      { status: "expired" },
    );

    const stock = await BloodStock.find({
      bloodBankId: req.user.id,
      status: "available",
    })
      .populate("donorId", "fullName phone")
      .sort({ expiryDate: 1 }); // FEFO

    const summary = {
      "A+": 0, "A-": 0, "B+": 0, "B-": 0,
      "O+": 0, "O-": 0, "AB+": 0, "AB-": 0,
    };

    stock.forEach((batch) => {
      if (summary[batch.bloodGroup] !== undefined) {
        summary[batch.bloodGroup] += batch.units;
      }
    });

    const details = {};
    const bloodGroups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

    bloodGroups.forEach((group) => {
      const batches = stock
        .filter((batch) => batch.bloodGroup === group)
        .map((batch) => {
          const daysRemaining = Math.ceil(
            (new Date(batch.expiryDate) - now) / (1000 * 60 * 60 * 24),
          );
          return {
            batchId: batch._id,
            units: batch.units,
            collectionDate: batch.collectionDate,
            expiryDate: batch.expiryDate,
            daysRemaining,
            expiryStatus:
              daysRemaining <= 7 ? "critical" : daysRemaining <= 15 ? "warning" : "safe",
            donor: batch.donorId,
            source: batch.source,
          };
        });

      details[group] = {
        total: summary[group],
        isLowStock: summary[group] < 5,
        batches,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Inventory fetched successfully",
      summary,
      details,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch inventory",
      error: error.message,
    });
  }
};

// ─────────────────────────────────
// @route  GET /api/bloodbank/donation-requests
// @access Blood Bank only
// ─────────────────────────────────
exports.getDonationRequests = async (req, res) => {
  try {
    const requests = await ProactiveDonation.find({
      bloodBankId: req.user.id,
      status: { $in: ["pending", "invited", "confirmed", "cancelled"] },
    }).populate("donorId", "fullName phone bloodGroup age weight trustScore penaltyUntil");

    const statusOrder = {
      pending: 1,
      invited: 2,
      confirmed: 3,
      cancelled: 4,
    };

    requests.sort((a, b) => {
      const statusDiff = (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
      if (statusDiff !== 0) return statusDiff;

      const aScore = a.donorId?.trustScore || 100;
      const bScore = b.donorId?.trustScore || 100;
      if (aScore !== bScore) return bScore - aScore;

      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return res.status(200).json({
      success: true,
      message: "Donation requests fetched successfully",
      count: requests.length,
      requests,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch donation requests",
      error: error.message,
    });
  }
};

exports.completeCamp = async (req, res) => {
  try {
    await updateCampStatuses();

    const camp = await Camp.findById(req.params.campId);
    if (!camp) {
      return res.status(404).json({
        success: false,
        message: "Camp not found",
      });
    }

    if (camp.bloodBankId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to complete this camp",
      });
    }

    if (camp.status !== "ongoing") {
      return res.status(400).json({
        success: false,
        message: "Camp must be ongoing to complete",
      });
    }

    let totalDonors = 0;
    let totalUnits = 0;

    for (const registeredDonor of camp.registeredDonors) {
      if (registeredDonor.donationStatus === "donated") {

        await BloodStock.create({
          bloodBankId: req.user.id,
          donorId: registeredDonor.donorId,
          bloodGroup: registeredDonor.bloodGroup,
          units: 1,
          source: "camp",
          campId: camp._id,
          status: "available",
          expiryDate: new Date(
            new Date().getTime() + 42 * 24 * 60 * 60 * 1000
          ),
        });

        await TransactionHistory.create({
          bloodBankId: req.user.id,
          transactionType: "stock-in",
          bloodGroup: registeredDonor.bloodGroup,
          units: 1,
          source: "camp",
          donorId: registeredDonor.donorId,
          campId: camp._id,
        });

        const donor = await Donor.findById(registeredDonor.donorId);
        if (donor) {
          donor.lastDonationDate = new Date();
          donor.eligibleToDonate = false;
          donor.donationHistory.push({
            donationDate: new Date(),
            facility: req.user.id,
            donatedTo: "blood-bank",
            bloodGroup: registeredDonor.bloodGroup,
            units: 1,
          });
          await donor.save();

          try {
            await mailSender(
              donor.email,
              "Thank you for your donation at camp - Blood Donation System",
              donationCompletedTemplate(
                donor.fullName,
                camp.name,
                registeredDonor.bloodGroup,
                1,
                "blood-bank"
              )
            );
          } catch (emailError) {
            console.error("Camp donation email failed:", emailError.message);
          }

          // ✅ NEW: In-App Notification to Donor
          await sendNotification(
            donor._id,
            "Donor",
            "You're a Lifesaver! 🩸",
            `Thank you for donating at the ${camp.name} camp. Your contribution matters.`,
            "/donor/donation-history"
          );
        }

        totalDonors++;
        totalUnits += 1;

      } else if (registeredDonor.donationStatus === "registered") {
        registeredDonor.donationStatus = "no-show";
      }
    }

    camp.status = "completed";
    camp.actualDonors = totalDonors;
    await camp.save();

    try {
      const bloodBank = await Facility.findById(req.user.id);
      await mailSender(
        bloodBank.email,
        "Camp Completed Successfully - Blood Donation System",
        campCompletedTemplate(
          bloodBank.name,
          camp.name,
          camp.registeredDonors.length,
          totalDonors,
          camp.registeredDonors.length - totalDonors,
          totalUnits
        )
      );
    } catch (emailError) {
      console.error("Camp completed email failed:", emailError.message);
    }

    return res.status(200).json({
      success: true,
      message: "Camp completed successfully",
      summary: {
        totalRegistered: camp.registeredDonors.length,
        totalDonated: totalDonors,
        totalNoShow: camp.registeredDonors.length - totalDonors,
        totalUnitsCollected: totalUnits,
      },
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to complete camp",
      error: error.message,
    });
  }
};

// ✅ Updated: Process Request (Invite or Decline)
exports.processDonationRequest = async (req, res) => {
  try {
    const { action, declineReason, appointmentDate, slotTime } = req.body;
    
    if (!action || !["invite", "decline"].includes(action)) {
      return res.status(400).json({ success: false, message: "Action must be invite or decline" });
    }

    const donationRequest = await ProactiveDonation.findById(req.params.id);
    if (!donationRequest) return res.status(404).json({ success: false, message: "Request not found" });
    
    // Authorization check
    if (donationRequest.bloodBankId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const donor = await Donor.findById(donationRequest.donorId);
    const bloodBank = await Facility.findById(req.user.id);

    if (action === "invite") {
      if (!appointmentDate || !slotTime) {
        return res.status(400).json({ success: false, message: "Date and Time slot are required" });
      }

      // Prevent past dates
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(appointmentDate) < today) {
        return res.status(400).json({ success: false, message: "Appointment date cannot be in the past." });
      }

      // Update request to 'invited' state
      donationRequest.status = "invited";
      donationRequest.appointmentDate = new Date(appointmentDate);
      donationRequest.slotTime = slotTime;
      // Link the generic status from our model discussion
      // If you are using BloodRequest model for this, ensure the field names match
      donationRequest.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); 
      await donationRequest.save();

      // Notify Donor to Accept/Decline the time
      await sendNotification(
        donor._id, 
        "Donor", 
        "Donation Invite 📅", 
        `${bloodBank.name} invited you for ${new Date(appointmentDate).toDateString()} at ${slotTime}. Please confirm your availability!`, 
        "/donor/my-requests"
      );

      return res.status(200).json({ 
        success: true, 
        message: "Invitation sent. Waiting for donor confirmation.", 
        donationRequest 
      });

    } else {
      // Logic for Decline
      donationRequest.status = "declined";
      donationRequest.declineReason = declineReason;
      await donationRequest.save();
      
      // If medical reason, lock the donor for 30 days
      if (declineReason?.toLowerCase().includes("medical")) {
        donor.medicalLockUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await donor.save();
      }

      await sendNotification(
        donor._id, 
        "Donor", 
        "Request Declined ℹ️", 
        `${bloodBank.name} declined your request. Reason: ${declineReason}. You can try other banks.`, 
        "/donor/donation-history"
      );

      return res.status(200).json({ success: true, message: "Request declined. Donor notified." });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Updated: Complete Donation (Success Case)
exports.completeDonation = async (req, res) => {
  try {
    const { units } = req.body;
    const donationRequest = await ProactiveDonation.findById(req.params.id);

    if (!donationRequest || donationRequest.status !== "confirmed") {
      return res.status(400).json({ 
        success: false, 
        message: "Donation must be confirmed by the donor before marking as complete." 
      });
    }

    // 1. Add Blood to Stock
    await BloodStock.create({
      bloodBankId: req.user.id,
      donorId: donationRequest.donorId,
      bloodGroup: donationRequest.bloodGroup,
      units: units || 1,
      source: "proactive",
      status: "available",
      expiryDate: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000)
    });

    // 2. Update Donor Stats & Start Cooldown
    const donor = await Donor.findById(donationRequest.donorId);
    donor.lastDonationDate = new Date();
    donor.eligibleToDonate = false; // Trigger 90-day virtual cooldown
    donor.donationHistory.push({
      donationDate: new Date(),
      facility: req.user.id,
      donatedTo: "blood-bank",
      bloodGroup: donationRequest.bloodGroup,
      units: units || 1
    });
    
    // Boost trust score for successful donation (cap at 100)
    donor.trustScore = Math.min(100, (donor.trustScore || 100) + 5);
    await donor.save();

    // 3. Finalize Request Status
    donationRequest.status = "completed";
    await donationRequest.save();

    await sendNotification(
      donor._id,
      "Donor",
      "Donation Successful! 🩸",
      "Thank you for your donation. Your blood has been added to our stock to save lives.",
      "/donor/donation-history"
    );

    return res.status(200).json({ success: true, message: "Donation completed. Stock and Donor profile updated." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Updated: Mark No-Show (Penalty Case)
exports.markNoShow = async (req, res) => {
  try {
    const donationRequest = await ProactiveDonation.findById(req.params.id);
    if (!donationRequest || donationRequest.status !== "confirmed") {
      return res.status(400).json({ success: false, message: "Only confirmed appointments can be marked as No-Show." });
    }

    donationRequest.status = "no-show";
    await donationRequest.save();

    const donor = await Donor.findById(donationRequest.donorId);

    // Penalty: drop trust score and apply temporary lock window.
    donor.trustScore = Math.max(0, (donor.trustScore || 100) - 15);

    const now = new Date();
    const temporaryPenaltyDays = 7;
    const severePenaltyDays = 30;
    const lockDays = donor.trustScore < 40 ? severePenaltyDays : temporaryPenaltyDays;
    donor.penaltyUntil = new Date(now.getTime() + lockDays * 24 * 60 * 60 * 1000);

    // Re-enable future donation flow after penalty period.
    donor.eligibleToDonate = true; 

    await donor.save();

    await sendNotification(
      donor._id,
      "Donor",
      "Missed Appointment ⚠️",
      `You missed your scheduled donation. Your trust score has been reduced and your account is restricted until ${donor.penaltyUntil.toDateString()}.`,
      "/donor/my-requests"
    );

    return res.status(200).json({ success: true, message: "No-Show recorded. Trust score penalized." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
// ─────────────────────────────────
// @route  POST /api/bloodbank/inventory/update
// @access Blood Bank only
// ─────────────────────────────────
exports.updateInventory = async (req, res) => {
  try {
    const { bloodGroup, units, action, source, reason, donorPhone } = req.body;

    if (!bloodGroup || !units || !action) {
      return res.status(400).json({
        success: false,
        message: "Please provide bloodGroup, units and action",
      });
    }

    if (!["add", "remove"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action must be add or remove",
      });
    }

    const validBloodGroups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
    if (!validBloodGroups.includes(bloodGroup)) {
      return res.status(400).json({
        success: false,
        message: "Invalid blood group",
      });
    }

    if (action === "remove" && !reason) {
      return res.status(400).json({
        success: false,
        message: "Please provide reason for removal",
      });
    }

    if (action === "add") {
      let donorId = null;
      if (donorPhone) {
        const donor = await Donor.findOne({ phone: donorPhone });

        if (donor && units > 1) {
          return res.status(400).json({
            success: false,
            message: "A single walk-in donor can only donate 1 unit at a time",
          });
        }

        if (donor) {
          donorId = donor._id;
          donor.lastDonationDate = new Date();
          donor.eligibleToDonate = false;
          donor.donationHistory.push({
            donationDate: new Date(),
            facility: req.user.id,
            donatedTo: "blood-bank",
            bloodGroup,
            units,
          });
          await donor.save();
        }
      }

      await BloodStock.create({
        bloodBankId: req.user.id,
        donorId,
        bloodGroup,
        units,
        source: source || "manual",
        status: "available",
      });

      await TransactionHistory.create({
        bloodBankId: req.user.id,
        transactionType: "stock-in",
        bloodGroup,
        units,
        source: source || "manual",
        donorId,
        reason: reason || "Manual stock addition",
      });

      return res.status(201).json({
        success: true,
        message: `${units} units of ${bloodGroup} added successfully`,
      });

    } else if (action === "remove") {
      const availableStock = await BloodStock.find({
        bloodBankId: req.user.id,
        bloodGroup,
        status: "available",
      }).sort({ expiryDate: 1 }); // FEFO

      const totalAvailable = availableStock.reduce(
        (sum, batch) => sum + batch.units,
        0,
      );

      if (totalAvailable < units) {
        return res.status(400).json({
          success: false,
          message: `Not enough stock. Available: ${totalAvailable} units`,
        });
      }

      let unitsToRemove = units;
      for (const batch of availableStock) {
        if (unitsToRemove <= 0) break;

        if (batch.units <= unitsToRemove) {
          unitsToRemove -= batch.units;
          await BloodStock.updateOne(
            { _id: batch._id },
            {
              status: "used",
              removalReason: reason,
            }
          );
        } else {
          batch.units -= unitsToRemove;
          batch.removalReason = reason;
          unitsToRemove = 0;
          await batch.save();
        }
      }

      await TransactionHistory.create({
        bloodBankId: req.user.id,
        transactionType: "stock-out",
        bloodGroup,
        units,
        source: "manual",
        reason,
      });

      return res.status(200).json({
        success: true,
        message: `${units} units of ${bloodGroup} removed successfully`,
        reason,
      });
    }
  } catch (error) {
    console.error("updateInventory error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update inventory",
      error: error.message,
    });
  }
};

// ─────────────────────────────────
// @route  PUT /api/bloodbank/camp/:campId/attendance/:donorId
// @access Blood Bank only
// ─────────────────────────────────
exports.markDonorAttendance = async (req, res) => {
  try {
    await updateCampStatuses();

    const { bloodGroup } = req.body;
    const units = 1;

    if (!bloodGroup) {
      return res.status(400).json({
        success: false,
        message: "Please provide bloodGroup",
      });
    }

    const validBloodGroups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
    if (!validBloodGroups.includes(bloodGroup)) {
      return res.status(400).json({
        success: false,
        message: "Invalid blood group",
      });
    }

    const camp = await Camp.findById(req.params.campId);
    if (!camp) {
      return res.status(404).json({
        success: false,
        message: "Camp not found",
      });
    }

    if (camp.bloodBankId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to manage this camp",
      });
    }

    if (camp.status !== "ongoing") {
      return res.status(400).json({
        success: false,
        message: "Camp must be ongoing to mark attendance",
      });
    }

    const donorIndex = camp.registeredDonors.findIndex(
      (d) => d.donorId.toString() === req.params.donorId,
    );
    if (donorIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Donor not registered for this camp",
      });
    }

    if (camp.registeredDonors[donorIndex].donationStatus === "donated") {
      return res.status(400).json({
        success: false,
        message: "Donor already marked as donated",
      });
    }

    camp.registeredDonors[donorIndex].donationStatus = "donated";
    camp.registeredDonors[donorIndex].bloodGroup = bloodGroup;
    camp.registeredDonors[donorIndex].units = units;
    await camp.save();

    return res.status(200).json({
      success: true,
      message: "Donor attendance marked successfully",
      donor: {
        donorId: req.params.donorId,
        donationStatus: "donated",
        bloodGroup,
        units,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to mark attendance",
      error: error.message,
    });
  }
};

// ─────────────────────────────────
// @route  GET /api/bloodbank/blood-requests
// @access Blood Bank only
// ─────────────────────────────────
exports.getIncomingBloodRequests = async (req, res) => {
  try {
    await updateBloodRequestStages();

    const bloodBank = await Facility.findById(req.user.id);
    if (!bloodBank) {
      return res.status(404).json({
        success: false,
        message: "Blood bank not found",
      });
    }

    const requests = await BloodRequest.find({
      status: "active",
      stage: { $in: ["bloodbank", "both"] },
      deadline: { $gt: new Date() },
      declinedByBloodBanks: { $nin: [req.user.id] },
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: bloodBank.location.coordinates,
          },
          $maxDistance: 50000,
        },
      },
    }).populate("hospitalId", "name phone address");

    const requestsWithStock = await Promise.all(
      requests.map(async (request) => {
        const availableStock = await BloodStock.find({
          bloodBankId: req.user.id,
          bloodGroup: request.bloodGroup,
          status: "available",
        });

        const totalAvailable = availableStock.reduce(
          (sum, batch) => sum + batch.units,
          0,
        );

        return {
          ...request.toObject(),
          availableStock: totalAvailable,
          canFulfill: totalAvailable >= request.units,
        };
      }),
    );

    return res.status(200).json({
      success: true,
      message: "Incoming blood requests fetched successfully",
      count: requestsWithStock.length,
      requests: requestsWithStock,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch blood requests",
      error: error.message,
    });
  }
};

// ─────────────────────────────────
// @route  PUT /api/bloodbank/blood-requests/:id/respond
// @access Blood Bank only
// ─────────────────────────────────
exports.respondToBloodRequest = async (req, res) => {
  try {
    const { action, declineReason } = req.body;

    if (!action || !["accept", "decline"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action must be accept or decline",
      });
    }

    const request = await BloodRequest.findById(req.params.id).populate(
      "hospitalId", "name email phone address",
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
        message: request.status === "confirmed"
          ? "This request is already fulfilled by another blood bank"
          : "This request is no longer active",
      });
    }

    if (new Date() > request.deadline) {
      return res.status(400).json({
        success: false,
        message: "This request has expired",
      });
    }

    if (!["bloodbank", "both"].includes(request.stage)) {
      return res.status(400).json({
        success: false,
        message: "This request is no longer available for blood banks",
      });
    }

    if (action === "decline") {
      let shouldNotifyDonors = false;

      if (!request.declinedByBloodBanks.includes(req.user.id)) {
        request.declinedByBloodBanks.push(req.user.id);
      }

      // Find all approved nearby blood banks
      const nearbyBanks = await Facility.find({
        facilityType: "blood-bank",
        status: "approved",
        isActive: true,
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: request.location.coordinates,
            },
            $maxDistance: 50000,
          },
        },
      });

      // ✅ Logic to check if all banks have declined and notify donors
      if (nearbyBanks.length > 0 && request.units === 1) {
        const nearbyBankIds = nearbyBanks.map((b) => b._id.toString());
        const declinedIds = request.declinedByBloodBanks.map((id) => id.toString());
        const allDeclined = nearbyBankIds.every((id) => declinedIds.includes(id));

        if (allDeclined && request.stage === "bloodbank") {
          request.stage = "both";
          request.stageUpdatedAt = new Date();
          shouldNotifyDonors = true;
        }
      }

      await request.save();

      res.status(200).json({
        success: true,
        message: "Blood request declined",
      });

      if (shouldNotifyDonors) {
        notifyNearbyDonorsForEscalatedRequest(request._id).catch((error) => {
          console.error("Donor escalation dispatch failed:", error.message);
        });
      }

      return;
    }

    if (action === "accept") {
      const availableStock = await BloodStock.find({
        bloodBankId: req.user.id,
        bloodGroup: request.bloodGroup,
        status: "available",
      }).sort({ expiryDate: 1 });

      const totalAvailable = availableStock.reduce(
        (sum, batch) => sum + batch.units, 0,
      );

      if (totalAvailable < request.units) {
        return res.status(400).json({
          success: false,
          message: `Not enough stock. Available: ${totalAvailable} units. Required: ${request.units} units`,
        });
      }

      let unitsToDeduct = request.units;
      for (const batch of availableStock) {
        if (unitsToDeduct <= 0) break;
        if (batch.units <= unitsToDeduct) {
          unitsToDeduct -= batch.units;
          await BloodStock.updateOne(
            { _id: batch._id },
            { status: "used", removalReason: "Hospital blood request fulfilled" }
          );
        } else {
          batch.units -= unitsToDeduct;
          batch.removalReason = "Hospital blood request fulfilled";
          unitsToDeduct = 0;
          await batch.save();
        }
      }

      await TransactionHistory.create({
        bloodBankId: req.user.id,
        transactionType: "stock-out",
        bloodGroup: request.bloodGroup,
        units: request.units,
        source: "hospital",
        hospitalId: request.hospitalId?._id || request.hospitalId,
        requestId: request._id,
        reason: "Hospital blood request fulfilled",
      });

      request.status = "confirmed";
      request.respondedBy = {
        responderType: "bloodbank",
        responderId: req.user.id,
      };
      await request.save();

      const bloodBank = await Facility.findById(req.user.id);

      const responsePayload = {
        success: true,
        message: "Blood request accepted. Blood packed and ready for dispatch.",
        request: {
          id: request._id,
          bloodGroup: request.bloodGroup,
          units: request.units,
          status: request.status,
          hospital: {
            name: request.hospitalId?.name,
            phone: request.hospitalId?.phone,
            address: request.hospitalId?.address,
          },
        },
      };

      res.status(200).json(responsePayload);

      notifyHospitalRequestAccepted(request, bloodBank).catch((error) => {
        console.error("Hospital acceptance notification dispatch failed:", error.message);
      });

      return;
    }

  } catch (error) {
    console.error("respondToBloodRequest error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to respond to blood request",
      error: error.message,
    });
  }
};
// ─────────────────────────────────
// @route  PUT /api/bloodbank/blood-requests/:id/complete
// @access Blood Bank only
// ─────────────────────────────────
exports.completeBloodRequest = async (req, res) => {
  try {
    const request = await BloodRequest.findById(req.params.id).populate(
      "hospitalId",
      "name email phone address",
    );
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Blood request not found",
      });
    }

    if (request.respondedBy.responderId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to complete this request",
      });
    }

    if (request.status !== "confirmed") {
      return res.status(400).json({
        success: false,
        message: "Request must be confirmed before completing",
      });
    }

    request.status = "completed";
    request.completedAt = new Date();
    await request.save();

    // ✅ NEW: In-App Notification to Hospital
    try {
      const bloodBank = await Facility.findById(req.user.id);
      await sendNotification(
        request.hospitalId._id,
        "Facility",
        "Blood Dispatched 🚐",
        `${bloodBank.name} has marked your order for ${request.units} units of ${request.bloodGroup} as complete and dispatched.`,
        "/hospital/my-requests"
      );
    } catch (err) {
      console.error("Notification failed", err);
    }

    return res.status(200).json({
      success: true,
      message: "Blood request completed. Blood delivered to hospital.",
      request: {
        id: request._id,
        bloodGroup: request.bloodGroup,
        units: request.units,
        status: request.status,
        completedAt: request.completedAt,
        hospital: {
          name: request.hospitalId.name,
          phone: request.hospitalId.phone,
          address: request.hospitalId.address,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to complete blood request",
      error: error.message,
    });
  }
};

// ─────────────────────────────────
// @route  POST /api/bloodbank/camp/create
// @access Blood Bank only
// ─────────────────────────────────
exports.createCamp = async (req, res) => {
  try {
    const {
      name,
      description,
      address,
      location,
      campDate,
      startTime,
      endTime,
      capacity,
    } = req.body;

    if (
      !name || !address || !location || !campDate ||
      !startTime || !endTime || !capacity
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(campDate) < today) {
      return res.status(400).json({
        success: false,
        message: "Camp date cannot be in the past",
      });
    }

    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return res.status(400).json({
        success: false,
        message: "Time must be in HH:MM format",
      });
    }

    if (endTime <= startTime) {
      return res.status(400).json({
        success: false,
        message: "End time must be after start time",
      });
    }

    const camp = await Camp.create({
      bloodBankId: req.user.id,
      name,
      description,
      address,
      location,
      campDate,
      startTime,
      endTime,
      capacity,
      status: "upcoming",
    });

    // ✅ NEW: Automatically notify donors within 10km radius
    try {
      const bloodBank = await Facility.findById(req.user.id);
      const nearbyDonors = await Donor.find({
        location: {
          $near: {
            $geometry: location,
            $maxDistance: 10000 // 10km radius
          }
        },
        isActive: true
      }).select('_id');

      // Send to all nearby donors asynchronously so it doesn't block the response
      Promise.all(
        nearbyDonors.map(donor =>
          sendNotification(
            donor._id,
            "Donor",
            "New Camp Near You ⛺",
            `${bloodBank.name} is hosting a blood donation camp in your area on ${new Date(campDate).toLocaleDateString()}. Register now to save lives!`,
            `/donor/nearby-camps`
          )
        )
      ).catch(err => console.error("Camp background notification error:", err));
    } catch (notifError) {
      console.error("Failed to find nearby donors for notification:", notifError);
    }

    return res.status(201).json({
      success: true,
      message: "Camp created successfully",
      camp,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create camp",
      error: error.message,
    });
  }
};

// ─────────────────────────────────
// @route  GET /api/bloodbank/camps
// @access Blood Bank only
// ─────────────────────────────────
exports.getMyCamps = async (req, res) => {
  try {
    const { status } = req.query;

    await updateCampStatuses();

    const filter = {
      bloodBankId: req.user.id,
    };

    if (status) {
      filter.status = status;
    }

    const camps = await Camp.find(filter).sort({ campDate: -1 });

    const campsWithSeats = camps.map((camp) => ({
      ...camp.toObject(),
      availableSeats: camp.capacity - camp.registeredDonors.length,
    }));

    return res.status(200).json({
      success: true,
      message: "Camps fetched successfully",
      count: camps.length,
      camps: campsWithSeats,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch camps",
      error: error.message,
    });
  }
};

// ─────────────────────────────────
// @route  GET /api/bloodbank/camp/:campId/donors
// @access Blood Bank only
// ─────────────────────────────────
exports.getCampRegisteredDonors = async (req, res) => {
  try {
    const camp = await Camp.findById(req.params.campId).populate(
      "registeredDonors.donorId",
      "fullName phone bloodGroup age weight",
    );

    if (!camp) {
      return res.status(404).json({
        success: false,
        message: "Camp not found",
      });
    }

    if (camp.bloodBankId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this camp",
      });
    }

    const registered = camp.registeredDonors.filter(
      (d) => d.donationStatus === "registered",
    );
    const donated = camp.registeredDonors.filter(
      (d) => d.donationStatus === "donated",
    );
    const noShow = camp.registeredDonors.filter(
      (d) => d.donationStatus === "no-show",
    );

    return res.status(200).json({
      success: true,
      message: "Camp donors fetched successfully",
      camp: {
        name: camp.name,
        status: camp.status,
        capacity: camp.capacity,
      },
      summary: {
        totalRegistered: camp.registeredDonors.length,
        donated: donated.length,
        pending: registered.length,
        noShow: noShow.length,
      },
      donors: {
        registered,
        donated,
        noShow,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch camp donors",
      error: error.message,
    });
  }
};

// ─────────────────────────────────
// @route  PUT /api/bloodbank/camp/:campId/status
// @access Blood Bank only
// ─────────────────────────────────
exports.updateCampStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (status !== "cancelled") {
      return res.status(400).json({
        success: false,
        message:
          "Only cancellation is allowed manually. Other statuses are automatic.",
      });
    }

    const camp = await Camp.findById(req.params.campId);
    if (!camp) {
      return res.status(404).json({
        success: false,
        message: "Camp not found",
      });
    }

    if (camp.bloodBankId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this camp",
      });
    }

    if (camp.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel completed camp",
      });
    }

    if (camp.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Camp is already cancelled",
      });
    }

    camp.status = "cancelled";
    await camp.save();

    return res.status(200).json({
      success: true,
      message: "Camp cancelled successfully",
      camp,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update camp status",
      error: error.message,
    });
  }
};

// ─────────────────────────────────
// @route  GET /api/bloodbank/transactions
// @access Blood Bank only
// ─────────────────────────────────
exports.getTransactionHistory = async (req, res) => {
  try {
    const { type, bloodGroup, startDate, endDate } = req.query;

    const filter = {
      bloodBankId: req.user.id,
    };

    if (type) {
      filter.transactionType = type;
    }

    if (bloodGroup) {
      filter.bloodGroup = bloodGroup;
    }

    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const transactions = await TransactionHistory.find(filter)
      .populate("donorId", "fullName phone bloodGroup")
      .populate("hospitalId", "name phone address")
      .populate("campId", "name startDate address")
      .sort({ createdAt: -1 });

    const stockIn = transactions
      .filter((t) => t.transactionType === "stock-in")
      .reduce((sum, t) => sum + t.units, 0);

    const stockOut = transactions
      .filter((t) => t.transactionType === "stock-out")
      .reduce((sum, t) => sum + t.units, 0);

    return res.status(200).json({
      success: true,
      message: "Transaction history fetched successfully",
      summary: {
        totalStockIn: stockIn,
        totalStockOut: stockOut,
        netUnits: stockIn - stockOut,
      },
      count: transactions.length,
      transactions,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch transaction history",
      error: error.message,
    });
  }
};

// ─────────────────────────────────
// @route  GET /api/bloodbank/blood-requests/accepted
// @access Blood Bank only
// ─────────────────────────────────
exports.getAcceptedBloodRequests = async (req, res) => {
  try {
    const requests = await BloodRequest.find({
      status: "confirmed",
      "respondedBy.responderType": "bloodbank",
      "respondedBy.responderId": req.user.id,
    }).populate("hospitalId", "name phone address");

    return res.status(200).json({
      success: true,
      message: "Accepted blood requests fetched successfully",
      count: requests.length,
      requests,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch accepted requests",
      error: error.message,
    });
  }
};

// ─────────────────────────────────
// @route  GET /api/bloodbank/hospital-locations
// @access Blood Bank only
// ─────────────────────────────────
exports.getHospitalLocations = async (req, res) => {
  try {
    const bloodBank = await Facility.findById(req.user.id);
    if (!bloodBank) {
      return res.status(404).json({ success: false, message: "Blood bank not found" });
    }

    if (!bloodBank.location || !bloodBank.location.coordinates || bloodBank.location.coordinates[0] === 0) {
      return res.status(400).json({
        success: false,
        message: "Blood bank location not set. Please update profile first.",
      });
    }

    // 1. Get hospitals with active blood requests near this bank
    const activeRequests = await BloodRequest.find({
      status: "active",
      stage: { $in: ["bloodbank", "both"] },
      deadline: { $gt: new Date() },
      declinedByBloodBanks: { $nin: [req.user.id] },
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: bloodBank.location.coordinates,
          },
          $maxDistance: 50000,
        },
      },
    }).populate("hospitalId", "name phone address location");

    // Format hospital data with request details
    const hospitals = activeRequests.map((req) => ({
      requestId: req._id,
      hospital: req.hospitalId,
      bloodGroup: req.bloodGroup,
      units: req.units,
      urgencyLevel: req.urgencyLevel,
      deadline: req.deadline,
      location: req.location,
    }));

    // 2. Get proactive donors with pending/confirmed requests at this bank
    const donorRequests = await ProactiveDonation.find({
      bloodBankId: req.user.id,
      status: { $in: ["pending", "confirmed"] },
    }).populate("donorId", "fullName phone bloodGroup location");

    const donors = donorRequests
      .filter((d) => d.donorId?.location?.coordinates?.[0] !== 0)
      .map((d) => ({
        requestId: d._id,
        donor: {
          _id: d.donorId._id,
          fullName: d.donorId.fullName,
          phone: d.donorId.phone,
          bloodGroup: d.donorId.bloodGroup,
          location: d.donorId.location,
        },
        status: d.status,
      }));

    return res.status(200).json({
      success: true,
      message: "Map data fetched",
      hospitals,
      donors,
      bankLocation: bloodBank.location,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch map data",
      error: error.message,
    });
  }
};
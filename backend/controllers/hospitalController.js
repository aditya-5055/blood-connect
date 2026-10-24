
const Facility = require("../models/facilityModel");
const BloodRequest = require("../models/bloodRequestModel");
const Notification = require("../models/notificationModel");
const Donor = require("../models/donorModel");
const BloodStock = require("../models/bloodStockModel");
const mailSender = require("../utils/mailSender");
const donationCompletedTemplate = require("../mail/templates/donationCompletedTemplate");
const newHospitalRequestTemplate = require("../mail/templates/newHospitalRequestTemplate");
const bloodRequestAcceptedTemplate = require("../mail/templates/bloodRequestAcceptedTemplate");
const bloodRequestExpiredTemplate = require("../mail/templates/bloodRequestExpiredTemplate");

// ✅ NEW: Import the notification utility
const sendNotification = require("../utils/sendNotification");
const { getBloodBankRadius } = require("../utils/requestRadius");

const notifyNearbyBanksForRequest = async (hospital, bloodRequest) => {
  try {
    const latestRequest = await BloodRequest.findById(bloodRequest._id)
      .select("status assignedBloodBanks")
      .populate("assignedBloodBanks.bloodBankId", "_id name email");
      
    if (!latestRequest || latestRequest.status !== "active") {
      return;
    }

    const assignedBanks = latestRequest.assignedBloodBanks
      .map((entry) => entry.bloodBankId)
      .filter((bank) => bank != null);

    const notificationJobs = assignedBanks.map(async (bank) => {
      const currentRequest = await BloodRequest.findById(bloodRequest._id).select("status");
      if (!currentRequest || currentRequest.status !== "active") {
        return;
      }

      if (mailSender) {
        await mailSender(
          bank.email,
          "New Blood Request - Action Required",
          newHospitalRequestTemplate(
            bank.name,
            hospital.name,
            bloodRequest.bloodGroup,
            bloodRequest.units,
            bloodRequest.urgencyLevel,
            bloodRequest.deadline
          )
        );
      }

      if (sendNotification) {
        await sendNotification(
          bank._id,
          "Facility",
          "Urgent Hospital Request 🏥",
          `${hospital.name} needs ${bloodRequest.units} units of ${bloodRequest.bloodGroup}.`,
          "/bloodbank/blood-requests",
          { relatedRequest: bloodRequest._id }
        );
      }
    });

    await Promise.allSettled(notificationJobs);
  } catch (error) {
    console.error("Non-critical nearby-bank notification error:", error.message);
  }
};

// ─────────────────────────────────
// @route  GET /api/hospital/profile
// @access Hospital only
// ─────────────────────────────────
exports.getProfile = async (req, res) => {
  try {
    const hospital = await Facility.findById(req.user.id);
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      hospital,
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
// @route  PUT /api/hospital/update-profile
// @access Hospital only
// ─────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const { phone, emergencyContact, address, operatingHours, location } = req.body;

    const hospital = await Facility.findById(req.user.id);
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found",
      });
    }

    if (phone) hospital.phone = phone;
    if (emergencyContact) hospital.emergencyContact = emergencyContact;
    if (address) hospital.address = address;
    if (operatingHours) hospital.operatingHours = operatingHours;
    if (location) hospital.location = location; 

    await hospital.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      hospital: {
        id: hospital._id,
        name: hospital.name,
        phone: hospital.phone,
        emergencyContact: hospital.emergencyContact,
        address: hospital.address,
        operatingHours: hospital.operatingHours,
        location: hospital.location,
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
// @route  GET /api/hospital/blood-requests
// @access Hospital only
// ─────────────────────────────────
exports.getMyRequests = async (req, res) => {
  try {
    const { status } = req.query;

    const filter = { hospitalId: req.user.id };
    if (status) filter.status = status;

    const requests = await BloodRequest.find(filter)
      .sort({ createdAt: -1 });

    const formattedRequests = await Promise.all(
      requests.map(async (request) => {
        const obj = request.toObject();

        let responderDetails = null;

        if (obj.respondedBy?.responderId) {
          try {
            if (obj.respondedBy.responderType === "bloodbank") {
              const Facility = require("../models/facilityModel");
              const facility = await Facility.findById(
                obj.respondedBy.responderId
              ).select("name phone address");
              if (facility) {
                responderDetails = {
                  responderType: "bloodbank",
                  responderId: {
                    _id: facility._id,
                    name: facility.name,
                    phone: facility.phone,
                    address: facility.address,
                  },
                };
              }
            } else if (obj.respondedBy.responderType === "donor") {
              const Donor = require("../models/donorModel");
              const donor = await Donor.findById(
                obj.respondedBy.responderId
              ).select("fullName phone bloodGroup");
              if (donor) {
                responderDetails = {
                  responderType: "donor",
                  responderId: {
                    _id: donor._id,
                    fullName: donor.fullName,
                    phone: donor.phone,
                    bloodGroup: donor.bloodGroup,
                  },
                };
              }
            }
          } catch (err) {
            console.error("Failed to fetch responder:", err.message);
          }
        }

        return {
          id: obj._id,
          bloodGroup: obj.bloodGroup,
          units: obj.units,
          urgencyLevel: obj.urgencyLevel,
          status: obj.status,
          stage: obj.stage,
          deadline: obj.deadline,
          notes: obj.notes,
          createdAt: obj.createdAt,
          completedAt: obj.completedAt,
          respondedBy: responderDetails,
        };
      })
    );

    return res.status(200).json({
      success: true,
      message: "Blood requests fetched successfully",
      count: formattedRequests.length,
      requests: formattedRequests,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch blood requests",
      error: error.message,
    });
  }
};


 
 exports.postBloodRequest = async (req, res) => {
  try {
    const { bloodGroup, units, urgencyLevel, notes } = req.body;

    // 1. Validation
    if (!bloodGroup || !units || !urgencyLevel) {
      return res.status(400).json({
        success: false,
        message: "Please provide bloodGroup, units and urgencyLevel",
      });
    }

    // 2. Fetch Hospital & Location
    const hospital = await Facility.findById(req.user.id);
    if (!hospital) {
      return res.status(404).json({ success: false, message: "Hospital not found" });
    }

    if (!hospital.location || !hospital.location.coordinates || hospital.location.coordinates[0] === 0) {
      return res.status(400).json({
        success: false,
        message: "Hospital location not set. Please update profile first.",
      });
    }

    // 3. Find nearby blood banks using existing GeoJSON search and urgency radius
    const nearbyBanks = await Facility.find({
      facilityType: "blood-bank",
      status: "approved",
      isActive: true,
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: hospital.location.coordinates },
          $maxDistance: getBloodBankRadius(urgencyLevel),
        },
      },
    }).select("_id");

    const assignedBloodBanks = nearbyBanks.map((bank) => ({
      bloodBankId: bank._id,
      assignedAt: new Date(),
    }));

    // 4. Create Request (Standardizing data to prevent Schema errors)
    const bloodRequest = await BloodRequest.create({
      hospitalId: req.user.id,
      bloodGroup: bloodGroup.trim(),
      units: Number(units),
      urgencyLevel,
      notes: notes || "",
      status: "active",
      stage: "bloodbank",
      location: hospital.location,
      assignedBloodBanks,
      // Fallback deadline (24h) if your pre-save hook isn't working
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000) 
    });

    const responsePayload = {
      success: true,
      message: "Blood request posted successfully.",
      bloodRequest,
    };

    // Respond immediately; notify nearby banks in background so UI is not blocked.
    res.status(201).json(responsePayload);

    notifyNearbyBanksForRequest(hospital, bloodRequest).catch((error) => {
      console.error("Background notification task failed:", error.message);
    });

    return;

  } catch (error) {
    // 🔍 THIS WILL TELL US EXACTLY WHAT IS WRONG IN THE TERMINAL
    console.log("========= BACKEND CRASH LOG =========");
    console.error("ERROR MESSAGE:", error.message);
    console.error("ERROR STACK:", error.stack);
    console.log("=====================================");

    return res.status(500).json({
      success: false,
      message: "Failed to post blood request",
      error: error.message,
    });
  }
};

// ─────────────────────────────────
// @route  PUT /api/hospital/blood-request/:id/cancel
// @access Hospital only
// ─────────────────────────────────
exports.cancelRequest = async (req, res) => {
  try {
    const request = await BloodRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Blood request not found",
      });
    }

    if (request.hospitalId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this request",
      });
    }

    if (request.status !== "active") {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel ${request.status} request`,
      });
    }

    request.status = "cancelled";
    await request.save();

    await Notification.deleteMany({
      recipientModel: "Facility",
      relatedRequest: request._id,
    });

    return res.status(200).json({
      success: true,
      message: "Blood request cancelled successfully",
      request: {
        id: request._id,
        bloodGroup: request.bloodGroup,
        units: request.units,
        status: request.status,
      },
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to cancel request",
      error: error.message,
    });
  }
};


// ─────────────────────────────────
// @route  GET /api/hospital/blood-request/:id/status
// @access Hospital only
// ─────────────────────────────────
exports.getRequestStatus = async (req, res) => {
  try {
    const request = await BloodRequest.findById(req.params.id)
      .populate("hospitalId", "name phone address")
      .populate("respondedBy.responderId");

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Blood request not found",
      });
    }

    if (request.hospitalId._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this request",
      });
    }

    let responderDetails = null;
    if (request.respondedBy && request.respondedBy.responderId) {
      if (request.respondedBy.responderType === "bloodbank") {
        responderDetails = {
          type: "bloodbank",
          name: request.respondedBy.responderId.name,
          phone: request.respondedBy.responderId.phone,
          address: request.respondedBy.responderId.address,
        };
      } else if (request.respondedBy.responderType === "donor") {
        responderDetails = {
          type: "donor",
          name: request.respondedBy.responderId.fullName,
          phone: request.respondedBy.responderId.phone,
          bloodGroup: request.respondedBy.responderId.bloodGroup,
        };
      }
    }

    const now = new Date();
    const timeRemaining = request.deadline - now;
    const hoursRemaining = Math.max(
      0,
      Math.floor(timeRemaining / (1000 * 60 * 60))
    );
    const minutesRemaining = Math.max(
      0,
      Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60))
    );

    return res.status(200).json({
      success: true,
      message: "Request status fetched successfully",
      request: {
        id: request._id,
        bloodGroup: request.bloodGroup,
        units: request.units,
        urgencyLevel: request.urgencyLevel,
        status: request.status,
        stage: request.stage,
        notes: request.notes,
        deadline: request.deadline,
        timeRemaining: request.status === "active"
          ? `${hoursRemaining}h ${minutesRemaining}m remaining`
          : null,
        currentStage: request.status === "active"
          ? request.stage === "bloodbank"
            ? "Searching nearby blood banks"
            : "Searching nearby donors"
          : null,
        responder: responderDetails,
        completedAt: request.completedAt,
        createdAt: request.createdAt,
      },
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch request status",
      error: error.message,
    });
  }
};

// ─────────────────────────────────
// @route  PUT /api/hospital/blood-request/:id/complete
// @access Hospital only
// ─────────────────────────────────
exports.completeBloodRequest = async (req, res) => {
  try {
    const TransactionHistory = require("../models/transactionHistoryModel");
    const Donor = require("../models/donorModel");

    const request = await BloodRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Blood request not found",
      });
    }

    if (request.hospitalId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to complete this request",
      });
    }

    if (request.status !== "confirmed") {
      return res.status(400).json({
        success: false,
        message: "Only confirmed requests can be completed",
      });
    }

    if (request.respondedBy.responderType !== "donor") {
      return res.status(400).json({
        success: false,
        message: "This request was fulfilled by a blood bank. Blood bank must mark it complete.",
      });
    }

    const donor = await Donor.findById(request.respondedBy.responderId);
    if (!donor) {
      return res.status(404).json({
        success: false,
        message: "Donor not found",
      });
    }

    donor.lastDonationDate = new Date();
    donor.eligibleToDonate = false;
    donor.donationHistory.push({
      donationDate: new Date(),
      facility: req.user.id,
      donatedTo: "hospital",
      bloodGroup: donor.bloodGroup,
      units: request.units,
    });
    await donor.save();

    request.status = "completed";
    request.completedAt = new Date();
    await request.save();

    try {
      const hospital = await Facility.findById(req.user.id);
      await mailSender(
        donor.email,
        "Thank you for your donation - Blood Donation System",
        donationCompletedTemplate(
          donor.fullName,
          hospital.name,
          donor.bloodGroup,
          request.units,
          "hospital"
        )
      );

      // ✅ NEW: In-App Notification to the Donor directly from Hospital
      await sendNotification(
        donor._id,
        "Donor",
        "You're a Lifesaver! 🩸",
        `Thank you for directly fulfilling our urgent request at ${hospital.name}. Your contribution matters.`,
        "/donor/donation-history"
      );
    } catch (emailError) {
      console.error("Donation completed email failed:", emailError.message);
    }

    return res.status(200).json({
      success: true,
      message: "Blood request completed successfully. Donor donation recorded.",
      request: {
        id: request._id,
        bloodGroup: request.bloodGroup,
        units: request.units,
        status: request.status,
        completedAt: request.completedAt,
        donor: {
          name: donor.fullName,
          phone: donor.phone,
          bloodGroup: donor.bloodGroup,
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
// @route  GET /api/hospital/nearby-bloodbanks
// @access Hospital only
// ─────────────────────────────────
exports.getNearbyBloodBanks = async (req, res) => {
  try {
    const hospital = await Facility.findById(req.user.id);
    if (!hospital) {
      return res.status(404).json({ success: false, message: "Hospital not found" });
    }

    if (!hospital.location || !hospital.location.coordinates || hospital.location.coordinates[0] === 0) {
      return res.status(400).json({
        success: false,
        message: "Hospital location not set. Please update profile first.",
      });
    }

    const bloodBanks = await Facility.find({
      facilityType: "blood-bank",
      status: "approved",
      isActive: true,
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: hospital.location.coordinates,
          },
          $maxDistance: 50000, // 50km
        },
      },
    });

    // Fetch stock summary for each bank
    const banksWithStock = await Promise.all(
      bloodBanks.map(async (bank) => {
        const stock = await BloodStock.find({
          bloodBankId: bank._id,
          status: "available",
        });

        const stockSummary = {
          "A+": 0, "A-": 0, "B+": 0, "B-": 0,
          "O+": 0, "O-": 0, "AB+": 0, "AB-": 0,
        };
        stock.forEach((s) => {
          if (stockSummary[s.bloodGroup] !== undefined) {
            stockSummary[s.bloodGroup] += s.units;
          }
        });

        return {
          _id: bank._id,
          name: bank.name,
          phone: bank.phone,
          address: bank.address,
          location: bank.location,
          operatingHours: bank.operatingHours,
          is24x7: bank.is24x7,
          facilityCategory: bank.facilityCategory,
          stockSummary,
        };
      })
    );

    return res.status(200).json({
      success: true,
      message: "Nearby blood banks fetched",
      count: banksWithStock.length,
      bloodBanks: banksWithStock,
      hospitalLocation: hospital.location,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch nearby blood banks",
      error: error.message,
    });
  }
};
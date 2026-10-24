// ─────────────────────────────────────────────────────────
// IMPORTING EXTERNAL PACKAGES
// ─────────────────────────────────────────────────────────
const express = require("express");
const app = express();
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");

// ─────────────────────────────────────────────────────────
// IMPORTING INTERNAL FILES
// ─────────────────────────────────────────────────────────
const database = require("./config/database");
const bloodBankRoutes = require("./routes/bloodBankRoutes");
const hospitalRoutes = require("./routes/hospitalRoutes");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const donorRoutes = require("./routes/donorRoutes");
const publicRoutes = require("./routes/publicRoutes");
const notificationRoutes = require("./routes/notificationRoutes"); // ✅ Keep only ONE of these
const reportRoutes = require("./routes/reportRoutes");
const aiAssistRoutes = require("./routes/aiAssistRoutes"); // 🤖 AI Smart Assist

const { startFacilityAutoRejectCron } = require("./utils/facilityAutoRejectCron");
const { startBloodRequestCron } = require("./utils/bloodRequestCron");
const { startCampLifecycleCron } = require("./utils/campLifecycleCron");
const { startInventoryExpiryCron } = require("./utils/inventoryExpiryCron");

// ─────────────────────────────────────────────────────────
// LOAD ENVIRONMENT VARIABLES & CONNECT DB
// ─────────────────────────────────────────────────────────
dotenv.config();
const PORT = process.env.PORT || 4000;
database.connect();

// ─────────────────────────────────────────────────────────
// GLOBAL MIDDLEWARES
// ─────────────────────────────────────────────────────────
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

// ─────────────────────────────────────────────────────────
// ROUTE HANDLERS
// ─────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/donor", donorRoutes);
app.use("/api/bloodbank", bloodBankRoutes);
app.use("/api/hospital", hospitalRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/ai", aiAssistRoutes);           // 🤖 AI Smart Assist

// ─────────────────────────────────────────────────────────
// ✅ SYSTEM AUTOMATION (The "Janitor" Logic)
// ─────────────────────────────────────────────────────────
// 1. Start separate cron for pending facility auto-rejection
startFacilityAutoRejectCron();

// 2. Start separate cron for blood request lifecycle management
startBloodRequestCron();

// 3. Start separate cron for camp lifecycle management
startCampLifecycleCron();

// 4. Start separate cron for inventory expiration sweep
startInventoryExpiryCron();

// ─────────────────────────────────────────────────────────
// TEST ROUTE & START SERVER
// ─────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  return res.json({
    success: true,
    message: "Blood Donation API is running with Automated Logistics...",
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🛡️ Automated Request Updater is active.`);
});
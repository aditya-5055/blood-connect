import { Routes, Route } from "react-router-dom";

// Layouts
import MainLayout from "./layouts/MainLayout";
import DonorLayout from "./layouts/DonorLayout";
import BloodBankLayout from "./layouts/BloodBankLayout";
import HospitalLayout from "./layouts/HospitalLayout";
import AdminLayout from "./layouts/AdminLayout";

// Protected Route
import ProtectedRoute from "./components/common/ProtectedRoute";
import { ROLES } from "./constants/roles";

// Public Pages
import Home from "./pages/Home";
import Findblood from "./pages/Findblood";
import Camps from "./pages/Camps";
import Learn from "./pages/Learn";
import About from "./pages/About";
// Auth Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// Donor Pages
import DonorDashboard from "./pages/donor/Dashboard";
import DonorProfile from "./pages/donor/Profile";
import NearbyBanks from "./pages/donor/NearbyBanks";
import NearbyCamps from "./pages/donor/NearbyCamps";
import NearbyRequests from "./pages/donor/NearbyRequests";
import DonationHistory from "./pages/donor/DonationHistory";
import MyRequests from "./pages/donor/MyRequests";
import DonorMap from "./pages/donor/DonorMap";

// Blood Bank Pages
import BloodBankDashboard from "./pages/bloodbank/Dashboard";
import BloodBankProfile from "./pages/bloodbank/Profile";
import Inventory from "./pages/bloodbank/Inventory";
import DonationRequests from "./pages/bloodbank/DonationRequests";
import BloodRequests from "./pages/bloodbank/BloodRequests";
import BloodBankCamps from "./pages/bloodbank/Camps";
import Transactions from "./pages/bloodbank/Transactions";
// ✅ Added Reports Import
import Reports from "./pages/bloodbank/Reports"; 
import BloodBankMap from "./pages/bloodbank/BloodBankMap";

// Hospital Pages
import HospitalDashboard from "./pages/hospital/Dashboard";
import HospitalProfile from "./pages/hospital/Profile";
import PostRequest from "./pages/hospital/PostRequest";
import HospitalMyRequests from "./pages/hospital/MyRequests";
import HospitalReports from "./pages/hospital/Reports";
import HospitalMap from "./pages/hospital/HospitalMap";
// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import PendingFacilities from "./pages/admin/PendingFacilities";
import ManageFacilities from "./pages/admin/ManageFacilities";
import AllDonors from "./pages/admin/AllDonors";
import AllRequests from "./pages/admin/AllRequests";


import ForgotPassword from "./pages/auth/ForgotPassword"
import UpdatePassword from "./pages/auth/UpdatePassword"


function App() {
  return (
    <Routes>

      {/* ─────────────────────────────────── */}
      {/* Public Routes */}
      {/* ─────────────────────────────────── */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/camps" element={<Camps />} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/about" element={<About />} />
        <Route path="/find-blood" element={<Findblood />} />
        {/* ─────────────────────────────────── */}
        {/* Auth Routes */}
        {/* ─────────────────────────────────── */}
        <Route path="/login" element={<Login />} />
        <Route path="/donor/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/donor/register" element={<Register />} />
        <Route path="/facility/login" element={<Login />} />
        <Route path="/facility/register" element={<Register />} />
        <Route path="/admin/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/update-password/:token" element={<UpdatePassword />} />
      </Route>

      {/* ─────────────────────────────────── */}
      {/* Donor Routes */}
      {/* ─────────────────────────────────── */}
      <Route element={<ProtectedRoute allowedRoles={[ROLES.DONOR]} />}>
        <Route element={<DonorLayout />}>
          <Route path="/donor/dashboard" element={<DonorDashboard />} />
          <Route path="/donor/profile" element={<DonorProfile />} />
          <Route path="/donor/nearby-banks" element={<NearbyBanks />} />
          <Route path="/donor/nearby-camps" element={<NearbyCamps />} />
          <Route path="/donor/nearby-requests" element={<NearbyRequests />} />
          <Route path="/donor/donation-history" element={<DonationHistory />} />
          <Route path="/donor/my-requests" element={<MyRequests />} />
          <Route path="/donor/map" element={<DonorMap />} />
        </Route>
      </Route>

      {/* ─────────────────────────────────── */}
      {/* Blood Bank Routes */}
      {/* ─────────────────────────────────── */}
      <Route element={<ProtectedRoute allowedRoles={[ROLES.BLOOD_BANK]} />}>
        <Route element={<BloodBankLayout />}>
          <Route path="/bloodbank/dashboard" element={<BloodBankDashboard />} />
          <Route path="/bloodbank/profile" element={<BloodBankProfile />} />
          <Route path="/bloodbank/inventory" element={<Inventory />} />
          <Route path="/bloodbank/donation-requests" element={<DonationRequests />} />
          <Route path="/bloodbank/blood-requests" element={<BloodRequests />} />
          <Route path="/bloodbank/camps" element={<BloodBankCamps />} />
          <Route path="/bloodbank/transactions" element={<Transactions />} />
          {/* ✅ Added Reports Route */}
          <Route path="/bloodbank/reports" element={<Reports />} />
          <Route path="/bloodbank/map" element={<BloodBankMap />} />
        </Route>
      </Route>

      {/* ─────────────────────────────────── */}
      {/* Hospital Routes */}
      {/* ─────────────────────────────────── */}
      <Route element={<ProtectedRoute allowedRoles={[ROLES.HOSPITAL]} />}>
        <Route element={<HospitalLayout />}>
          <Route path="/hospital/dashboard" element={<HospitalDashboard />} />
          <Route path="/hospital/profile" element={<HospitalProfile />} />
          <Route path="/hospital/post-request" element={<PostRequest />} />
          <Route path="/hospital/my-requests" element={<HospitalMyRequests />} />
          <Route path="/hospital/reports" element={<HospitalReports />} />
          <Route path="/hospital/map" element={<HospitalMap />} />
        </Route>
      </Route>

      {/* ─────────────────────────────────── */}
      {/* Admin Routes */}
      {/* ─────────────────────────────────── */}
      <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/pending-facilities" element={<PendingFacilities />} />
          <Route path="/admin/manage-facilities" element={<ManageFacilities />} />
          <Route path="/admin/donors" element={<AllDonors />} />
          <Route path="/admin/requests" element={<AllRequests />} />
        </Route>
      </Route>

    </Routes>
  );
}

export default App;
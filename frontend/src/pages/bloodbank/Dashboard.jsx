import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FaTint, FaHandHoldingHeart, FaCampground
} from "react-icons/fa";
import {
  MdInventory, MdBloodtype, MdPeople,
  MdCampaign, MdReceiptLong, MdLocalHospital
} from "react-icons/md";
import { getBloodBankProfile } from "../../services/bloodBankService";
import { getInventory } from "../../services/bloodBankService";
import { getDonationRequests } from "../../services/bloodBankService";
import { getBloodRequests } from "../../services/bloodBankService";
import Avatar from "../../components/ui/Avatar";

const Dashboard = () => {
  const [profile, setProfile] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [donationRequests, setDonationRequests] = useState([]);
  const newDonationRequestsCount = donationRequests.filter((request) => request.status === "pending").length;
  const [bloodRequests, setBloodRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [profileRes, inventoryRes, donationRes, bloodRes] = await Promise.all([
        getBloodBankProfile(),
        getInventory(),
        getDonationRequests(),
        getBloodRequests(),
      ]);
      setProfile(profileRes.bloodBank);
      setInventory(inventoryRes.summary);
      setDonationRequests(donationRes.requests || []);
      setBloodRequests(bloodRes.requests || []);
    } catch (error) {
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  // Calculate total stock
  const getTotalStock = () => {
    if (!inventory) return 0;
    return Object.values(inventory).reduce((sum, val) => sum + val, 0);
  };

  // Get low stock groups
  const getLowStockGroups = () => {
    if (!inventory) return [];
    return Object.entries(inventory)
      .filter(([_, units]) => units < 5)
      .map(([group]) => group);
  };

  const quickActions = [
    {
      title: "Inventory",
      description: "Manage blood stock",
      icon: MdInventory,
      path: "/bloodbank/inventory",
      color: "bg-blue-50",
      iconColor: "text-blue-600",
      iconBg: "bg-blue-100",
    },
    {
      title: "Donation Requests",
      description: "Proactive donor requests",
      icon: FaHandHoldingHeart,
      path: "/bloodbank/donation-requests",
      color: "bg-red-50",
      iconColor: "text-red-600",
      iconBg: "bg-red-100",
      badge: newDonationRequestsCount,
    },
    {
      title: "Blood Requests",
      description: "Hospital blood requests",
      icon: MdLocalHospital,
      path: "/bloodbank/blood-requests",
      color: "bg-orange-50",
      iconColor: "text-orange-600",
      iconBg: "bg-orange-100",
      badge: bloodRequests.filter(r => !r.declinedByBloodBanks?.includes(profile?._id)).length,
    },
    {
      title: "Camps",
      description: "Manage donation camps",
      icon: MdCampaign,
      path: "/bloodbank/camps",
      color: "bg-green-50",
      iconColor: "text-green-600",
      iconBg: "bg-green-100",
    },
    {
      title: "Transactions",
      description: "View transaction history",
      icon: MdReceiptLong,
      path: "/bloodbank/transactions",
      color: "bg-purple-50",
      iconColor: "text-purple-600",
      iconBg: "bg-purple-100",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const lowStockGroups = getLowStockGroups();

  return (
    <div className="space-y-6">

      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-blue-700 to-indigo-700 rounded-2xl p-5 md:p-6 text-white shadow-lg ring-1 ring-blue-500/40 dark:ring-blue-400/20">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-12 -left-12 w-44 h-44 bg-indigo-300/20 rounded-full blur-2xl" />

        <div className="relative flex items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight leading-tight text-white">
              Welcome, {profile?.name}! 🏥
            </h1>
            <p className="text-blue-100/95 mt-2 text-sm md:text-base font-medium">
              Manage your blood bank operations
            </p>
          </div>
          <div className="hidden md:block">
            <Avatar name={profile?.name} size="xl" />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm hover:shadow-md p-3 sm:p-4 text-center transition-all">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
            <FaTint className="text-red-600 dark:text-red-400 text-lg" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200">{getTotalStock()}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Units</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm hover:shadow-md p-3 sm:p-4 text-center transition-all">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
            <FaHandHoldingHeart className="text-yellow-600 dark:text-yellow-400 text-lg" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200">{newDonationRequestsCount}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Pending Donors</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 text-center">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <MdLocalHospital className="text-orange-600 text-xl" />
          </div>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{bloodRequests.length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Hospital Requests</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 text-center">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <MdBloodtype className="text-purple-600 text-xl" />
          </div>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{lowStockGroups.length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Low Stock Groups</p>
        </div>
      </div>

      {/* Location Warning */}
      {profile?.location?.coordinates?.[0] === 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-2xl p-4 md:p-5">
          <div className="flex items-start gap-3">
            <div className="text-red-500 dark:text-red-300 text-xl">⚠️</div>
            <div>
              <h3 className="font-bold text-red-700 dark:text-red-300">Location Not Set!</h3>
              <p className="text-sm text-red-600 dark:text-red-200 mt-1">
                Your location is not set. Hospitals cannot find you for blood requests.
              </p>
              <Link
                to="/bloodbank/profile"
                className="inline-block mt-2 text-xs font-semibold text-red-700 dark:text-red-300 underline"
              >
                Update Location from Profile →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Low Stock Warning */}
      {lowStockGroups.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-2xl p-4 md:p-5">
          <div className="flex items-start gap-3">
            <div className="text-yellow-500 dark:text-yellow-300 text-xl">⚠️</div>
            <div>
              <h3 className="font-bold text-yellow-700 dark:text-yellow-300">Low Stock Alert!</h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-200 mt-1 leading-relaxed">
                These blood groups are running low (less than 5 units):{" "}
                <span className="font-bold">{lowStockGroups.join(", ")}</span>
              </p>
              <Link
                to="/bloodbank/inventory"
                className="inline-block mt-2 text-xs font-semibold text-yellow-700 dark:text-yellow-300 underline"
              >
                Update Inventory →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Blood Stock Summary */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">Blood Stock Summary</h2>
          <Link to="/bloodbank/inventory" className="text-sm text-red-600 font-semibold hover:underline">
            View Details →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 sm:gap-3">
          {inventory && Object.entries(inventory).map(([group, units]) => (
            <div
              key={group}
              className={`bg-white dark:bg-gray-800 rounded-xl shadow p-3 text-center ${
                units < 5 ? "border-2 border-yellow-400" : ""
              }`}
            >
              <p className="text-sm font-bold text-red-600">{group}</p>
              <p className="text-lg font-bold text-gray-800 dark:text-gray-200 mt-1">{units}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">units</p>
              {units < 5 && (
                <span className="text-xs text-yellow-600 dark:text-yellow-300 font-medium">Low</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.path}
              to={action.path}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 hover:shadow-md transition-all relative"
            >
              {action.badge > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {action.badge}
                </span>
              )}
              <div className={`w-10 h-10 ${action.iconBg} rounded-xl flex items-center justify-center mb-3`}>
                <action.icon className={`text-xl ${action.iconColor}`} />
              </div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{action.title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{action.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Pending Donation Requests */}
      {donationRequests.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">
              Pending Donor Requests
              <span className="ml-2 px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm rounded-full">
                {newDonationRequestsCount}
              </span>
            </h2>
            <Link to="/bloodbank/donation-requests" className="text-sm text-red-600 font-semibold hover:underline">
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {donationRequests.slice(0, 3).map((req) => (
              <div key={req._id} className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <FaTint className="text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{req.donorId?.fullName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {req.bloodGroup} • {req.donorId?.phone}
                  </p>
                </div>
                <Link
                  to="/bloodbank/donation-requests"
                  className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-all self-start sm:self-auto"
                >
                  Review
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
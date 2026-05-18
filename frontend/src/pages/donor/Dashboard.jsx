import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  MdLocationOn, MdCampaign,
  MdLocalHospital, MdHistory, MdBloodtype
} from "react-icons/md";
import { FaTint, FaHeart, FaCalendarAlt, FaCheckCircle, FaChartLine } from "react-icons/fa";
import { getDonorProfile, getNearbyRequests } from "../../services/donorService";
import Avatar from "../../components/ui/Avatar";

const Dashboard = () => {
  const [profile, setProfile] = useState(null);
  const [nearbyRequestsCount, setNearbyRequestsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const profileRes = await getDonorProfile();
      setProfile(profileRes.donor);

      try {
        const requestsRes = await getNearbyRequests();
        setNearbyRequestsCount(requestsRes.count || 0);
      } catch {
        setNearbyRequestsCount(0);
      }
    } catch (error) {
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const getNextEligibleDate = () => {
    if (!profile?.lastDonationDate) return null;
    const last = new Date(profile.lastDonationDate);
    return new Date(last.getTime() + 90 * 24 * 60 * 60 * 1000);
  };

  const getDaysUntilEligible = () => {
    const nextDate = getNextEligibleDate();
    if (!nextDate) return 0;
    const now = new Date();
    const diff = Math.ceil((nextDate - now) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  const daysUntilEligible = getDaysUntilEligible();
  const nextEligibleDate = getNextEligibleDate();
  const eligibilityPercentage = Math.min(100, Math.max(0, ((90 - daysUntilEligible) / 90) * 100));
  const firstName = profile?.fullName?.split(" ")?.[0] || "Donor";

  const quickActions = [
    {
      title: "Nearby Blood Banks",
      description: "Find blood banks within 10km",
      icon: MdLocationOn,
      path: "/donor/nearby-banks",
      color: "text-blue-600 dark:text-blue-300",
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      ring: "group-hover:ring-blue-200 dark:group-hover:ring-blue-800/50",
      badge: 0,
    },
    {
      title: "Nearby Camps",
      description: "Register for donation camps",
      icon: MdCampaign,
      path: "/donor/nearby-camps",
      color: "text-green-600 dark:text-green-300",
      iconBg: "bg-green-100 dark:bg-green-900/30",
      ring: "group-hover:ring-green-200 dark:group-hover:ring-green-800/50",
      badge: 0,
    },
    {
      title: "Nearby Requests",
      description: "Help hospitals in need",
      icon: MdLocalHospital,
      path: "/donor/nearby-requests",
      color: "text-red-600 dark:text-red-300",
      iconBg: "bg-red-100 dark:bg-red-900/30",
      ring: "group-hover:ring-red-200 dark:group-hover:ring-red-800/50",
      badge: nearbyRequestsCount,
    },
    {
      title: "Donation History",
      description: "View your past donations",
      icon: MdHistory,
      path: "/donor/donation-history",
      color: "text-violet-600 dark:text-violet-300",
      iconBg: "bg-violet-100 dark:bg-violet-900/30",
      ring: "group-hover:ring-violet-200 dark:group-hover:ring-violet-800/50",
      badge: 0,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">

      {/* Hero */}
      <div className={`relative overflow-hidden rounded-3xl p-6 md:p-8 border shadow-sm ${
        profile?.eligibleToDonate
          ? "bg-gradient-to-br from-emerald-50 via-teal-50 to-white dark:from-emerald-900/30 dark:via-teal-900/20 dark:to-gray-800 border-emerald-200 dark:border-emerald-800/50"
          : "bg-gradient-to-br from-rose-50 via-orange-50 to-white dark:from-rose-900/25 dark:via-orange-900/20 dark:to-gray-800 border-rose-200 dark:border-rose-800/50"
      }`}>
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/60 dark:bg-white/10 blur-2xl" />
        <div className="absolute -left-10 -bottom-10 h-36 w-36 rounded-full bg-red-100/60 dark:bg-red-900/20 blur-2xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
              Welcome back, {firstName}
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Stay ready, respond faster, and make every donation count.
            </p>

            {profile?.eligibleToDonate ? (
              <div className="mt-4 space-y-2">
                <p className="font-semibold flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                  <FaCheckCircle /> You are eligible to donate today.
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 max-w-xl">
                  Your {profile?.bloodGroup} blood type can help save lives in nearby hospitals. Check urgent requests and donate when possible.
                </p>
              </div>
            ) : (
              <div className="mt-4 max-w-xl">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300 mb-2">
                  <span>Recovery Progress</span>
                  <span>{daysUntilEligible} days left</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-red-500 to-orange-400 transition-all duration-700"
                    style={{ width: `${eligibilityPercentage}%` }}
                  />
                </div>
                <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                  Next eligible date: {nextEligibleDate?.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm px-4 py-3">
            <Avatar name={profile?.fullName} size="md" className="border border-gray-200 dark:border-gray-700" />
            <div className="text-sm">
              <p className="font-semibold text-gray-900 dark:text-gray-100 leading-tight">{profile?.fullName}</p>
              <p className="text-gray-600 dark:text-gray-400">Blood Group: {profile?.bloodGroup}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Urgent Request Alert */}
      {nearbyRequestsCount > 0 && profile?.eligibleToDonate && (
        <div className="rounded-2xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 p-5 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300 flex items-center justify-center flex-shrink-0">
                <FaHeart className="text-lg" />
              </div>
              <div>
                <h3 className="font-bold text-red-800 dark:text-red-200 text-base">
                  {nearbyRequestsCount} urgent request{nearbyRequestsCount > 1 ? "s" : ""} near you
                </h3>
                <p className="text-sm text-red-700/90 dark:text-red-300/90 mt-0.5">
                  Your blood group is currently needed. Check nearby requests and respond quickly.
                </p>
              </div>
            </div>
            <Link
              to="/donor/nearby-requests"
              className="sm:w-auto w-full text-center px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors"
            >
              View Requests
            </Link>
          </div>
        </div>
      )}

      {/* Metrics Section */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4 md:gap-5">
        <MetricCard icon={MdBloodtype} label="Blood Group" value={profile?.bloodGroup} color="red" />
        <MetricCard icon={FaTint} label="Donations" value={profile?.donationHistory?.length || 0} color="green" />
        <MetricCard 
          icon={FaCalendarAlt} 
          label="Last Date" 
          value={profile?.lastDonationDate ? new Date(profile.lastDonationDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "N/A"} 
          color="blue" 
        />
        <MetricCard 
          icon={FaChartLine} 
          label="Health Status" 
          value={profile?.eligibleToDonate ? "Ready" : "Resting"} 
          color={profile?.eligibleToDonate ? "green" : "yellow"} 
        />
      </div>

      {/* Quick Actions Grid */}
      <section>
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-5 flex items-center gap-2">
          <span className="w-2 h-6 bg-red-600 rounded-full"></span>
          Quick Services
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {quickActions.map((action) => (
            <Link
              key={action.path}
              to={action.path}
              className="group bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden"
            >
              {action.badge > 0 && (
                <span className="absolute top-4 right-4 min-w-[22px] h-[22px] px-1.5 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-4 ring-red-50 dark:ring-red-900/30">
                  {action.badge}
                </span>
              )}
              <div className={`w-12 h-12 ${action.iconBg} rounded-xl flex items-center justify-center mb-4 ring-4 ring-transparent ${action.ring} transition-all`}>
                <action.icon className={`text-2xl ${action.color}`} />
              </div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 group-hover:text-red-600 dark:group-hover:text-red-300 transition-colors">{action.title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">{action.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Location Status Overlay (If not set) */}
      {profile?.location?.coordinates?.[0] === 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-5 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-amber-100 dark:bg-amber-900/40 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-300">
               <MdLocationOn size={24} />
            </div>
            <div>
              <h4 className="font-semibold text-amber-900 dark:text-amber-200">Location Missing</h4>
              <p className="text-sm text-amber-700 dark:text-amber-300">Set your location to see blood requests nearby.</p>
            </div>
          </div>
          <Link to="/donor/profile" className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl text-sm transition-colors">Update Now</Link>
        </div>
      )}

    </div>
  );
};

// Reusable Metric Card Component
const MetricCard = ({ icon: Icon, label, value, color }) => {
  const colors = {
    red: "text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-900/30",
    green: "text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30",
    blue: "text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30",
    yellow: "text-amber-600 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30",
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col items-center text-center group hover:shadow-md transition-all">
      <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3 transition-transform group-hover:scale-105 ${colors[color]}`}>
        <Icon size={20} className="sm:w-6 sm:h-6" />
      </div>
      <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-200">{value}</p>
      <p className="text-[10px] sm:text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-1">{label}</p>
    </div>
  );
};

export default Dashboard;
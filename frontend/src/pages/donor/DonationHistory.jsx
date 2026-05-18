import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { FaTint, FaHospital, FaCalendarAlt, FaHandHoldingHeart, FaAward, FaTimes, FaShieldAlt, FaExclamationCircle, FaUserSlash } from "react-icons/fa";
import { MdBloodtype } from "react-icons/md";
import { useSelector } from "react-redux"; 
import { getDonationHistory, getMyDonationRequests } from "../../services/donorService";
import CertificateGenerator from "../../components/common/CertificateGenerator";

const DonationHistory = () => {
  const { user } = useSelector((state) => state.auth); 
  const [history, setHistory] = useState([]);
  const [declinedRequests, setDeclinedRequests] = useState([]);
  const [nextEligibleDate, setNextEligibleDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("donations");
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [trustScore, setTrustScore] = useState(user?.trustScore || 100);
  const [penaltyUntil, setPenaltyUntil] = useState(user?.penaltyUntil || null);
  const [medicalLockUntil, setMedicalLockUntil] = useState(user?.medicalLockUntil || null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const [historyRes, requestsRes] = await Promise.all([
        getDonationHistory(),
        getMyDonationRequests(),
      ]);
      setHistory(historyRes.donationHistory || []);
      setNextEligibleDate(historyRes.nextEligibleDate);
      setTrustScore(historyRes.trustScore ?? (user?.trustScore || 100));
      setPenaltyUntil(historyRes.penaltyUntil || null);
      setMedicalLockUntil(historyRes.medicalLockUntil || null);
      setDeclinedRequests(
        (requestsRes.donationRequests || []).filter(
          (r) => r.status === "declined" || r.status === "completed" || r.status === "no-show"
        )
      );
    } catch (error) {
      toast.error("Failed to load donation history");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Helper to determine Trust Score color
  const getTrustColor = (score) => {
    if (score >= 80) return "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50";
    if (score >= 50) return "text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800/50";
    return "text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50";
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div></div>;

  return (
    <div className="space-y-6 relative">
      
      {/* 🏆 Certificate Modal (Existing) */}
      {selectedCertificate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-2 max-w-5xl w-full max-h-[95vh] overflow-y-auto relative shadow-2xl">
            <button onClick={() => setSelectedCertificate(null)} className="absolute top-4 right-4 z-10 p-2 bg-gray-100 dark:bg-gray-800 hover:bg-red-100 rounded-full transition-colors"><FaTimes size={20} /></button>
            <div className="py-8">
                <CertificateGenerator donorName={user?.fullName} date={selectedCertificate.date} locationName={selectedCertificate.location} bloodGroup={selectedCertificate.bloodGroup} donationType={selectedCertificate.type} />
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Donation History</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Your complete blood donation record & certificates</p>
        </div>
        
        {/* ✅ NEW: Trust Score Badge */}
        <div className={`self-start sm:self-auto px-4 py-2 rounded-2xl border-2 flex items-center gap-2 ${getTrustColor(trustScore)}`}>
            <FaShieldAlt />
            <span className="text-sm font-bold">Trust Score: {trustScore}%</span>
        </div>
      </div>

      {/* ✅ NEW: REAL-WORLD REPUTATION & LOCK STATUS CARD */}
      {(penaltyUntil || medicalLockUntil) && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-xl flex gap-4 items-start shadow-sm">
            <div className="p-2 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300 rounded-lg"><FaExclamationCircle size={20} /></div>
            <div>
                <h3 className="font-bold text-red-800 dark:text-red-200 text-sm">Account Restricted</h3>
                <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                    {penaltyUntil && `You have a temporary restriction until ${new Date(penaltyUntil).toDateString()} due to a missed appointment.`}
                    {medicalLockUntil && ` Medical recovery period active until ${new Date(medicalLockUntil).toDateString()}.`}
                </p>
                <p className="text-[10px] text-red-500 dark:text-red-300/70 mt-2 italic">Maintain a high Trust Score by attending confirmed appointments to avoid restrictions.</p>
            </div>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 text-center border border-gray-100 dark:border-gray-800">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2"><FaTint className="text-red-600" /></div>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{history.length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Donations</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 text-center border border-gray-100 dark:border-gray-800">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2"><MdBloodtype className="text-blue-600 text-xl" /></div>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{history.reduce((sum, d) => sum + (d.units || 1), 0)}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Units Donated</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 text-center col-span-2 md:col-span-1 border border-gray-100 dark:border-gray-800">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2"><FaCalendarAlt className="text-green-600" /></div>
          <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{nextEligibleDate ? new Date(nextEligibleDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Now"}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Next Eligibility</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        <button onClick={() => setActiveTab("donations")} className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${activeTab === "donations" ? "border-red-600 text-red-600" : "border-transparent text-gray-500 dark:text-gray-400"}`}>
          Blood Donations ({history.length})
        </button>
        <button onClick={() => setActiveTab("requests")} className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${activeTab === "requests" ? "border-red-600 text-red-600" : "border-transparent text-gray-500 dark:text-gray-400"}`}>
          Request History ({declinedRequests.length})
        </button>
      </div>

      {/* Donations List */}
      {activeTab === "donations" && (
        <div className="space-y-3">
          {history.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-12 text-center border border-gray-100 dark:border-gray-800">
              <FaTint className="text-gray-300 text-5xl mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">No donations yet</h3>
            </div>
          ) : (
            [...history].reverse().map((donation, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 sm:p-5 hover:shadow-md transition-all border-l-4 border-green-400 flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0"><FaTint className="text-red-600 dark:text-red-300 text-lg" /></div>
                <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold text-gray-800 dark:text-gray-200">{donation.donatedTo === "blood-bank" ? "Blood Bank Donation" : "Hospital Donation"}</span>
                  <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-[10px] rounded-full font-bold uppercase">Completed</span>
                    </div>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1"><FaCalendarAlt /> {new Date(donation.donationDate).toDateString()}</span>
                        <span className="flex items-center gap-1"><FaHospital /> {donation.facility?.name}</span>
                    </div>
                </div>
              <button onClick={() => setSelectedCertificate({ date: donation.donationDate, location: donation.facility?.name, bloodGroup: donation.bloodGroup, type: donation.donatedTo === "blood-bank" ? "bank" : "hospital" })} className="self-start sm:self-auto flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-yellow-50 dark:hover:bg-yellow-900/20 text-yellow-600 dark:text-yellow-300 transition-colors group">
                <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center group-hover:bg-yellow-200 dark:group-hover:bg-yellow-900/40"><FaAward className="text-xl" /></div>
                    <span className="text-[10px] font-bold uppercase">Certificate</span>
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Requests History (Updated to include No-Shows) */}
      {activeTab === "requests" && (
        <div className="space-y-3">
            {declinedRequests.length === 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-10 text-center border border-gray-200 dark:border-gray-700">
                <FaHandHoldingHeart className="text-gray-300 text-4xl mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">No request history yet</h3>
                <p className="text-gray-400 text-sm mt-1">Your completed, declined, and no-show requests will appear here.</p>
              </div>
            )}
            {declinedRequests.map((request) => (
              <div key={request._id} className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 sm:p-5 border-l-4 flex flex-col sm:flex-row sm:items-center gap-4 ${request.status === "completed" ? "border-green-400" : request.status === "no-show" ? "border-orange-400" : "border-red-400"}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${request.status === "completed" ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300" : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300"}`}>
                    {request.status === "no-show" ? <FaUserSlash /> : <FaHandHoldingHeart />}
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-gray-800 dark:text-gray-200">{request.bloodBankId?.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold uppercase ${request.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
                            {request.status}
                        </span>
                        {request.status === "no-show" && <span className="text-[10px] text-orange-600 dark:text-orange-300 italic">-15 Trust Points</span>}
                    </div>
                </div>
                <p className="text-xs text-gray-400">{new Date(request.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default DonationHistory;
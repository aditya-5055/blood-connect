import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { FaTint, FaHospital } from "react-icons/fa";
import { MdLocationOn, MdMyLocation, MdAccessTime } from "react-icons/md";
import { getNearbyRequests, acceptBloodRequest, declineBloodRequest } from "../../services/donorService";

const NearbyRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchNearbyRequests();
  }, []);

  const fetchNearbyRequests = async () => {
    setLoading(true);
    try {
      const response = await getNearbyRequests();
      setRequests(response.requests || []);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to fetch nearby requests");
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setLoading(true);
        try {
          const response = await getNearbyRequests(
            position.coords.longitude,
            position.coords.latitude
          );
          setRequests(response.requests || []);
          toast.success("Location refreshed!");
        } catch (error) {
          toast.error("Failed to fetch nearby requests");
        } finally {
          setLoading(false);
        }
      },
      () => toast.error("Location access denied")
    );
  };

  const handleAccept = async (requestId) => {
    setActionLoading(requestId + "_accept");
    try {
      const response = await acceptBloodRequest(requestId);
      if (response.success) {
        toast.success("Request accepted! Please visit the hospital.");
        fetchNearbyRequests();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to accept request");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (requestId) => {
    setActionLoading(requestId + "_decline");
    try {
      const response = await declineBloodRequest(requestId);
      if (response.success) {
        toast.success("Request declined");
        // Remove from list
        setRequests(requests.filter((r) => r._id !== requestId));
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to decline request");
    } finally {
      setActionLoading(null);
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case "Critical": return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/50";
      case "High": return "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/50";
      case "Moderate": return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800/50";
      case "Normal": return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800/50";
      default: return "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400";
    }
  };

  const getTimeRemaining = (deadline) => {
    const now = new Date();
    const diff = new Date(deadline) - now;
    if (diff <= 0) return "Expired";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m remaining`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gradient-to-r from-red-50 via-white to-blue-50 dark:from-red-900/20 dark:via-gray-800 dark:to-blue-900/20 p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Nearby Requests</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm">Blood requests from hospitals within 10km</p>
        </div>
        <button
          onClick={handleRefreshLocation}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all"
        >
          <MdMyLocation />
          Refresh
        </button>
      </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-2xl p-4">
        <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
          🩸 These are urgent blood requests from hospitals matching your blood group <span className="font-bold">within 10km</span> of your location.
        </p>
      </div>

      {/* Count */}
      <span className="inline-flex items-center px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-full border border-gray-200 dark:border-gray-700">
        {requests.length} requests found nearby
      </span>

      {/* List */}
      {requests.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-10 sm:p-12 text-center">
          <FaTint className="text-gray-300 text-5xl mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">No requests nearby</h3>
          <p className="text-gray-400 text-sm mt-1">
            No active blood requests matching your blood group within 10km
          </p>
          <button
            onClick={handleRefreshLocation}
            className="mt-4 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-all"
          >
            Refresh
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request._id}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 sm:p-5 hover:shadow-md transition-all border border-gray-200 dark:border-gray-700"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">

                {/* Left */}
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FaTint className="text-red-600 dark:text-red-300 text-lg" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-2xl font-bold text-red-600">{request.bloodGroup}</span>
                      <span className="text-gray-600 dark:text-gray-400 font-medium">{request.units} unit(s)</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${getUrgencyColor(request.urgencyLevel)}`}>
                        {request.urgencyLevel}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 dark:text-gray-400">
                      <FaHospital className="text-orange-500 flex-shrink-0" />
                      <span className="font-medium break-words">{request.hospitalId?.name}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                      <MdLocationOn className="flex-shrink-0" />
                      <span className="break-words">{request.hospitalId?.address?.city}, {request.hospitalId?.address?.state}</span>
                    </div>
                  </div>
                </div>

                {/* Deadline */}
                <div className="sm:text-right">
                  <div className="flex items-center gap-1 text-xs text-orange-600 font-medium">
                    <MdAccessTime />
                    {getTimeRemaining(request.deadline)}
                  </div>
                </div>

              </div>

              {/* Hospital Phone */}
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">Hospital Contact</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-0.5">{request.hospitalId?.phone}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => handleDecline(request._id)}
                  disabled={actionLoading === request._id + "_decline"}
                  className="flex-1 py-2.5 border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-red-300 hover:text-red-600 text-sm font-semibold rounded-xl transition-all disabled:opacity-50"
                >
                  {actionLoading === request._id + "_decline" ? "..." : "Decline"}
                </button>
                <button
                  onClick={() => handleAccept(request._id)}
                  disabled={actionLoading === request._id + "_accept"}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white text-sm font-semibold rounded-xl transition-all"
                >
                  {actionLoading === request._id + "_accept" ? "Accepting..." : "Accept & Donate"}
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default NearbyRequests;
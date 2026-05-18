// import { useState, useEffect } from "react";
// import toast from "react-hot-toast";
// import { FaTint, FaClock, FaCalendarAlt, FaUserSlash, FaAward } from "react-icons/fa";
// import { MdCheck, MdClose, MdEvent } from "react-icons/md";
// import {
//   getDonationRequests,
//   processDonationRequest,
//   completeDonation,
//   markNoShow,
// } from "../../services/bloodBankService";
// import Avatar from "../../components/ui/Avatar";

// const DonationRequests = () => {
//   const [requests, setRequests] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [actionLoading, setActionLoading] = useState(null);
  
//   // Modals
//   const [showInviteModal, setShowInviteModal] = useState(false);
//   const [showCompleteModal, setShowCompleteModal] = useState(false);
//   const [showDeclineModal, setShowDeclineModal] = useState(false);
  
//   // Selection States
//   const [selectedRequest, setSelectedRequest] = useState(null);
//   const [declineReason, setDeclineReason] = useState("");
//   const [appointmentDate, setAppointmentDate] = useState("");
//   const [slotTime, setSlotTime] = useState("Morning");
//   const [units, setUnits] = useState(1);
//   const [filter, setFilter] = useState("all");

//   useEffect(() => {
//     fetchRequests();
//   }, []);

//   const fetchRequests = async () => {
//     try {
//       const response = await getDonationRequests();
//       setRequests(response.requests || []);
//     } catch (error) {
//       toast.error("Failed to load donation requests");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleInviteClick = (request) => {
//     setSelectedRequest(request);
//     setAppointmentDate("");
//     setSlotTime("Morning");
//     setShowInviteModal(true);
//   };

//   const handleInviteConfirm = async () => {
//     if (!appointmentDate || !slotTime) {
//       toast.error("Please select both date and time slot");
//       return;
//     }
//     setActionLoading(selectedRequest._id + "_invite");
//     setShowInviteModal(false);
//     try {
//       const response = await processDonationRequest(selectedRequest._id, {
//         action: "invite",
//         appointmentDate,
//         slotTime
//       });
//       if (response.success) {
//         toast.success("Invitation sent! Waiting for donor confirmation.");
//         fetchRequests();
//       }
//     } catch (error) {
//       toast.error(error?.response?.data?.message || "Failed to send invite");
//     } finally {
//       setActionLoading(null);
//       setSelectedRequest(null);
//     }
//   };

//   const handleNoShow = async (requestId) => {
//     if (!window.confirm("Mark this donor as No-Show? This will penalize their trust score.")) return;
//     setActionLoading(requestId + "_noshow");
//     try {
//       const response = await markNoShow(requestId);
//       if (response.success) {
//         toast.success("Donor marked as No-Show.");
//         fetchRequests();
//       }
//     } catch (error) {
//       toast.error("Failed to update status");
//     } finally {
//       setActionLoading(null);
//     }
//   };

//   const handleDeclineClick = (request) => {
//     setSelectedRequest(request);
//     setDeclineReason("");
//     setShowDeclineModal(true);
//   };

//   const handleDeclineConfirm = async () => {
//     if (!declineReason) {
//       toast.error("Please provide decline reason");
//       return;
//     }
//     setActionLoading(selectedRequest._id + "_decline");
//     try {
//       const response = await processDonationRequest(selectedRequest._id, {
//         action: "decline",
//         declineReason,
//       });
//       if (response.success) {
//         toast.success("Request declined");
//         setShowDeclineModal(false); // ✅ Fix: only close on success
//         fetchRequests();
//       }
//     } catch (error) {
//       toast.error(error?.response?.data?.message || "Failed to decline");
//     } finally {
//       setActionLoading(null);
//       setSelectedRequest(null);
//     }
//   };

//   const handleCompleteClick = (request) => {
//     setSelectedRequest(request);
//     setUnits(1);
//     setShowCompleteModal(true);
//   };

//   const handleCompleteConfirm = async () => {
//     setActionLoading(selectedRequest._id + "_complete");
//     setShowCompleteModal(false);
//     try {
//       const response = await completeDonation(selectedRequest._id, { units });
//       if (response.success) {
//         toast.success("Donation completed! Blood added to inventory.");
//         fetchRequests();
//       }
//     } catch (error) {
//       toast.error(error?.response?.data?.message || "Failed to complete");
//     } finally {
//       setActionLoading(null);
//       setSelectedRequest(null);
//     }
//   };

//   const filtered = filter === "all"
//     ? requests
//     : requests.filter((r) => r.status === filter); // ✅ Fixed filter variable name

//   if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div></div>;

//   return (
//     <div className="space-y-6">
//       <header>
//         <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Donation Logistics</h1>
//         <p className="text-gray-500 dark:text-gray-400 mt-1">Manage scheduling and donor arrivals</p>
//       </header>

//       {/* Stats with Trust Context */}
//       <div className="grid grid-cols-3 gap-3">
//         <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-center">
//           <p className="text-xl font-bold text-yellow-600">{requests.filter(r => r.status === "pending").length}</p>
//           <p className="text-[10px] font-bold uppercase text-yellow-600">New Requests</p>
//         </div>
//         <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-center">
//           <p className="text-xl font-bold text-purple-600">{requests.filter(r => r.status === "invited").length}</p>
//           <p className="text-[10px] font-bold uppercase text-purple-600">Invites Sent</p>
//         </div>
//         <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
//           <p className="text-xl font-bold text-green-600">{requests.filter(r => r.status === "confirmed").length}</p>
//           <p className="text-[10px] font-bold uppercase text-green-600">Scheduled Today</p>
//         </div>
//       </div>

//       {/* List */}
//       <div className="space-y-4">
//         {filtered.map((request) => (
//           <div key={request._id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5">
//             <div className="flex justify-between items-start mb-4">
//               <div className="flex gap-4">
//                 <Avatar name={request.donorId?.fullName} size="md" />
//                 <div>
//                   <h3 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
//                     {request.donorId?.fullName}
//                     <span className="flex items-center gap-1 text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
//                       <FaAward /> Trust: {request.donorId?.trustScore || 100}
//                     </span>
//                   </h3>
//                   <p className="text-xs text-gray-500 dark:text-gray-400">{request.bloodGroup} Donor • {request.donorId?.phone}</p>
//                 </div>
//               </div>
//               <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
//                 request.status === 'confirmed' ? 'bg-green-100 text-green-700' : 
//                 request.status === 'invited' ? 'bg-purple-100 text-purple-700' : 
//                 request.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
//               }`}>
//                 {request.status}
//               </span>
//             </div>

//             {/* Appointment Details for Invited/Confirmed/Cancelled */}
//             {(request.status === "invited" || request.status === "confirmed" || request.status === "cancelled") && request.appointmentDate && (
//               <div className="mb-4 flex gap-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
//                 <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
//                   <FaCalendarAlt className="text-red-500" />
//                   {new Date(request.appointmentDate).toDateString()}
//                 </div>
//                 <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
//                   <FaClock className="text-blue-500" />
//                   {request.slotTime}
//                 </div>
//               </div>
//             )}

//             {/* Actions */}
//             <div className="flex gap-2">
//               {request.status === "pending" && (
//                 <>
//                   <button onClick={() => handleInviteClick(request)} className="flex-1 py-2 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-all">
//                     Invite to Donate
//                   </button>
//                   {/* ✅ FIX: Changed disabled state so it only disables when THIS specific button is loading */}
//                   <button 
//                     onClick={() => handleDeclineClick(request)} 
//                     disabled={actionLoading === request._id + "_decline"}
//                     className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-all disabled:opacity-50"
//                   >
//                     Decline
//                   </button>
//                 </>
//               )}

//               {request.status === "confirmed" && (
//                 <>
//                   <button onClick={() => handleCompleteClick(request)} className="flex-[2] py-2 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-all">
//                     Confirm Visit & Complete
//                   </button>
//                   <button onClick={() => handleNoShow(request._id)} className="flex-1 py-2 border border-orange-200 text-orange-600 rounded-xl text-sm font-bold hover:bg-orange-50 transition-all">
//                     Mark No-Show
//                   </button>
//                 </>
//               )}
              
//               {request.status === "invited" && (
//                 <div className="w-full text-center py-2 bg-purple-50 text-purple-600 rounded-xl text-xs font-medium italic">
//                   Waiting for donor to confirm the slot...
//                 </div>
//               )}

//               {/* ✅ NEW: Cancelled state visibility */}
//               {request.status === "cancelled" && (
//                 <div className="w-full text-center py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold">
//                   Donor cancelled this appointment.
//                 </div>
//               )}
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Invite Modal */}
//       {showInviteModal && (
//         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
//           <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 w-full max-w-md animate-in fade-in zoom-in duration-200">
//             <div className="text-center mb-6">
//               <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
//                 <MdEvent size={32} />
//               </div>
//               <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Schedule Appointment</h2>
//               <p className="text-sm text-gray-500 dark:text-gray-400">Pick a time for {selectedRequest?.donorId?.fullName}</p>
//             </div>

//             <div className="space-y-4 mb-6">
//               <div>
//                 <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Select Date</label>
//                 <input 
//                   type="date" 
//                   min={new Date().toISOString().split('T')[0]}
//                   value={appointmentDate}
//                   onChange={(e) => setAppointmentDate(e.target.value)}
//                   className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-red-500 outline-none" 
//                 />
//               </div>
//               <div>
//                 <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Shift / Slot</label>
//                 <div className="grid grid-cols-2 gap-2">
//                   {["Morning", "Afternoon"].map(slot => (
//                     <button
//                       key={slot}
//                       onClick={() => setSlotTime(slot)}
//                       className={`py-3 rounded-2xl font-bold text-sm transition-all ${slotTime === slot ? 'bg-red-600 text-white shadow-lg shadow-red-200' : 'bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700'}`}
//                     >
//                       {slot}
//                     </button>
//                   ))}
//                 </div>
//               </div>
//             </div>

//             <div className="flex gap-3">
//               <button onClick={() => setShowInviteModal(false)} className="flex-1 py-3 text-gray-400 font-bold">Cancel</button>
//               <button onClick={handleInviteConfirm} className="flex-2 py-3 bg-gray-900 text-white rounded-2xl font-bold px-8 hover:bg-black transition-all">Send Invitation</button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Decline Modal */}
//       {showDeclineModal && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-md">
//             <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">Decline Donation Request</h2>
//             <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
//               Please provide a reason for declining <span className="font-semibold">{selectedRequest?.donorId?.fullName}</span>'s request:
//             </p>
//             <select
//               value={declineReason}
//               onChange={(e) => setDeclineReason(e.target.value)}
//               className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm mb-4"
//             >
//               <option value="">Select reason</option>
//               <option value="Storage full">Storage full</option>
//               <option value="Blood group not needed">Blood group not needed currently</option>
//               <option value="Donor not eligible">Donor not eligible</option>
//               <option value="Facility closed">Facility temporarily closed</option>
//               <option value="Other">Other</option>
//             </select>
//             <div className="flex gap-3">
//               <button onClick={() => setShowDeclineModal(false)} className="flex-1 py-2.5 border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-semibold text-sm rounded-xl">Cancel</button>
//               <button onClick={handleDeclineConfirm} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm rounded-xl">Decline Request</button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Complete Donation Modal */}
//       {showCompleteModal && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-md">
//             <h2 className="text-lg font-bold mb-4">Finalize Donation</h2>
//             <input 
//               type="number" 
//               value={units} 
//               onChange={(e) => setUnits(Number(e.target.value))} 
//               className="w-full p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl mb-4 border border-gray-200 dark:border-gray-700" 
//               placeholder="Units collected (usually 1)" 
//             />
//             <div className="flex gap-3">
//               <button onClick={() => setShowCompleteModal(false)} className="flex-1 py-3 text-gray-400 font-bold border border-gray-200 dark:border-gray-700 rounded-2xl">Cancel</button>
//               <button onClick={handleCompleteConfirm} className="flex-2 py-3 bg-green-600 text-white rounded-2xl font-bold">Confirm & Add to Stock</button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default DonationRequests;
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { FaTint, FaClock, FaCalendarAlt, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import { MdEvent } from "react-icons/md";
import {
  getDonationRequests,
  processDonationRequest,
  completeDonation,
  markNoShow,
} from "../../services/bloodBankService";
import Avatar from "../../components/ui/Avatar";

const DonationRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [activeTab, setActiveTab] = useState("pending");

  // Modals & Selection States
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  
  const [declineReason, setDeclineReason] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [slotTime, setSlotTime] = useState("Morning");
  const [units, setUnits] = useState(1);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await getDonationRequests();
      setRequests(response.requests || []);
    } catch (error) {
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers ---
  const handleInviteConfirm = async () => {
    if (!selectedRequest) return;
    if (!appointmentDate || !slotTime) {
      toast.error("Please select date and slot");
      return;
    }

    setActionLoading(selectedRequest._id + "_invite");
    try {
      const response = await processDonationRequest(selectedRequest._id, {
        action: "invite",
        appointmentDate,
        slotTime,
      });
      if (response.success) {
        toast.success("Invitation sent!");
        setShowInviteModal(false);
        setSelectedRequest(null);
        fetchRequests();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to send invite");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeclineConfirm = async () => {
    if (!selectedRequest) return;
    if (!declineReason) {
      toast.error("Please select a reason");
      return;
    }

    setActionLoading(selectedRequest._id + "_decline");
    try {
      const response = await processDonationRequest(selectedRequest._id, {
        action: "decline",
        declineReason,
      });
      if (response.success) {
        toast.success("Request declined");
        setShowDeclineModal(false);
        setSelectedRequest(null);
        fetchRequests();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to decline");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteConfirm = async () => {
    if (!selectedRequest) return;
    if (!units || units < 1) {
      toast.error("Units must be at least 1");
      return;
    }

    setActionLoading(selectedRequest._id + "_complete");
    try {
      const response = await completeDonation(selectedRequest._id, { units });
      if (response.success) {
        toast.success("Donation marked completed");
        setShowCompleteModal(false);
        setSelectedRequest(null);
        fetchRequests();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to complete");
    } finally {
      setActionLoading(null);
    }
  };

  const handleNoShow = async (requestId) => {
    if (!window.confirm("Mark as No-Show? Trust score will be penalized.")) return;
    setActionLoading(requestId + "_noshow");
    try {
      const response = await markNoShow(requestId);
      if (response.success) { fetchRequests(); toast.success("Marked as No-Show"); }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Update failed");
    }
    finally { setActionLoading(null); }
  };

  const getStatusBuckets = () => ({
    pending: requests.filter((r) => r.status === "pending"),
    ongoing: requests.filter((r) => ["invited", "confirmed"].includes(r.status)),
    completed: requests.filter((r) => r.status === "completed"),
    cancelled: requests.filter((r) => ["cancelled", "declined", "rejected", "expired", "no-show"].includes(r.status)),
  });

  const getFilteredRequests = () => {
    const buckets = getStatusBuckets();
    switch (activeTab) {
      case "pending": return buckets.pending;
      case "ongoing": return buckets.ongoing;
      case "cancelled": return buckets.cancelled;
      case "completed": return buckets.completed;
      default: return requests;
    }
  };

  const statusCounts = getStatusBuckets();
  const filteredRequests = getFilteredRequests();

  const getStatusChip = (status) => {
    if (status === "pending") return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300";
    if (status === "invited") return "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300";
    if (status === "confirmed") return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300";
    if (status === "completed") return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300";
    return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300";
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div></div>;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">
      <header className="flex justify-between items-end gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Donation Logistics</h1>
          <p className="text-gray-500 dark:text-gray-400">Review requests and manage appointments</p>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 bg-gray-100 dark:bg-gray-800/80 p-2 rounded-2xl">
        {[
          { id: "pending", label: "New Requests", icon: <FaTint /> },
          { id: "ongoing", label: "Active/Invited", icon: <FaClock /> },
          { id: "completed", label: "Completed", icon: <FaCheckCircle /> },
          { id: "cancelled", label: "Cancelled", icon: <FaExclamationCircle /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center justify-between gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? "bg-white dark:bg-gray-900 text-red-600 dark:text-red-300 shadow-sm"
                : "text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
            }`}
          >
            <span className="flex items-center gap-2 min-w-0">
              {tab.icon}
              <span className="truncate">{tab.label}</span>
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activeTab === tab.id
                ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}>
              {tab.id === "pending" && statusCounts.pending.length}
              {tab.id === "ongoing" && statusCounts.ongoing.length}
              {tab.id === "completed" && statusCounts.completed.length}
              {tab.id === "cancelled" && statusCounts.cancelled.length}
            </span>
          </button>
        ))}
      </div>

      {/* Requests List */}
      <div className="grid gap-4">
        {filteredRequests.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-12 text-center border border-dashed border-gray-200 dark:border-gray-700">
             <p className="text-gray-500 dark:text-gray-400 font-medium">No requests found in this category.</p>
          </div>
        ) : (
          filteredRequests.map((request) => (
            <div key={request._id} className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              
              {/* Donor Info */}
              <div className="flex gap-3 sm:gap-4 items-center min-w-0">
                <Avatar name={request.donorId?.fullName} size="lg" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-gray-800 dark:text-gray-200 text-base sm:text-lg truncate">{request.donorId?.fullName || "Donor"}</h3>
                    <span className="bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-[10px] px-2 py-0.5 rounded-full font-bold border border-amber-200 dark:border-amber-700">
                      SCORE: {request.donorId?.trustScore || 100}
                    </span>
                    <span className={`px-2 py-0.5 text-[10px] rounded-full font-semibold uppercase ${getStatusChip(request.status)}`}>
                      {request.status}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-red-600">{request.bloodGroup} Donor</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{request.donorId?.phone || "No phone"}</p>
                </div>
              </div>

              {/* Status & Date Context */}
              <div className="w-full lg:flex-1 lg:max-w-sm">
                {request.appointmentDate ? (
                  <div className="bg-gray-50 dark:bg-gray-900/70 rounded-2xl p-3 border border-gray-200 dark:border-gray-700">
                    <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Appointment</p>
                    <div className="flex flex-col sm:flex-row sm:gap-4 text-xs font-semibold text-gray-700 dark:text-gray-300">
                      <span className="flex items-center gap-1"><FaCalendarAlt className="text-red-400" /> {new Date(request.appointmentDate).toDateString()}</span>
                      <span className="flex items-center gap-1"><FaClock className="text-blue-400" /> {request.slotTime}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 dark:text-gray-400 italic">Requested on {new Date(request.createdAt).toLocaleDateString()}</div>
                )}
              </div>

              {/* Dynamic Actions Based on Status */}
              <div className="flex flex-wrap gap-2 w-full lg:w-auto lg:min-w-[240px] lg:justify-end">
                {request.status === "pending" && (
                  <>
                    <button
                      onClick={() => { setSelectedRequest(request); setAppointmentDate(""); setSlotTime("Morning"); setShowInviteModal(true); }}
                      disabled={actionLoading === request._id + "_invite"}
                      className="px-5 py-2.5 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 disabled:opacity-60"
                    >
                      Invite
                    </button>
                    <button
                      onClick={() => { setSelectedRequest(request); setDeclineReason(""); setShowDeclineModal(true); }}
                      disabled={actionLoading === request._id + "_decline"}
                      className="px-4 py-2.5 bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-bold border border-gray-200 dark:border-gray-700 disabled:opacity-60"
                    >
                      Decline
                    </button>
                  </>
                )}

                {request.status === "invited" && (
                  <span className="text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30 px-4 py-2 rounded-xl border border-purple-200 dark:border-purple-700">Awaiting Donor Confirmation...</span>
                )}

                {request.status === "confirmed" && (
                  <>
                    <button
                      onClick={() => { setSelectedRequest(request); setUnits(1); setShowCompleteModal(true); }}
                      disabled={actionLoading === request._id + "_complete"}
                      className="px-5 py-2.5 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 disabled:opacity-60"
                    >
                      Mark Completed
                    </button>
                    <button
                      onClick={() => handleNoShow(request._id)}
                      disabled={actionLoading === request._id + "_noshow"}
                      className="px-4 py-2.5 border border-orange-200 dark:border-orange-700 text-orange-700 dark:text-orange-300 rounded-xl text-xs font-bold hover:bg-orange-50 dark:hover:bg-orange-900/30 disabled:opacity-60"
                    >
                      No-Show
                    </button>
                  </>
                )}

                {(request.status === "cancelled" || request.status === "declined" || request.status === "rejected" || request.status === "expired" || request.status === "no-show") && (
                  <span className="text-xs font-bold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 px-4 py-2 rounded-xl border border-red-200 dark:border-red-700">{request.status === "rejected" || request.status === "declined" ? "Bank Declined" : request.status === "no-show" ? "Donor No-Show" : "Donor Cancelled"}</span>
                )}

                {request.status === "completed" && (
                  <span className="text-xs font-bold text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 px-4 py-2 rounded-xl border border-green-200 dark:border-green-700 flex items-center gap-1">
                    <FaCheckCircle /> Successfully Donated
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 w-full max-w-md">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <MdEvent size={32} />
              </div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Schedule Appointment</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Pick a time for {selectedRequest?.donorId?.fullName}</p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Select Date</label>
                <input
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Shift / Slot</label>
                <div className="grid grid-cols-2 gap-2">
                  {["Morning", "Afternoon"].map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSlotTime(slot)}
                      className={`py-3 rounded-2xl font-bold text-sm transition-all ${slotTime === slot ? "bg-red-600 text-white" : "bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"}`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowInviteModal(false)} className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-600 dark:text-gray-300 font-semibold">Cancel</button>
              <button onClick={handleInviteConfirm} className="flex-1 py-3 bg-red-600 text-white rounded-2xl font-semibold hover:bg-red-700">Send Invitation</button>
            </div>
          </div>
        </div>
      )}

      {/* Decline Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">Decline Donation Request</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Please provide a reason for declining <span className="font-semibold">{selectedRequest?.donorId?.fullName}</span>'s request:
            </p>
            <select
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm mb-4"
            >
              <option value="">Select reason</option>
              <option value="Storage full">Storage full</option>
              <option value="Blood group not needed">Blood group not needed currently</option>
              <option value="Donor not eligible">Donor not eligible</option>
              <option value="Facility closed">Facility temporarily closed</option>
              <option value="Other">Other</option>
            </select>
            <div className="flex gap-3">
              <button onClick={() => setShowDeclineModal(false)} className="flex-1 py-2.5 border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-semibold text-sm rounded-xl">Cancel</button>
              <button onClick={handleDeclineConfirm} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm rounded-xl">Decline Request</button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Donation Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">Finalize Donation</h2>
            <input
              type="number"
              value={units}
              onChange={(e) => setUnits(Number(e.target.value))}
              className="w-full p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl mb-4 border border-gray-200 dark:border-gray-700"
              placeholder="Units collected (usually 1)"
              min={1}
            />
            <div className="flex gap-3">
              <button onClick={() => setShowCompleteModal(false)} className="flex-1 py-3 text-gray-600 dark:text-gray-300 font-semibold border border-gray-200 dark:border-gray-700 rounded-2xl">Cancel</button>
              <button onClick={handleCompleteConfirm} className="flex-1 py-3 bg-green-600 text-white rounded-2xl font-semibold hover:bg-green-700">Confirm & Add to Stock</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonationRequests;
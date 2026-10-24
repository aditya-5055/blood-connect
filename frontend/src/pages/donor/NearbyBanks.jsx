import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { FaTint, FaPhone, FaRegHospital } from "react-icons/fa";
import { MdLocationOn, MdAccessTime, MdMyLocation } from "react-icons/md";
import {
  getNearbyBloodBanks,
  proactiveDonate,
  getMyDonationRequests,
  getAvailableSlotsForBank,
} from "../../services/donorService";

const NearbyBanks = () => {
  const [banks, setBanks] = useState([]);
  const [myRequests, setMyRequests] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  // Slot Booking States
  const [selectedBank, setSelectedBank] = useState(null);
  const [slots, setSlots] = useState([]);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [donating, setDonating] = useState(null);

  useEffect(() => {
    fetchNearbyBanksAndRequests();
  }, []);

  const fetchNearbyBanksAndRequests = async () => {
    setLoading(true);
    try {
      const [banksRes, requestsRes] = await Promise.all([
        getNearbyBloodBanks(),
        getMyDonationRequests()
      ]);
      setBanks(banksRes.bloodBanks || []);
      
      const activeRequests = (requestsRes.donationRequests || []).filter(r => 
        ["booked"].includes(r.status)
      );
      setMyRequests(activeRequests);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load data");
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
          const response = await getNearbyBloodBanks(
            position.coords.longitude,
            position.coords.latitude,
          );
          setBanks(response.bloodBanks || []);
          toast.success("Location refreshed!");
        } catch (error) {
          toast.error("Failed to fetch nearby blood banks");
        } finally {
          setLoading(false);
        }
      },
      () => toast.error("Location access denied"),
    );
  };

  const handleDonate = async (bank) => {
    setDonating(bank._id);
    setSelectedBank(bank);
    try {
      const slotsRes = await getAvailableSlotsForBank(bank._id);
      setSlots(slotsRes.slots || []);
      setShowSlotModal(true);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load available slots");
    } finally {
      setDonating(null);
    }
  };

  const handleConfirmBooking = async (slotId) => {
    setBookingLoading(true);
    try {
      const response = await proactiveDonate({ slotId });
      if (response.success) {
        toast.success("Appointment booked successfully!");
        setShowSlotModal(false);
        await fetchNearbyBanksAndRequests(); 
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to book slot");
    } finally {
      setBookingLoading(false);
    }
  };

  const getButtonState = (bankId) => {
    const activeRequest = myRequests.length > 0 ? myRequests[0] : null;

    if (!activeRequest) {
      return { 
        text: "🩸 Donate Here", 
        disabled: false, 
        colorClass: "bg-red-600 hover:bg-red-700 active:scale-95" 
      };
    }

    const isThisBank = activeRequest.bloodBankId?._id === bankId || activeRequest.bloodBankId === bankId;

    if (isThisBank) {
      switch (activeRequest.status) {
        case "booked": 
          return { text: "✅ Booked Slot", disabled: true, colorClass: "bg-green-600 opacity-80 cursor-not-allowed" };
        default: 
          return { text: "🩸 Donate Here", disabled: false, colorClass: "bg-red-600" };
      }
    }

    return { 
      text: "🩸 Donate Here", 
      disabled: true, 
      colorClass: "bg-gray-400 dark:bg-gray-600 cursor-not-allowed",
      tooltip: "You already have a booked slot with another bank" 
    };
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
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 via-white to-red-50 dark:from-blue-900/20 dark:via-gray-800 dark:to-red-900/20 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Nearby Blood Banks</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Blood banks within 10km of your location</p>
          </div>
          <button
            onClick={handleRefreshLocation}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm"
          >
            <MdMyLocation /> Refresh
          </button>
        </div>
      </div>

      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-2xl p-4 sm:p-5">
        <p className="text-sm text-red-700 dark:text-red-300 font-medium leading-relaxed">
          🩸 You can only book one active appointment slot at a time. Once the donation is completed or cancelled, you can book again.
        </p>
      </div>

      {banks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-10 text-center">
          <FaRegHospital className="mx-auto text-3xl text-gray-400 dark:text-gray-500 mb-3" />
          <p className="text-gray-700 dark:text-gray-300 font-semibold">No blood banks found nearby</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Try refreshing your location and check again.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          {banks.map((bank) => {
            const btnState = getButtonState(bank._id);
            return (
              <div key={bank._id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-11 h-11 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FaTint className="text-blue-600 dark:text-blue-300" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 truncate">{bank.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] rounded-full font-bold uppercase border border-blue-200 dark:border-blue-800/50">
                        {bank.facilityCategory || "Blood Bank"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5 mb-4 text-sm text-gray-600 dark:text-gray-300">
                  <div className="flex items-center gap-2"><FaPhone className="text-gray-400 dark:text-gray-500 text-xs" /> {bank.phone}</div>
                  <div className="flex items-center gap-2"><MdLocationOn className="text-gray-400 dark:text-gray-500" /> {bank.address?.city}, {bank.address?.state}</div>
                  
                  <div className="flex items-center gap-2 font-medium">
                    <MdAccessTime className="text-gray-400 dark:text-gray-500" /> 
                    {bank.is24x7 ? (
                      <span className="text-green-600 dark:text-green-300">Open 24x7</span>
                    ) : (
                      <span className="text-orange-600 dark:text-orange-300">
                        {bank.operatingHours?.open && bank.operatingHours?.close 
                          ? `${bank.operatingHours.open} - ${bank.operatingHours.close}` 
                          : "Hours not specified"}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2">
                  <a href={`tel:${bank.phone}`} className="px-3 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-300 rounded-lg text-xs font-bold transition-all">
                    <FaPhone />
                  </a>
                  <button
                    onClick={() => handleDonate(bank)}
                    disabled={btnState.disabled || donating === bank._id}
                    title={btnState.tooltip || ""}
                    className={`flex-1 py-2 text-white text-xs font-bold rounded-lg transition-all shadow-sm ${btnState.colorClass}`}
                  >
                    {donating === bank._id ? "Loading..." : btnState.text}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Select Appointment Slot Modal */}
      {showSlotModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Select Appointment Slot</h2>
              <button onClick={() => setShowSlotModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 font-bold text-lg">×</button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Available slots for <span className="font-semibold text-gray-900 dark:text-white">{selectedBank?.name}</span>:</p>

              {slots.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No slots available right now. Please check back later.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {slots.map((slot) => {
                    const available = slot.capacity - slot.bookedCount;
                    const isFull = available <= 0;
                    return (
                      <button
                        key={slot._id}
                        disabled={isFull || bookingLoading}
                        onClick={() => handleConfirmBooking(slot._id)}
                        className={`p-4 rounded-2xl border text-left flex justify-between items-center transition-all ${isFull ? "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 opacity-60 cursor-not-allowed" : "border-red-100 dark:border-red-900 bg-red-50/30 dark:bg-red-900/10 hover:border-red-500 hover:bg-red-50/50 dark:hover:bg-red-900/20 active:scale-[0.98]"}`}
                      >
                        <div>
                          <p className="font-bold text-gray-800 dark:text-gray-200 text-sm">
                            {new Date(slot.date).toDateString()}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
                            {slot.startTime} - {slot.endTime}
                          </p>
                        </div>
                        <div className="text-right">
                          {isFull ? (
                            <span className="px-2.5 py-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] font-bold rounded-lg uppercase">Fully Booked</span>
                          ) : (
                            <span className="px-2.5 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-[10px] font-bold rounded-lg uppercase">{available} seats left</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NearbyBanks;
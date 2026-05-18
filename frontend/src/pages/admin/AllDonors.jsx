import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { FaSearch, FaUser } from "react-icons/fa";
import { MdPhone, MdEmail, MdLocationOn } from "react-icons/md";
import { getAllDonors } from "../../services/adminService";
import Avatar from "../../components/ui/Avatar";

const AllDonors = () => {
  const [donors, setDonors] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterBloodGroup, setFilterBloodGroup] = useState("all");

  const bloodGroups = ["all", "A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

  useEffect(() => {
    fetchDonors();
  }, []);

  useEffect(() => {
    let result = donors;
    if (filterBloodGroup !== "all") {
      result = result.filter((d) => d.bloodGroup === filterBloodGroup);
    }
    if (search) {
      result = result.filter(
        (d) =>
          d.fullName.toLowerCase().includes(search.toLowerCase()) ||
          d.email.toLowerCase().includes(search.toLowerCase()) ||
          d.address?.city.toLowerCase().includes(search.toLowerCase())
      );
    }
    setFiltered(result);
  }, [search, filterBloodGroup, donors]);

  const fetchDonors = async () => {
    try {
      const response = await getAllDonors();
      setDonors(response.donors || []);
      setFiltered(response.donors || []);
    } catch (error) {
      toast.error("Failed to load donors");
    } finally {
      setLoading(false);
    }
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
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gradient-to-r from-rose-50 via-white to-blue-50 dark:from-rose-900/20 dark:via-gray-800 dark:to-blue-900/20 px-5 py-5 sm:px-6 sm:py-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">All Donors</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm">View all registered donors</p>
      </div>

      {/* Search + Filter */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-5 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or city..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
          />
        </div>
      </div>

      {/* Blood Group Filter */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
        {bloodGroups.map((bg) => (
          <button
            key={bg}
            onClick={() => setFilterBloodGroup(bg)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
              filterBloodGroup === bg
                ? "bg-red-600 text-white shadow-sm"
                : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-red-300 dark:hover:border-red-500 hover:text-red-600 dark:hover:text-red-300"
            }`}
          >
            {bg === "all" ? "All Blood Groups" : bg}
          </button>
        ))}
      </div>

      {/* Count */}
      <span className="inline-flex items-center px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-full border border-gray-200 dark:border-gray-700">
        {filtered.length} donors found
      </span>

      {/* Donors Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-10 sm:p-12 text-center">
          <FaUser className="text-gray-300 dark:text-gray-600 text-5xl mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">No donors found</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Try changing your search or filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {filtered.map((donor) => (
            <div
              key={donor._id}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 sm:p-5 hover:shadow-md transition-all border border-gray-200 dark:border-gray-700"
            >
              {/* Donor Header */}
              <div className="flex items-center gap-3 mb-4">
                <Avatar name={donor.fullName} size="md" />
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-800 dark:text-gray-200 text-sm truncate">{donor.fullName}</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs rounded-full font-bold border border-red-200 dark:border-red-800/50">
                      {donor.bloodGroup}
                    </span>
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                      donor.isAvailable
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300"
                    }`}>
                      {donor.isAvailable ? "Available" : "Unavailable"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Donor Details */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <MdEmail className="flex-shrink-0 text-gray-400" />
                  <span className="truncate">{donor.email}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <MdPhone className="flex-shrink-0 text-gray-400" />
                  {donor.phone}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <MdLocationOn className="flex-shrink-0 text-gray-400" />
                  <span className="break-words">{donor.address?.city}, {donor.address?.state}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>Age: {donor.age}</span>
                  <span>Gender: {donor.gender}</span>
                </div>
                <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                  donor.eligibleToDonate
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                    : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                }`}>
                  {donor.eligibleToDonate ? "Eligible" : "Not Eligible"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllDonors;
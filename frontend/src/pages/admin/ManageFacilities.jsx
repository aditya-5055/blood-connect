import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { FaHospital, FaTint, FaSearch } from "react-icons/fa";
import { MdLocationOn, MdPhone, MdEmail, MdVerified } from "react-icons/md";
import { getAllFacilities } from "../../services/adminService";

const ManageFacilities = () => {
  const [facilities, setFacilities] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    fetchFacilities();
  }, []);

  useEffect(() => {
    let result = facilities;
    if (filterType !== "all") {
      result = result.filter((f) => f.facilityType === filterType);
    }
    if (search) {
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(search.toLowerCase()) ||
          f.email.toLowerCase().includes(search.toLowerCase()) ||
          f.address?.city.toLowerCase().includes(search.toLowerCase())
      );
    }
    setFiltered(result);
  }, [search, filterType, facilities]);

  const fetchFacilities = async () => {
    try {
      const response = await getAllFacilities();
      setFacilities(response.facilities || []);
      setFiltered(response.facilities || []);
    } catch (error) {
      toast.error("Failed to load facilities");
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
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 via-white to-emerald-50 dark:from-blue-900/20 dark:via-gray-800 dark:to-emerald-900/20 px-5 py-5 sm:px-6 sm:py-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Manage Facilities</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm">All approved hospitals and blood banks</p>
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
        {/* set the filter type to  button active */}
        <div className="grid grid-cols-3 sm:flex gap-2">
          {["all", "hospital", "blood-bank"].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                filterType === type
                  ? "bg-red-600 text-white shadow-sm"
                  : "bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-red-300 dark:hover:border-red-500 hover:text-red-600 dark:hover:text-red-300"
              }`}
            >
              {type === "all" ? "All" : type === "hospital" ? "Hospitals" : "Blood Banks"}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <div className="flex items-center gap-2">
        <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-full border border-gray-200 dark:border-gray-700">
          {filtered.length} facilities found
        </span>
      </div>

      {/* Facilities Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-10 sm:p-12 text-center">
          <FaHospital className="text-gray-300 dark:text-gray-600 text-5xl mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">No facilities found</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Try changing your search or filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
          {filtered.map((facility) => (
            <div
              key={facility._id}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 sm:p-5 hover:shadow-md transition-all border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    facility.facilityType === "hospital" ? "bg-orange-100 dark:bg-orange-900/30" : "bg-blue-100 dark:bg-blue-900/30"
                  }`}>
                    {facility.facilityType === "hospital"
                      ? <FaHospital className="text-orange-600 dark:text-orange-300" />
                      : <FaTint className="text-blue-600 dark:text-blue-300" />
                    }
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-800 dark:text-gray-200 text-sm break-words">{facility.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      facility.facilityType === "hospital"
                        ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                        : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    }`}>
                      {facility.facilityType}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-green-600 dark:text-green-300">
                  <MdVerified className="text-lg" />
                  <span className="text-xs font-medium">Approved</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <MdEmail className="flex-shrink-0" />
                  <span className="break-words">{facility.email}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <MdPhone className="flex-shrink-0" />
                  {facility.phone}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <MdLocationOn className="flex-shrink-0" />
                  <span className="break-words">{facility.address?.city}, {facility.address?.state}</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-3">
                <span className="text-xs text-gray-400">
                  Reg: {facility.registrationNumber}
                </span>
                <span className="text-xs text-gray-400">
                  {facility.facilityCategory}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageFacilities;
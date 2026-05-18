import { useState } from "react";
import { Link } from "react-router-dom";
import { FaTint, FaSearch, FaPhone, FaClock, FaMapMarkerAlt, FaHospital } from "react-icons/fa";
import { MdBloodtype, MdLocalHospital, MdFilterList } from "react-icons/md";
import { findBlood } from "../services/Publicservice";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

const FindBlood = () => {
  const [city, setCity] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all"); // all | blood-bank | hospital

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!city.trim()) {
      setError("Please enter a city to search.");
      return;
    }
    setError("");
    setLoading(true);
    setSearched(false);
    try {
      const data = await findBlood(city.trim(), bloodGroup);
      setResults(data.data || []);
      setSearched(true);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = results.filter((r) => {
    if (filter === "all") return true;
    return r.facilityType === filter;
  });

  const bloodBankCount = results.filter((r) => r.facilityType === "blood-bank").length;
  const hospitalCount = results.filter((r) => r.facilityType === "hospital").length;

  const getFacilityTypeColor = (type) => {
    if (type === "blood-bank") return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700";
    return "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700";
  };

  const getFacilityIconColor = (type) => {
    if (type === "blood-bank") return "bg-red-100 dark:bg-red-900/30";
    return "bg-orange-100 dark:bg-orange-900/30";
  };

  return (
    <div className="public-page">

      {/* Hero / Search Section */}
      <section className="public-hero">
        <div className="max-w-3xl mx-auto text-center">
          <div className="public-hero-badge">
            <FaTint className="text-red-600 dark:text-red-300" />
            Find Blood Near You
          </div>
          <h1 className="public-hero-title mb-4">
            Search Blood Banks <br />
            <span className="text-yellow-300">&amp; Hospitals</span>
          </h1>
          <p className="public-hero-subtitle text-base md:text-lg max-w-xl">
            Find verified blood banks and hospitals in your city. No login required.
          </p>

          {/* Search Form */}
          <form
            onSubmit={handleSearch}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-4 md:p-6 text-left"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* City Input */}
              <div className="md:col-span-1">
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                  City
                </label>
                <div className="relative">
                  <FaMapMarkerAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-red-400" />
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Pune, Mumbai"
                    className="w-full pl-9 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Blood Group Select */}
              <div className="md:col-span-1">
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                  Blood Group (Optional)
                </label>
                <div className="relative">
                  <MdBloodtype className="absolute left-3 top-1/2 -translate-y-1/2 text-red-400 text-lg" />
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent appearance-none bg-white dark:bg-gray-800"
                  >
                    <option value="">All Blood Groups</option>
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Search Button */}
              <div className="md:col-span-1 flex items-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-60"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FaSearch />
                  )}
                  {loading ? "Searching..." : "Search"}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-sm mt-3 font-medium">{error}</p>
            )}
          </form>
        </div>
      </section>

      {/* Results Section */}
      <section className="public-section min-h-[40vh] py-12">
        <div className="max-w-5xl mx-auto">

          {/* Not searched yet */}
          {!searched && !loading && (
            <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
                <FaSearch className="text-red-500 dark:text-red-300 text-3xl" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">Enter a city above to find blood banks &amp; hospitals</p>
              <p className="text-gray-400 text-sm mt-1">Results will appear here</p>
            </div>
          )}

          {/* Results */}
          {searched && (
            <>
              {/* Results Header + Filter */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {filteredResults.length} {filteredResults.length === 1 ? "Result" : "Results"} found
                    <span className="text-gray-500 dark:text-gray-400 font-normal text-base"> in {city}</span>
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                    {bloodBankCount} Blood Banks · {hospitalCount} Hospitals
                  </p>
                </div>

                {/* Filter Tabs */}
                <div className="grid grid-cols-3 gap-1 bg-gray-100 dark:bg-gray-900 p-1 rounded-2xl border border-gray-200 dark:border-gray-700 w-full sm:w-auto">
                  {[
                    { key: "all", label: "All" },
                    { key: "blood-bank", label: "Blood Banks" },
                    { key: "hospital", label: "Hospitals" },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setFilter(tab.key)}
                      className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                        filter === tab.key
                          ? "bg-white dark:bg-gray-800 text-red-600 dark:text-red-300 shadow-sm"
                          : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* No results */}
              {filteredResults.length === 0 && (
                <div className="text-center py-16 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                    <FaTint className="text-gray-400 dark:text-gray-500 text-2xl" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">No facilities found in <span className="font-bold text-gray-700 dark:text-gray-300">{city}</span></p>
                  <p className="text-gray-400 text-sm mt-1">Try a different city name or remove the blood group filter</p>
                </div>
              )}

              {/* Result Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredResults.map((facility) => (
                  <div
                    key={facility._id}
                    className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-all"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${getFacilityIconColor(facility.facilityType)}`}>
                          {facility.facilityType === "blood-bank"
                            ? <MdBloodtype className="text-red-600 dark:text-red-300 text-xl" />
                            : <MdLocalHospital className="text-orange-600 dark:text-orange-300 text-xl" />
                          }
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-gray-800 dark:text-gray-200 text-sm leading-tight">{facility.name}</h3>
                          <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${getFacilityTypeColor(facility.facilityType)}`}>
                            {facility.facilityType === "blood-bank" ? "Blood Bank" : "Hospital"}
                          </span>
                        </div>
                      </div>
                      {facility.facilityCategory && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-900 px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-700 flex-shrink-0">
                          {facility.facilityCategory}
                        </span>
                      )}
                    </div>

                    {/* Details */}
                    <div className="space-y-3">
                      <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <FaMapMarkerAlt className="text-red-500 dark:text-red-300 mt-0.5 flex-shrink-0" />
                        <span className="leading-relaxed">
                          {facility.address?.city}, {facility.address?.state} — {facility.address?.pincode}
                        </span>
                      </div>

                      {facility.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <FaPhone className="text-green-500 dark:text-green-300 flex-shrink-0" />
                          <a href={`tel:${facility.phone}`} className="hover:text-green-600 dark:hover:text-green-300 transition-colors">
                            {facility.phone}
                          </a>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <FaClock className="text-blue-500 dark:text-blue-300 flex-shrink-0" />
                        {facility.is24x7 ? (
                          <span className="text-green-700 dark:text-green-300 font-semibold">Open 24×7</span>
                        ) : (
                          <span>
                            {facility.operatingHours?.open || "09:00"} – {facility.operatingHours?.close || "18:00"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="public-cta py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="public-cta-title text-2xl md:text-4xl mb-4">
            Can't find blood nearby?
          </h2>
          <p className="public-cta-subtitle mb-8 text-base md:text-lg">
            Register as a donor or post an emergency request. Our network will reach out to nearby donors instantly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="inline-block px-8 py-3 bg-white text-red-600 font-bold rounded-xl hover:bg-gray-100 transition-all shadow-lg"
            >
              🩸 Become a Donor
            </Link>
            <Link
              to="/login"
              className="inline-block px-8 py-3 bg-transparent border border-white text-white font-bold rounded-xl hover:bg-white/10 transition-all"
            >
              🏥 Post Emergency Request
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default FindBlood;
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FaTint } from "react-icons/fa";
import { MdBloodtype, MdInfo } from "react-icons/md";
import { postBloodRequest } from "../../services/hospitalService";
import { BLOOD_GROUPS } from "../../constants/bloodGroups";

const PostRequest = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    bloodGroup: "",
    units: "",
    urgencyLevel: "",
    notes: "",
  });

  const urgencyLevels = [
    {
      value: "Critical",
      label: "Critical",
      description: "Deadline: 2 hours",
      color: "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300",
      selectedColor: "border-red-600 dark:border-red-500 bg-red-600 dark:bg-red-500 text-white shadow-md",
    },
    {
      value: "High",
      label: "High",
      description: "Deadline: 6 hours",
      color: "border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300",
      selectedColor: "border-orange-600 dark:border-orange-500 bg-orange-600 dark:bg-orange-500 text-white shadow-md",
    },
    {
      value: "Moderate",
      label: "Moderate",
      description: "Deadline: 12 hours",
      color: "border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300",
      selectedColor: "border-yellow-600 dark:border-yellow-500 bg-yellow-600 dark:bg-yellow-500 text-white shadow-md",
    },
    {
      value: "Normal",
      label: "Normal",
      description: "Deadline: 24 hours",
      color: "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300",
      selectedColor: "border-green-600 dark:border-green-500 bg-green-600 dark:bg-green-500 text-white shadow-md",
    },
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUrgencySelect = (value) => {
    setFormData({ ...formData, urgencyLevel: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate
    if (!formData.bloodGroup || !formData.units || !formData.urgencyLevel) {
      toast.error("Please fill all required fields");
      return;
    }
    if (formData.units < 1) {
      toast.error("Units must be at least 1");
      return;
    }

    setLoading(true);
    try {
      const response = await postBloodRequest({
        ...formData,
        units: Number(formData.units),
      });
      if (response.success) {
        toast.success("Blood request posted successfully!");
        navigate("/hospital/my-requests");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to post request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Post Blood Request</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Request blood from nearby blood banks</p>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 sm:p-5 flex gap-3 shadow-sm">
        <MdInfo className="text-blue-600 dark:text-blue-300 text-xl flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-blue-700 dark:text-blue-300 font-semibold">How it works:</p>
          <ul className="text-xs text-blue-700/90 dark:text-blue-200 mt-1 space-y-0.5 leading-relaxed">
            <li>1. Post your blood request with urgency level</li>
            <li>2. Nearby blood banks (50km) get notified</li>
            <li>3. If no bank responds → nearby donors get notified</li>
            <li>4. You get notified when someone confirms</li>
          </ul>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Blood Group */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <MdBloodtype className="inline mr-1 text-red-600 dark:text-red-400" />
              Blood Group *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
              {BLOOD_GROUPS.map((bg) => (
                <button
                  key={bg}
                  type="button"
                  onClick={() => setFormData({ ...formData, bloodGroup: bg })}
                  className={`py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                    formData.bloodGroup === bg
                      ? "border-red-600 dark:border-red-500 bg-red-600 dark:bg-red-500 text-white shadow-md"
                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:border-red-300 dark:hover:border-red-500 hover:text-red-600 dark:hover:text-red-300"
                  }`}
                >
                  {bg}
                </button>
              ))}
            </div>
          </div>

          {/* Units */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Units Required *
            </label>
            <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, units: Math.max(1, Number(formData.units) - 1).toString() })}
                className="w-10 h-10 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:border-red-300 dark:hover:border-red-500 hover:text-red-600 dark:hover:text-red-300 font-bold text-xl transition-all"
              >
                -
              </button>
              <input
                type="number"
                name="units"
                value={formData.units}
                onChange={handleChange}
                min={1}
                placeholder="0"
                className="w-24 px-4 py-2.5 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm text-center font-bold"
              />
              <button
                type="button"
                onClick={() => setFormData({ ...formData, units: (Number(formData.units) + 1).toString() })}
                className="w-10 h-10 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:border-red-300 dark:hover:border-red-500 hover:text-red-600 dark:hover:text-red-300 font-bold text-xl transition-all"
              >
                +
              </button>
              <span className="text-sm text-gray-500 dark:text-gray-400">units of blood</span>
            </div>
          </div>

          {/* Urgency Level */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Urgency Level *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {urgencyLevels.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => handleUrgencySelect(level.value)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    formData.urgencyLevel === level.value
                      ? level.selectedColor
                      : level.color
                  }`}
                >
                  <p className="font-bold text-sm">{level.label}</p>
                  <p className="text-xs mt-0.5 opacity-80">{level.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any additional information about the patient or request..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm resize-none"
            />
          </div>

          {/* Summary */}
          {formData.bloodGroup && formData.units && formData.urgencyLevel && (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Request Summary:</p>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm font-bold rounded-full">
                  {formData.bloodGroup}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {formData.units} unit(s)
                </span>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                  formData.urgencyLevel === "Critical" ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300" :
                  formData.urgencyLevel === "High" ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300" :
                  formData.urgencyLevel === "Moderate" ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300" :
                  "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                }`}>
                  {formData.urgencyLevel}
                </span>
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-300 dark:disabled:bg-red-900/40 text-white font-semibold rounded-xl transition-all shadow-md"
          >
            {loading ? "Posting request..." : "Post Blood Request"}
          </button>

        </form>
      </div>

    </div>
  );
};

export default PostRequest;
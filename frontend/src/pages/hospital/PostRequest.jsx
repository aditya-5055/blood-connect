import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FaTint, FaSpinner, FaChevronDown, FaChevronUp, FaTimes } from "react-icons/fa";
import { MdBloodtype, MdInfo } from "react-icons/md";
import { postBloodRequest } from "../../services/hospitalService";
import { BLOOD_GROUPS } from "../../constants/bloodGroups";
import useSmartAssist from "../../hooks/useSmartAssist";

// ─── Small reusable badge shown on AI-filled fields ───────────────────────────
const AiBadge = () => (
  <span className="inline-flex items-center gap-1 ml-2 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-medium rounded-full border border-purple-200 dark:border-purple-700 animate-fade-in">
    <span>✨</span>
    AI suggested
  </span>
);

const PostRequest = () => {
  const navigate = useNavigate();

  // ─── Form state (completely unchanged structure) ────────────────────────────
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    bloodGroup: "",
    units: "",
    urgencyLevel: "",
    notes: "",
  });

  // ─── AI-origin tracker ─────────────────────────────────────────────────────
  // Tracks which fields were last set by Smart Assist.
  // The moment the doctor manually edits a field, that key is removed here.
  const [aiFields, setAiFields] = useState({
    bloodGroup: false,
    units: false,
    urgencyLevel: false,
    notes: false,
  });

  // ─── Smart Assist state ────────────────────────────────────────────────────
  const { runSmartAssist, loading: aiLoading, error: aiError } = useSmartAssist();
  const [assistOpen, setAssistOpen] = useState(false);
  const [assistNote, setAssistNote] = useState("");
  const [assistDismissed, setAssistDismissed] = useState(false); // for inline error dismiss

  // ─── Urgency level config ──────────────────────────────────────────────────
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

  // ─── Handlers: manual edits clear the AI badge for that specific field ─────

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Doctor is taking ownership — clear the AI indicator for this field only
    if (aiFields[name]) {
      setAiFields((prev) => ({ ...prev, [name]: false }));
    }
  };

  const handleUrgencySelect = (value) => {
    setFormData((prev) => ({ ...prev, urgencyLevel: value }));
    // Manual click → clear urgency AI badge
    if (aiFields.urgencyLevel) {
      setAiFields((prev) => ({ ...prev, urgencyLevel: false }));
    }
  };

  const handleBloodGroupSelect = (bg) => {
    setFormData((prev) => ({ ...prev, bloodGroup: bg }));
    // Manual click → clear bloodGroup AI badge
    if (aiFields.bloodGroup) {
      setAiFields((prev) => ({ ...prev, bloodGroup: false }));
    }
  };

  const handleUnitsButton = (newVal) => {
    setFormData((prev) => ({ ...prev, units: newVal }));
    // ± button click → clear units AI badge
    if (aiFields.units) {
      setAiFields((prev) => ({ ...prev, units: false }));
    }
  };

  // ─── Smart Assist: populate form fields, set AI badges ────────────────────
  const handleSmartAssist = async () => {
    setAssistDismissed(false);
    const result = await runSmartAssist(assistNote);

    if (!result) {
      // Error message is shown inline near the button (handled below via aiError)
      return;
    }

    // Only update fields where AI returned a non-null value.
    // Never touch a field the AI left null — leave it empty for manual entry.
    const newFormData = { ...formData };
    const newAiFields = { ...aiFields };

    if (result.bloodGroup !== null && result.bloodGroup !== undefined) {
      newFormData.bloodGroup = result.bloodGroup;
      newAiFields.bloodGroup = true;
    }
    if (result.units !== null && result.units !== undefined) {
      newFormData.units = String(result.units);
      newAiFields.units = true;
    }
    if (result.urgencyLevel !== null && result.urgencyLevel !== undefined) {
      newFormData.urgencyLevel = result.urgencyLevel;
      newAiFields.urgencyLevel = true;
    }
    if (result.notes !== null && result.notes !== undefined) {
      newFormData.notes = result.notes;
      newAiFields.notes = true;
    }

    setFormData(newFormData);
    setAiFields(newAiFields);

    const filledCount = [
      result.bloodGroup, result.units, result.urgencyLevel, result.notes,
    ].filter((v) => v !== null && v !== undefined).length;

    toast.success(
      filledCount > 0
        ? `✨ Smart Assist filled ${filledCount} field${filledCount > 1 ? "s" : ""}. Review before submitting.`
        : "Smart Assist couldn't extract any fields — please fill manually."
    );
  };

  // ─── Submit: 100% identical to original — Smart Assist never touches this ──
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

  // ─── Helpers ───────────────────────────────────────────────────────────────

  // Left-border highlight wrapper applied to any field that was AI-filled
  const aiFieldWrapper = (fieldKey, children) => (
    <div
      className={`transition-all duration-300 ${
        aiFields[fieldKey]
          ? "pl-3 border-l-2 border-purple-400 dark:border-purple-500"
          : ""
      }`}
    >
      {children}
    </div>
  );

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

      {/* ✨ Smart Assist Panel */}
      <div className="rounded-2xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 shadow-sm overflow-hidden">
        {/* Toggle header */}
        <button
          type="button"
          onClick={() => setAssistOpen((prev) => !prev)}
          className="w-full flex items-center justify-between px-5 py-3.5 text-left"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-purple-700 dark:text-purple-300">
            <span className="text-base">✨</span>
            Smart Assist
            <span className="text-xs font-normal text-purple-500 dark:text-purple-400">
              — describe the situation, we'll fill the form
            </span>
          </span>
          {assistOpen
            ? <FaChevronUp className="text-purple-500 dark:text-purple-400 text-xs flex-shrink-0" />
            : <FaChevronDown className="text-purple-500 dark:text-purple-400 text-xs flex-shrink-0" />}
        </button>

        {/* Collapsible body */}
        {assistOpen && (
          <div className="px-5 pb-5 space-y-3">
            <textarea
              value={assistNote}
              onChange={(e) => setAssistNote(e.target.value)}
              placeholder="e.g. Patient met with a road accident, needs 2 units O negative, losing blood continuously..."
              rows={3}
              className="w-full px-4 py-3 border border-purple-200 dark:border-purple-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm resize-none placeholder-gray-400 dark:placeholder-gray-500"
            />

            <div className="flex items-start gap-3 flex-wrap">
              {/* Smart Assist button */}
              <button
                type="button"
                onClick={handleSmartAssist}
                disabled={aiLoading || assistNote.trim().length < 10}
                className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 dark:disabled:bg-purple-900/40 text-white text-sm font-semibold rounded-xl transition-all shadow-sm"
              >
                {aiLoading ? (
                  <>
                    <FaSpinner className="animate-spin text-sm" />
                    Analysing...
                  </>
                ) : (
                  <>
                    <span>✨</span>
                    Smart Assist
                  </>
                )}
              </button>

              {/* Under-10-char nudge */}
              {assistNote.trim().length > 0 && assistNote.trim().length < 10 && (
                <p className="text-xs text-purple-500 dark:text-purple-400 self-center">
                  Please provide more detail (min 10 characters)
                </p>
              )}

              {/* Dismissible inline error — only shown when AI failed */}
              {aiError && !assistDismissed && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                  <p className="text-xs text-red-600 dark:text-red-400">
                    Couldn't auto-fill — please enter details manually.
                  </p>
                  <button
                    type="button"
                    onClick={() => setAssistDismissed(true)}
                    className="text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-300 flex-shrink-0"
                  >
                    <FaTimes className="text-xs" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Blood Group */}
          {aiFieldWrapper("bloodGroup",
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <MdBloodtype className="inline mr-1 text-red-600 dark:text-red-400" />
                Blood Group *
                {aiFields.bloodGroup && <AiBadge />}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
                {BLOOD_GROUPS.map((bg) => (
                  <button
                    key={bg}
                    type="button"
                    onClick={() => handleBloodGroupSelect(bg)}
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
          )}

          {/* Units */}
          {aiFieldWrapper("units",
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Units Required *
                {aiFields.units && <AiBadge />}
              </label>
              <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                <button
                  type="button"
                  onClick={() => handleUnitsButton(Math.max(1, Number(formData.units) - 1).toString())}
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
                  onClick={() => handleUnitsButton((Number(formData.units) + 1).toString())}
                  className="w-10 h-10 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:border-red-300 dark:hover:border-red-500 hover:text-red-600 dark:hover:text-red-300 font-bold text-xl transition-all"
                >
                  +
                </button>
                <span className="text-sm text-gray-500 dark:text-gray-400">units of blood</span>
              </div>
            </div>
          )}

          {/* Urgency Level */}
          {aiFieldWrapper("urgencyLevel",
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Urgency Level *
                {aiFields.urgencyLevel && <AiBadge />}
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
          )}

          {/* Notes */}
          {aiFieldWrapper("notes",
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Additional Notes (Optional)
                {aiFields.notes && <AiBadge />}
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
          )}

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

          {/* Submit — completely untouched, identical to original */}
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
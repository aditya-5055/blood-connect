 

import { useState } from "react";
import { parseBloodRequest } from "../services/hospitalService";

const useSmartAssist = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

 
  const runSmartAssist = async (noteText) => {
    setLoading(true);
    setError(null);

    try {
      const response = await parseBloodRequest(noteText);

      if (response.success) {
         console.log("[SmartAssist] ✅ Parsed result:", response.data);
        return response.data; 
      } else {
         const msg = response.message || "Smart Assist could not process the note.";
        setError(msg);
        console.warn("[SmartAssist] ⚠️ Backend returned failure:", msg);
        return null;
      }
    } catch (err) {
       const msg =
        err?.response?.data?.message ||
        "AI service is temporarily unavailable. Please fill in the form manually.";
      setError(msg);
      console.error("[SmartAssist] ❌ Error:", msg, err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    runSmartAssist, // call this with the note text
    loading,        // true while the request is in flight
    error,          // string | null — user-facing error message
  };
};

export default useSmartAssist;

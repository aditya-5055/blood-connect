// const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center">

//       {/* Backdrop */}
//       <div
//         className="absolute inset-0 bg-black/50"
//         onClick={onCancel}
//       />

//       {/* Modal */}
//       <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 z-10">

//         {/* Icon */}
//         <div className="flex items-center justify-center w-14 h-14 bg-red-100 rounded-full mx-auto mb-4">
//           <span className="text-2xl">🚪</span>
//         </div>

//         {/* Title */}
//         <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 text-center mb-2">
//           {title || "Are you sure?"}
//         </h3>

//         {/* Message */}
//         <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
//           {message || "This action cannot be undone."}
//         </p>

//         {/* Buttons */}
//         <div className="flex gap-3">
//           <button
//             onClick={onCancel}
//             className="flex-1 px-4 py-3 border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-sm"
//           >
//             Cancel
//           </button>
//           <button
//             onClick={onConfirm}
//             className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all text-sm shadow-md"
//           >
//             Yes, Logout
//           </button>
//         </div>

//       </div>
//     </div>
//   );
// };

// export default ConfirmationModal;

const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 z-10">
        {/* Warning Icon */}
        <div className="flex items-center justify-center w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full mx-auto mb-4">
          <span className="text-2xl text-red-600">⚠️</span>
        </div>

        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 text-center mb-2">
          {title || "Are you sure?"}
        </h3>

        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
          {message || "This action cannot be undone."}
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-sm"
          >
            Go Back
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all text-sm shadow-md"
          >
            {confirmText || "Confirm"} {/* ✅ This is now dynamic */}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
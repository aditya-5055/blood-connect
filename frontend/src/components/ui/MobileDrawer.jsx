import { useEffect } from "react";
import { MdClose } from "react-icons/md";

/**
 * MobileDrawer Component
 * Slide-in drawer for mobile navigation
 */

const MobileDrawer = ({
  isOpen,
  onClose,
  title,
  children,
  position = "left", // "left" or "right"
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1050]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 bottom-0 ${
          position === "left" ? "left-0" : "right-0"
        } w-64 md:w-72 bg-white dark:bg-gray-900 shadow-2xl z-[1051] transition-transform duration-300 overflow-y-auto ${
          isOpen ? "translate-x-0" : position === "left" ? "-translate-x-full" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4 z-10">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close drawer"
          >
            <MdClose className="text-2xl text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">{children}</div>
      </div>
    </>
  );
};

export default MobileDrawer;

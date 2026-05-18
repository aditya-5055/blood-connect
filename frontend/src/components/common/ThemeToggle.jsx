import { useTheme } from "../../context/ThemeContext";
import { FiMoon, FiSun } from "react-icons/fi";

const ThemeToggle = ({ className = "" }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label="Toggle theme"
      className={`relative inline-flex h-10 w-10 items-center justify-center rounded-xl
        bg-gray-100 dark:bg-gray-800/80
        text-gray-500 dark:text-gray-400
        hover:bg-red-50 dark:hover:bg-gray-700
        hover:text-amber-500 dark:hover:text-amber-400
        border border-gray-200 dark:border-gray-700
        transition-all duration-300 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
        dark:focus:ring-offset-gray-900
        ${className}`}
    >
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        <FiSun 
          className={`absolute text-[1.1rem] transition-all duration-500 ease-[cubic-bezier(0.4,0.0,0.2,1)] ${
            isDark ? 'opacity-0 translate-y-4 rotate-45 scale-75' : 'opacity-100 translate-y-0 rotate-0 scale-100'
          }`} 
        />
        <FiMoon 
          className={`absolute text-[1.1rem] transition-all duration-500 ease-[cubic-bezier(0.4,0.0,0.2,1)] ${
            isDark ? 'opacity-100 translate-y-0 rotate-0 scale-100' : 'opacity-0 -translate-y-4 -rotate-45 scale-75'
          }`} 
        />
      </div>
    </button>
  );
};

export default ThemeToggle;

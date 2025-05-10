import { useEffect, useState } from "react";
import { FiSun, FiMoon } from "react-icons/fi";
import { motion } from "framer-motion";

const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const initialTheme = prefersDark ? "dark" : "light";
      setTheme(initialTheme);
      document.documentElement.setAttribute("data-theme", initialTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  };

  if (!isMounted) return null;

  return (
    <div className="flex justify-center items-center gap-2">
      <FiSun className="text-[var(--text-secondary)]" />
      <button
        onClick={toggleTheme}
        className="relative w-14 h-7 rounded-full bg-[var(--input-bg)] border border-[var(--border-color)] mx-2 focus:outline-none"
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      >
        <motion.div
          className="absolute top-1 left-1 w-5 h-5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center"
          animate={{ x: theme === "dark" ? 26 : 0 }}
          transition={{ type: "spring", stiffness: 700, damping: 30 }}
        >
          {theme === "dark" ? (
            <FiMoon className="text-white text-xs" />
          ) : (
            <FiSun className="text-white text-xs" />
          )}
        </motion.div>
      </button>
      <FiMoon className="text-[var(--text-secondary)]" />
    </div>
  );
};

export default ThemeToggle;
import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import SidebarDesktop from "./SidebarDesktop";
import SidebarMobile from "./SidebarMobile";
import { FiMenu } from "react-icons/fi";

const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addListener(listener);
    return () => media.removeListener(listener);
  }, [matches, query]);

  return matches;
};

const AppLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)]">
      {/* Conditionally render desktop sidebar only on desktop */}
      {isDesktop && <SidebarDesktop />}
      
      {/* Mobile Sidebar - only visible when isSidebarOpen is true */}
      <SidebarMobile isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      
      <div className="flex-1 md:ml-[var(--sidebar-desktop-width)] transition-all duration-300">
        {/* Mobile Header - only visible on small screens */}
        {!isDesktop && (
          <header className="bg-[var(--sidebar-bg)] p-4 border-b border-[var(--border-color)] fixed top-0 left-0 right-0 z-40 backdrop-blur-md shadow-sm">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="text-[var(--text-primary)] text-2xl neumorphic-button p-2 rounded-lg"
              aria-label="Open Sidebar"
            >
              <FiMenu />
            </button>
          </header>
        )}
        <main className="pt-16 md:pt-0 p-4 md:p-6 max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
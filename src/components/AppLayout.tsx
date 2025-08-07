import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import SidebarDesktop from "./SidebarDesktop";
import SidebarMobile from "./SidebarMobile";
import Navbar from "./Navbar";

const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    if (media.addEventListener) {
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    } else {
      media.addListener(listener);
      return () => media.removeListener(listener);
    }
  }, [matches, query]);

  return matches;
};

const AppLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Hidden by default on mobile
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // Set sidebar state based on screen size
  useEffect(() => {
    if (isDesktop) {
      setIsSidebarOpen(true); // Always visible on desktop
    } else {
      setIsSidebarOpen(false); // Hidden by default on mobile
    }
  }, [isDesktop]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg-primary)]">
      {/* Top Navbar */}
      <Navbar toggleSidebar={toggleSidebar} />
      
      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        {isDesktop && <SidebarDesktop isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />}
        
        {/* Mobile Sidebar */}
        {!isDesktop && <SidebarMobile isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />}
        
        <div
          className={`flex-1 transition-all duration-300 main-content ${isDesktop ? 'ml-[var(--sidebar-desktop-width)]' : isSidebarOpen ? 'ml-[280px]' : 'ml-0'}`}
          style={{ maxWidth: isDesktop ? 'calc(100% - var(--sidebar-desktop-width))' : '100%' }}
        >
          <main className="w-full px-4 md:px-6">
  <Outlet />
</main>

        </div>
      </div>
    </div>
  );
};

export default AppLayout;
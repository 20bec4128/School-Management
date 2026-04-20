import { createContext, useContext, useState } from 'react';

const SidebarContext = createContext();

export const SidebarProvider = ({ children }) => {
  // Mobile: show/hide sidebar
  const [isOpen, setIsOpen] = useState(false);
  // Desktop: collapse to icon-only (86px)
  const [isCollapsed, setIsCollapsed] = useState(false);

  const openSidebar   = () => setIsOpen(true);
  const closeSidebar  = () => setIsOpen(false);

  // Hamburger: on mobile toggles open/close, on desktop toggles collapse
  const toggleSidebar = () => {
    if (window.innerWidth >= 1200) {
      setIsCollapsed((prev) => !prev);
    } else {
      setIsOpen((prev) => !prev);
    }
  };

  return (
    <SidebarContext.Provider value={{ isOpen, isCollapsed, openSidebar, closeSidebar, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => useContext(SidebarContext);

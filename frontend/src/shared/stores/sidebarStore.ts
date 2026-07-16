import { create } from "zustand";

interface SidebarState {
  isSidebarExpanded: boolean;
  setIsSidebarExpanded: (expanded: boolean) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isSidebarExpanded: false,
  setIsSidebarExpanded: (expanded) => set({ isSidebarExpanded: expanded }),
}));

import { create } from "zustand";
import { applyTheme, readTheme, type Theme } from "@/lib/theme";

type UiState = {
  theme: Theme;
  /** The feed plays without sound until the person taps the sound button once. */
  muted: boolean;
  syncTheme: () => void;
  setTheme: (theme: Theme) => void;
  setMuted: (muted: boolean) => void;
  /** A short message at the bottom of the screen, gone after a few seconds. */
  toast: string | null;
  showToast: (text: string | null) => void;
};

export const useUi = create<UiState>((set) => ({
  theme: "dark",
  muted: true,
  syncTheme: () => set({ theme: readTheme() }),
  setTheme: (theme) => {
    applyTheme(theme);
    set({ theme });
  },
  setMuted: (muted) => set({ muted }),
  toast: null,
  showToast: (toast) => set({ toast }),
}));

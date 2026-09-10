import {create} from 'zustand';

type AppState = {
  appName: string;
  /** @orphan-ok-symbol setAppName - the app is called Succesor and nothing
   *  renames it. Kept as the one thing this store is for. */
  setAppName: (name: string) => void;
};

export const useAppStore = create<AppState>(set => ({
  appName: 'Succesor',
  setAppName: appName => set({appName}),
}));

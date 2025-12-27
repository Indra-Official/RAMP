import { create } from 'zustand';

interface mode {
  status: string;
  setdtatus: (s: string) => void;
}

export const useMode = create<mode>((set) => ({
  status: 'DISCONNECTED',
  setdtatus: (status) => set({ status }),   
}));


interface online {
  status: string;
  setdtatus: (s: string) => void;
}

export const useOnline = create<online>((set) => ({
  status: 'off',
  setdtatus: (status) => set({ status }),   
}));

interface offline {
  status: string;
  setdtatus: (s: string) => void;
}

export const useOffline = create<offline>((set) => ({
  status: 'off',
  setdtatus: (status) => set({ status }),   
}));

interface users {
  status: any;
  setdtatus: (any : any) => void;
}

export const useUsers = create<users>((set) => ({
  status: 'off',
  setdtatus: (status) => set({ status }),   
}));
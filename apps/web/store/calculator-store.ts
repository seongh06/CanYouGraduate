import { create } from 'zustand';

interface CalculatorState {
  selectedSemesterId: number | null;
  selectSemester: (id: number) => void;
}

export const useCalculatorStore = create<CalculatorState>((set) => ({
  selectedSemesterId: null,
  selectSemester: (id) => set({ selectedSemesterId: id }),
}));

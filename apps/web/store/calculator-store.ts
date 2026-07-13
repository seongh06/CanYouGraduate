import { create } from 'zustand';

interface CalculatorState {
  step: 1 | 2 | 3;
  selectedSemesterId: number | null;
  goToStep: (n: 1 | 2 | 3) => void;
  selectSemester: (id: number) => void;
}

export const useCalculatorStore = create<CalculatorState>((set) => ({
  step: 1,
  selectedSemesterId: null,
  goToStep: (n) => set({ step: n }),
  selectSemester: (id) => set({ selectedSemesterId: id }),
}));

import { create } from 'zustand';
import { Product } from '../types';

export type TitleSize = 'sm' | 'md' | 'lg' | 'xl';
export type TabType = 'weekly' | 'monthly' | 'special';

interface EditorSnapshot {
  title: string;
  backgroundColor: string;
  gradient: [string, string] | null;
  backgroundImageUrl: string | undefined;
  textColor: string;
  titleSize: TitleSize;
  elements: string[];
  selectedProducts: Product[];
  tabType: TabType;
}

interface TabState extends EditorSnapshot {
  currentStep: number;
  layout: 'grid2x2' | 'grid3x3' | 'list';
  history: EditorSnapshot[];
  historyIndex: number;

  setStep: (step: number) => void;
  toggleProduct: (product: Product) => void;
  setSelectedProducts: (products: Product[]) => void;
  reorderProducts: (from: number, to: number) => void;
  setTitle: (title: string) => void;
  setLayout: (layout: TabState['layout']) => void;
  setBackgroundColor: (color: string) => void;
  setGradient: (gradient: [string, string] | null) => void;
  setBackgroundImageUrl: (url: string | undefined) => void;
  setTextColor: (color: string) => void;
  setTitleSize: (size: TitleSize) => void;
  addElement: (element: string) => void;
  removeElement: (element: string) => void;
  setTabType: (type: TabType) => void;

  pushHistory: () => void;
  undo: () => void;
  redo: () => void;

  reset: () => void;
}

const initialEditorState: EditorSnapshot = {
  title: 'OFERTAS DA SEMANA',
  backgroundColor: '#2563EB',
  gradient: ['#1A0A4D', '#2563EB'],
  backgroundImageUrl: undefined,
  textColor: '#F59E0B',
  titleSize: 'lg',
  elements: [],
  selectedProducts: [],
  tabType: 'weekly',
};

const initialState = {
  ...initialEditorState,
  currentStep: 0,
  layout: 'grid2x2' as const,
  history: [] as EditorSnapshot[],
  historyIndex: -1,
};

export const useTabStore = create<TabState>((set) => ({
  ...initialState,

  setStep: (step) => set({ currentStep: step }),

  toggleProduct: (product) =>
    set((state) => {
      const exists = state.selectedProducts.find((p) => p.id === product.id);
      if (exists) {
        return { selectedProducts: state.selectedProducts.filter((p) => p.id !== product.id) };
      }
      return { selectedProducts: [...state.selectedProducts, product] };
    }),

  setSelectedProducts: (products) => set({ selectedProducts: products }),

  reorderProducts: (from, to) =>
    set((state) => {
      const prods = [...state.selectedProducts];
      const [moved] = prods.splice(from, 1);
      prods.splice(to, 0, moved);
      return { selectedProducts: prods };
    }),

  setTitle: (title) => set({ title }),
  setLayout: (layout) => set({ layout }),
  setBackgroundColor: (backgroundColor) => set({ backgroundColor }),
  setGradient: (gradient) => set({ gradient }),
  setBackgroundImageUrl: (backgroundImageUrl) => set({ backgroundImageUrl }),
  setTextColor: (textColor) => set({ textColor }),
  setTitleSize: (titleSize) => set({ titleSize }),
  setTabType: (tabType) => set({ tabType }),

  addElement: (element) =>
    set((state) => ({ elements: [...state.elements, element] })),

  removeElement: (element) =>
    set((state) => ({ elements: state.elements.filter((e) => e !== element) })),

  pushHistory: () =>
    set((state) => {
      const snapshot: EditorSnapshot = {
        title: state.title,
        backgroundColor: state.backgroundColor,
        gradient: state.gradient,
        backgroundImageUrl: state.backgroundImageUrl,
        textColor: state.textColor,
        titleSize: state.titleSize,
        elements: [...state.elements],
        selectedProducts: [...state.selectedProducts],
        tabType: state.tabType,
      };
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(snapshot);
      const trimmed = newHistory.slice(-10);
      return { history: trimmed, historyIndex: trimmed.length - 1 };
    }),

  undo: () =>
    set((state) => {
      if (state.historyIndex <= 0) return {};
      const newIndex = state.historyIndex - 1;
      const snap = state.history[newIndex];
      return { ...snap, elements: [...snap.elements], selectedProducts: [...snap.selectedProducts], historyIndex: newIndex };
    }),

  redo: () =>
    set((state) => {
      if (state.historyIndex >= state.history.length - 1) return {};
      const newIndex = state.historyIndex + 1;
      const snap = state.history[newIndex];
      return { ...snap, elements: [...snap.elements], selectedProducts: [...snap.selectedProducts], historyIndex: newIndex };
    }),

  reset: () => set(initialState),
}));

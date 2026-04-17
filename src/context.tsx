import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type ReactNode,
} from 'react';
import { type WeekEntry, type Department, type ViewMode } from './types';
import { generateId } from './lib/utils';

interface State {
  entries: WeekEntry[];
  viewMode: ViewMode;
  selectedDepartments: Department[];
}

type Action =
  | { type: 'ADD_ENTRIES'; payload: WeekEntry[] }
  | { type: 'ADD_ENTRY'; payload: Omit<WeekEntry, 'id'> }
  | { type: 'UPDATE_ENTRY'; payload: WeekEntry }
  | { type: 'DELETE_ENTRY'; payload: string }
  | { type: 'CLEAR_ALL' }
  | { type: 'SET_VIEW_MODE'; payload: ViewMode }
  | { type: 'SET_SELECTED_DEPARTMENTS'; payload: Department[] }
  | { type: 'LOAD_STATE'; payload: State };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_ENTRIES':
      return { ...state, entries: [...state.entries, ...action.payload] };
    case 'ADD_ENTRY':
      return {
        ...state,
        entries: [...state.entries, { ...action.payload, id: generateId() }],
      };
    case 'UPDATE_ENTRY':
      return {
        ...state,
        entries: state.entries.map((e) =>
          e.id === action.payload.id ? action.payload : e
        ),
      };
    case 'DELETE_ENTRY':
      return {
        ...state,
        entries: state.entries.filter((e) => e.id !== action.payload),
      };
    case 'CLEAR_ALL':
      return { ...state, entries: [] };
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload };
    case 'SET_SELECTED_DEPARTMENTS':
      return { ...state, selectedDepartments: action.payload };
    case 'LOAD_STATE':
      return action.payload;
    default:
      return state;
  }
}

import { DEPARTMENTS } from './types';

const initialState: State = {
  entries: [],
  viewMode: 'weekly',
  selectedDepartments: [...DEPARTMENTS],
};

interface ContextValue {
  state: State;
  addEntries: (entries: WeekEntry[]) => void;
  addEntry: (entry: Omit<WeekEntry, 'id'>) => void;
  updateEntry: (entry: WeekEntry) => void;
  deleteEntry: (id: string) => void;
  clearAll: () => void;
  setViewMode: (mode: ViewMode) => void;
  setSelectedDepartments: (depts: Department[]) => void;
}

const AppContext = createContext<ContextValue | null>(null);

const STORAGE_KEY = 'manpower-dashboard-v1';

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState, (init) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<State>;
        return {
          entries: parsed.entries ?? init.entries,
          viewMode: parsed.viewMode ?? init.viewMode,
          selectedDepartments: parsed.selectedDepartments ?? init.selectedDepartments,
        };
      }
    } catch {
      // ignore
    }
    return init;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore quota errors
    }
  }, [state]);

  const value: ContextValue = {
    state,
    addEntries: (entries) => dispatch({ type: 'ADD_ENTRIES', payload: entries }),
    addEntry: (entry) => dispatch({ type: 'ADD_ENTRY', payload: entry }),
    updateEntry: (entry) => dispatch({ type: 'UPDATE_ENTRY', payload: entry }),
    deleteEntry: (id) => dispatch({ type: 'DELETE_ENTRY', payload: id }),
    clearAll: () => dispatch({ type: 'CLEAR_ALL' }),
    setViewMode: (mode) => dispatch({ type: 'SET_VIEW_MODE', payload: mode }),
    setSelectedDepartments: (depts) =>
      dispatch({ type: 'SET_SELECTED_DEPARTMENTS', payload: depts }),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): ContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

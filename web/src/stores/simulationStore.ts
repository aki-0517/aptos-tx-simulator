import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { SimulationResult, TransactionData, TransactionStatus } from '@/types';
import { transactionSimulator } from '@/lib/simulator';

interface SimulationStore {
  // Transaction data
  transactionData: Partial<TransactionData>;
  setTransactionData: (data: Partial<TransactionData>) => void;
  updateTransactionField: (field: keyof TransactionData, value: any) => void;
  
  // Simulation status
  status: TransactionStatus;
  setStatus: (status: TransactionStatus['status']) => void;
  
  // Results
  result: SimulationResult | null;
  setResult: (result: SimulationResult | null) => void;
  
  // History
  history: SimulationResult[];
  addToHistory: (result: SimulationResult) => void;
  clearHistory: () => void;
  
  // Actions
  simulateTransaction: () => Promise<void>;
  resetSimulation: () => void;
  
  // Validation
  validationErrors: string[];
  setValidationErrors: (errors: string[]) => void;
}

export const useSimulationStore = create<SimulationStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      transactionData: {
        type: 'entry_function',
        sender: '',
        maxGasAmount: 100000,
        gasUnitPrice: 100,
      },
      
      status: { status: 'pending' },
      result: null,
      history: [],
      validationErrors: [],
      
      // Setters
      setTransactionData: (data) =>
        set((state) => ({
          transactionData: { ...state.transactionData, ...data },
        })),
      
      updateTransactionField: (field, value) =>
        set((state) => ({
          transactionData: { ...state.transactionData, [field]: value },
        })),
      
      setStatus: (status) =>
        set((state) => ({
          status: { ...state.status, status },
        })),
      
      setResult: (result) => set({ result }),
      
      addToHistory: (result) =>
        set((state) => ({
          history: [result, ...state.history].slice(0, 50), // Keep last 50 results
        })),
      
      clearHistory: () => set({ history: [] }),
      
      setValidationErrors: (errors) => set({ validationErrors: errors }),
      
      // Actions
      simulateTransaction: async () => {
        const { transactionData, setStatus, setResult, addToHistory } = get();
        
        try {
          setStatus('simulating');
          
          // Validate transaction
          const validation = await transactionSimulator.validateTransaction(transactionData as TransactionData);
          if (!validation.valid) {
            set({ validationErrors: validation.errors });
            setStatus('error');
            return;
          }
          
          set({ validationErrors: [] });
          
          // Run simulation
          const result = await transactionSimulator.simulateTransaction(transactionData as TransactionData);
          
          setResult(result);
          addToHistory(result);
          
          if (result.success) {
            setStatus('success');
          } else {
            setStatus('error');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'シミュレーションエラー';
          setStatus('error');
          set({
            status: { status: 'error', error: errorMessage }
          });
        }
      },
      
      resetSimulation: () =>
        set({
          result: null,
          status: { status: 'pending' },
          validationErrors: [],
        }),
    }),
    {
      name: 'simulation-store',
    }
  )
);
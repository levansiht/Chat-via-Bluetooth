import React, {createContext, useState, useContext, ReactNode} from 'react';
import RealBluetoothService from './BluetoothService';
import MockBluetoothService from './MockBluetoothService';

// Define the shape of the context
interface BluetoothContextType {
  bluetoothService: typeof RealBluetoothService | typeof MockBluetoothService;
  useMockService: boolean;
  toggleMockService: () => void;
}

// Create the context
const BluetoothContext = createContext<BluetoothContextType | undefined>(
  undefined,
);

// Provider component
export const BluetoothProvider: React.FC<{children: ReactNode}> = ({
  children,
}) => {
  const [useMockService, setUseMockService] = useState<boolean>(false);

  // Choose the appropriate service based on the mock flag
  const bluetoothService = useMockService
    ? MockBluetoothService
    : RealBluetoothService;

  // Function to toggle between real and mock services
  const toggleMockService = () => {
    setUseMockService(prev => !prev);
  };

  // Context value
  const contextValue: BluetoothContextType = {
    bluetoothService,
    useMockService,
    toggleMockService,
  };

  return (
    <BluetoothContext.Provider value={contextValue}>
      {children}
    </BluetoothContext.Provider>
  );
};

// Custom hook to use the bluetooth context
export const useBluetoothService = (): BluetoothContextType => {
  const context = useContext(BluetoothContext);

  if (context === undefined) {
    throw new Error(
      'useBluetoothService must be used within a BluetoothProvider',
    );
  }

  return context;
};

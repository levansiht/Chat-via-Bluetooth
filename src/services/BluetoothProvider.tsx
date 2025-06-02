import React, {createContext, useState, useContext, ReactNode} from 'react';
import RealBluetoothService from './BluetoothService';
import MockBluetoothService from './MockBluetoothService';

interface BluetoothContextType {
  bluetoothService: typeof RealBluetoothService | typeof MockBluetoothService;
  useMockService: boolean;
  toggleMockService: () => void;
}

const BluetoothContext = createContext<BluetoothContextType | undefined>(
  undefined,
);

export const BluetoothProvider: React.FC<{children: ReactNode}> = ({
  children,
}) => {
  const [useMockService, setUseMockService] = useState<boolean>(false);

  const bluetoothService = useMockService
    ? MockBluetoothService
    : RealBluetoothService;

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

export const useBluetoothService = (): BluetoothContextType => {
  const context = useContext(BluetoothContext);

  if (context === undefined) {
    throw new Error(
      'useBluetoothService must be used within a BluetoothProvider',
    );
  }

  return context;
};

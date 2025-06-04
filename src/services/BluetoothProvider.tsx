import React, {createContext, useContext, ReactNode} from 'react';
import BluetoothService from './BluetoothService';

interface BluetoothContextType {
  bluetoothService: typeof BluetoothService;
}

const BluetoothContext = createContext<BluetoothContextType | undefined>(
  undefined,
);

export const BluetoothProvider: React.FC<{children: ReactNode}> = ({
  children,
}) => {
  const contextValue: BluetoothContextType = {
    bluetoothService: BluetoothService,
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

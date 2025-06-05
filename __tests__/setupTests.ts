import '@testing-library/jest-native/extend-expect';

// Mock react-native modules
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');

  // Mock only the components we need, avoid spreading the entire RN object
  return {
    Alert: {
      alert: jest.fn(),
    },
    Platform: {
      OS: 'android',
      select: jest.fn(),
    },
    LogBox: {
      ignoreLogs: jest.fn(),
    },
    View: RN.View,
    Text: RN.Text,
    TouchableOpacity: RN.TouchableOpacity,
    ScrollView: RN.ScrollView,
    TextInput: RN.TextInput,
    FlatList: RN.FlatList,
    StyleSheet: RN.StyleSheet,
    Dimensions: RN.Dimensions,
    ActivityIndicator: RN.ActivityIndicator,
    // Add other components as needed without spreading the entire object
  };
});

// Mock react-native-ble-plx
jest.mock('react-native-ble-plx', () => ({
  BleManager: jest.fn(() => ({
    onStateChange: jest.fn(),
    startDeviceScan: jest.fn(),
    stopDeviceScan: jest.fn(),
    connectToDevice: jest.fn(),
    discoverAllServicesAndCharacteristicsForDevice: jest.fn(),
    writeCharacteristicWithResponseForDevice: jest.fn(),
    monitorCharacteristicForDevice: jest.fn(),
    cancelDeviceConnection: jest.fn(),
  })),
  State: {
    PoweredOn: 'PoweredOn',
    PoweredOff: 'PoweredOff',
  },
}));

// Mock react-native-linear-gradient
jest.mock('react-native-linear-gradient', () => 'LinearGradient');

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

// Mock @react-navigation/native
jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
  useRoute: jest.fn(),
  NavigationContainer: ({children}: any) => children,
  createNavigationContainerRef: jest.fn(),
}));

// Mock @react-navigation/native-stack
jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: jest.fn(),
}));

// Mock WatermelonDB
jest.mock('@nozbe/watermelondb', () => ({
  Database: jest.fn(),
  Model: jest.fn(),
  Q: {
    where: jest.fn(),
    take: jest.fn(),
    sortBy: jest.fn(),
  },
  appSchema: jest.fn(),
  tableSchema: jest.fn(),
}));

jest.mock('@nozbe/watermelondb/adapters/sqlite', () => {
  // Mock the SQLiteAdapter constructor
  const MockSQLiteAdapter = jest.fn().mockImplementation(() => ({
    initialize: jest.fn(),
    setUpWithSchema: jest.fn(),
    find: jest.fn(),
    query: jest.fn(),
    count: jest.fn(),
    batch: jest.fn(),
    getDeletedRecords: jest.fn(),
    destroyDeletedRecords: jest.fn(),
  }));

  return MockSQLiteAdapter;
});

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({children}: any) => children,
  SafeAreaView: ({children}: any) => children,
  useSafeAreaInsets: jest.fn(() => ({top: 0, bottom: 0, left: 0, right: 0})),
}));

// Mock react-native-screens
jest.mock('react-native-screens', () => ({
  enableScreens: jest.fn(),
}));

// Mock the entire database module to avoid SQLiteAdapter issues
jest.mock('../src/database', () => ({
  database: {
    get: jest.fn(),
    write: jest.fn().mockImplementation(action => action()),
    adapter: {
      underlyingAdapter: {
        schema: {},
      },
    },
  },
}));

// Global test timeout
jest.setTimeout(10000);

// Silence console warnings during tests
console.warn = jest.fn();
console.error = jest.fn();

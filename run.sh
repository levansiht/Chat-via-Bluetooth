#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}BLE Chat App Runner${NC}"
echo "-------------------------"

# Function to display usage
function show_usage {
  echo -e "${YELLOW}Usage:${NC}"
  echo "  ./run.sh [options]"
  echo ""
  echo -e "${YELLOW}Options:${NC}"
  echo "  android    - Run the Android application"
  echo "  ios        - Run the iOS application"
  echo "  clean      - Clean the project"
  echo "  help       - Show this help message"
}

# No arguments provided
if [ $# -eq 0 ]; then
  show_usage
  exit 1
fi

# Handle the arguments
case $1 in
  android)
    echo -e "${GREEN}Running Android application...${NC}"
    npx react-native run-android
    ;;
    
  ios)
    echo -e "${GREEN}Running iOS application...${NC}"
    cd ios && pod install && cd ..
    npx react-native run-ios
    ;;
    
  clean)
    echo -e "${GREEN}Cleaning project...${NC}"
    rm -rf node_modules
    rm -rf ios/Pods
    rm -rf ios/build
    rm -rf android/build
    rm -rf android/app/build
    echo -e "${GREEN}Reinstalling dependencies...${NC}"
    npm install
    cd ios && pod install && cd ..
    echo -e "${GREEN}Clean complete!${NC}"
    ;;
    
  help)
    show_usage
    ;;
    
  *)
    echo -e "${RED}Unknown option: $1${NC}"
    show_usage
    exit 1
    ;;
esac

exit 0 
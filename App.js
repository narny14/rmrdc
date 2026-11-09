// App.js
import React from 'react';
import { StatusBar } from 'react-native';
import ErrorBoundary from './src/components/ErrorBoundary';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <ErrorBoundary>
      <StatusBar barStyle="dark-content" />
      <AppNavigator />
    </ErrorBoundary>  
  );
}
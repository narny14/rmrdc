// src/components/ErrorBoundary.js
import React, { Component } from 'react';
import { View, Text, Alert } from 'react-native';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    Alert.alert('❌ Erreur', `Message: ${error.message}\n\nStack: ${error.stack}`);
    console.error('ErrorBoundary catch:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Une erreur est survenue. Vérifiez la console.</Text>
        </View>
      );
    }
    return this.props.children;
  }
}
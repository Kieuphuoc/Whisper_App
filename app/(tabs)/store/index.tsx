import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function StoreScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Store Screen</Text>
      <Text style={styles.subtext}>Coming Soon...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtext: {
    fontSize: 16,
    color: '#888',
    marginTop: 10,
  },
});

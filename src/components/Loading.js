
import React from 'react';
import { View, ActivityIndicator } from 'react-native';

const Loading = ({ size }) => {
  return (
    <View style={styles.spinnerContainer}>
      <ActivityIndicator size={size}/>
    </View>
  );
};

const styles = {
  spinnerContainer: {
    marginTop: 12,
    marginBottom: 12
  }
};

export { Loading };
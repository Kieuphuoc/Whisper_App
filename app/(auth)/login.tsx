import * as Google from 'expo-auth-session/providers/google';
import React, { useEffect } from 'react';
import { Button, View } from 'react-native';

export default function LoginScreen() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId:
      '241223139219-6dt3hh6r6hbcr9i8t9rq3ecf5s92er05.apps.googleusercontent.com',

    iosClientId:
      '241223139219-jf3hp4o6f036rvp884onhl7cpfel4stq.apps.googleusercontent.com',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      console.log('Access Token:', response.authentication?.accessToken);
    }
  }, [response]);

  return (
    <View style={{ marginTop: 100 }}>
      <Button
        title="Login with Google"
        disabled={!request}
        onPress={() => promptAsync({ useProxy: true })}
      />
    </View>
  );
}
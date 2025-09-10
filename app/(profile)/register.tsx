// import { Ionicons } from '@expo/vector-icons';
// import { useRouter } from 'expo-router';
// import React, { useState } from 'react';
// import { Image, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
// import Apis, { endpoints } from '../../configs/Apis';

// export default function RegisterScreen() {
//   const router = useRouter();
//   const [user, setUser] = useState({
//     username: '',
//     email: '',
//     password: '',
//     confirmPassword: '',
//   });
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');

//   const validateForm = () => {
//     if (!user.username || !user.email || !user.password || !user.confirmPassword) {
//       setError('Please fill in all fields');
//       return false;
//     }

//     if (user.password !== user.confirmPassword) {
//       setError('Passwords do not match');
//       return false;
//     }

//     if (user.password.length < 6) {
//       setError('Password must be at least 6 characters');
//       return false;
//     }

//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(user.email)) {
//       setError('Please enter a valid email address');
//       return false;
//     }

//     return true;
//   };

//   const handleRegister = async () => {
//     if (!validateForm()) {
//       return;
//     }

//     try {
//       setLoading(true);
//       setError('');

//       const res = await Apis.post(endpoints['login'], {
//         username: user.username,
//         email: user.email,
//         password: user.password,
//       });

//       if (res.data.success) {
//         router.push('/(tabs)');
//       } else {
//         setError(res.data.message || 'Registration failed');
//       }
//     } catch (error: any) {
//       console.error('Registration error:', error);
//       setError(error.response?.data?.message || 'Registration failed. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
//       {/* Background Image */}
//       <Image
//         source={{ uri: 'https://i.pinimg.com/736x/8f/4f/83/8f4f836b45cae5270f1d717af7158070.jpg' }}
//         style={styles.backgroundImage}
//       />
      
//       {/* Overlay */}
//       <View style={styles.overlay} />
      
//       {/* Content */}
//       <View style={styles.content}>
//         {/* Header Section */}
//         <View style={styles.headerSection}>
//           <View style={styles.logoCircle}>
//             <Ionicons name="mic" size={32} color="#8b5cf6" />
//           </View>
//           <Text style={styles.title}>Join Whisper</Text>
//           <Text style={styles.subtitle}>Start your voice journey today</Text>
//         </View>

//         {/* Register Form */}
//         <View style={styles.bentoContainer}>
//           <View style={styles.welcomeBento}>
//             <Text style={styles.welcomeText}>Create Account</Text>
//             <Text style={styles.signInText}>Sign up to begin capturing memories</Text>
//           </View>

//           {/* Username Input */}
//           <View style={styles.inputBento}>
//             <View style={styles.inputWrapper}>
//               <Ionicons name="person-outline" size={20} color="#6b7280" style={styles.inputIcon} />
//               <TextInput
//                 style={styles.input}
//                 placeholder="Username"
//                 placeholderTextColor="#9ca3af"
//                 value={user.username}
//                 onChangeText={(text) => setUser({ ...user, username: text })}
//                 autoCapitalize="none"
//               />
//             </View>
//           </View>

//           {/* Email Input */}
//           <View style={styles.inputBento}>
//             <View style={styles.inputWrapper}>
//               <Ionicons name="mail-outline" size={20} color="#6b7280" style={styles.inputIcon} />
//               <TextInput
//                 style={styles.input}
//                 placeholder="Email"
//                 placeholderTextColor="#9ca3af"
//                 value={user.email}
//                 onChangeText={(text) => setUser({ ...user, email: text })}
//                 autoCapitalize="none"
//                 keyboardType="email-address"
//               />
//             </View>
//           </View>

//           {/* Password Input */}
//           <View style={styles.inputBento}>
//             <View style={styles.inputWrapper}>
//               <Ionicons name="lock-closed-outline" size={20} color="#6b7280" style={styles.inputIcon} />
//               <TextInput
//                 style={styles.input}
//                 placeholder="Password"
//                 placeholderTextColor="#9ca3af"
//                 value={user.password}
//                 onChangeText={(text) => setUser({ ...user, password: text })}
//                 secureTextEntry={!showPassword}
//                 autoCapitalize="none"
//               />
//               <TouchableOpacity
//                 onPress={() => setShowPassword(!showPassword)}
//                 style={styles.eyeButton}
//               >
//                 <Ionicons
//                   name={showPassword ? "eye-off-outline" : "eye-outline"}
//                   size={20}
//                   color="#6b7280"
//                 />
//               </TouchableOpacity>
//             </View>
//           </View>

//           {/* Confirm Password Input */}
//           <View style={styles.inputBento}>
//             <View style={styles.inputWrapper}>
//               <Ionicons name="lock-closed-outline" size={20} color="#6b7280" style={styles.inputIcon} />
//               <TextInput
//                 style={styles.input}
//                 placeholder="Confirm Password"
//                 placeholderTextColor="#9ca3af"
//                 value={user.confirmPassword}
//                 onChangeText={(text) => setUser({ ...user, confirmPassword: text })}
//                 secureTextEntry={!showConfirmPassword}
//                 autoCapitalize="none"
//               />
//               <TouchableOpacity
//                 onPress={() => setShowConfirmPassword(!showConfirmPassword)}
//                 style={styles.eyeButton}
//               >
//                 <Ionicons
//                   name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
//                   size={20}
//                   color="#6b7280"
//                 />
//               </TouchableOpacity>
//             </View>
//           </View>

//           {/* Error Message */}
//           {error ? (
//             <View style={styles.errorBento}>
//               <Ionicons name="alert-circle-outline" size={16} color="#ef4444" />
//               <Text style={styles.errorText}>{error}</Text>
//             </View>
//           ) : null}

//           {/* Register Button */}
//           <TouchableOpacity
//             style={[styles.registerButton, loading && styles.registerButtonDisabled]}
//             onPress={handleRegister}
//             disabled={loading}
//           >
//             {loading ? (
//               <Text style={styles.registerButtonText}>Creating account...</Text>
//             ) : (
//               <>
//                 <Ionicons name="person-add-outline" size={20} color="white" />
//                 <Text style={styles.registerButtonText}>Create Account</Text>
//               </>
//             )}
//           </TouchableOpacity>

//           {/* Divider */}
//           <View style={styles.dividerContainer}>
//             <View style={styles.dividerLine} />
//             <Text style={styles.dividerText}>or continue with</Text>
//             <View style={styles.dividerLine} />
//           </View>

//           {/* Social Login */}
//           <View style={styles.socialBento}>
//             <TouchableOpacity style={styles.socialButton}>
//               <Ionicons name="logo-google" size={20} color="#ea4335" />
//               <Text style={styles.socialButtonText}>Google</Text>
//             </TouchableOpacity>
            
//             <TouchableOpacity style={styles.socialButton}>
//               <Ionicons name="logo-apple" size={20} color="#000000" />
//               <Text style={styles.socialButtonText}>Apple</Text>
//             </TouchableOpacity>
//           </View>

//           {/* Sign In Link */}
//           <View style={styles.signupBento}>
//             <Text style={styles.signupText}>Already have an account? </Text>
//             <TouchableOpacity onPress={() => router.push('/(tabs)/login')}>
//               <Text style={styles.loginText}>Sign in</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#1a1a1a',
//   },
//   backgroundImage: {
//     position: 'absolute',
//     width: '100%',
//     height: '100%',
//   },
//   overlay: {
//     position: 'absolute',
//     width: '100%',
//     height: '100%',
//     backgroundColor: 'rgba(64, 64, 64, 0.7)',
//   },
//   content: {
//     flex: 1,
//     justifyContent: 'center',
//     paddingHorizontal: 24,
//   },
//   headerSection: {
//     alignItems: 'center',
//     marginBottom: 40,
//   },
//   logoCircle: {
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//     backgroundColor: 'rgba(255, 255, 255, 0.95)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 20,
//     shadowColor: '#8b5cf6',
//     shadowOffset: { width: 0, height: 8 },
//     shadowOpacity: 0.3,
//     shadowRadius: 16,
//     elevation: 12,
//     borderWidth: 2,
//     borderColor: 'rgba(139, 92, 246, 0.2)',
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: '700',
//     color: '#ffffff',
//     marginBottom: 8,
//     textShadowColor: 'rgba(0, 0, 0, 0.5)',
//     textShadowOffset: { width: 0, height: 2 },
//     textShadowRadius: 4,
//   },
//   subtitle: {
//     fontSize: 16,
//     color: 'rgba(255, 255, 255, 0.8)',
//     textAlign: 'center',
//     textShadowColor: 'rgba(0, 0, 0, 0.5)',
//     textShadowOffset: { width: 0, height: 1 },
//     textShadowRadius: 2,
//   },
//   bentoContainer: {
//     backgroundColor: 'rgba(255, 255, 255, 0.95)',
//     borderRadius: 24,
//     padding: 24,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 16 },
//     shadowOpacity: 0.25,
//     shadowRadius: 24,
//     elevation: 16,
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.2)',
//   },
//   welcomeBento: {
//     alignItems: 'center',
//     marginBottom: 24,
//   },
//   welcomeText: {
//     fontSize: 20,
//     fontWeight: '600',
//     color: '#1a1a1a',
//     marginBottom: 4,
//   },
//   signInText: {
//     fontSize: 14,
//     color: '#6b7280',
//     textAlign: 'center',
//   },
//   inputBento: {
//     marginBottom: 16,
//   },
//   inputWrapper: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#ffffff',
//     borderRadius: 16,
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderWidth: 1,
//     borderColor: '#e5e7eb',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   inputIcon: {
//     marginRight: 12,
//   },
//   input: {
//     flex: 1,
//     fontSize: 16,
//     color: '#1a1a1a',
//     paddingVertical: 4,
//   },
//   eyeButton: {
//     padding: 4,
//   },
//   errorBento: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'rgba(239, 68, 68, 0.1)',
//     borderRadius: 12,
//     padding: 12,
//     marginBottom: 16,
//     borderWidth: 1,
//     borderColor: 'rgba(239, 68, 68, 0.2)',
//   },
//   errorText: {
//     marginLeft: 8,
//     fontSize: 14,
//     color: '#ef4444',
//     fontWeight: '500',
//   },
//   registerButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: '#8b5cf6',
//     borderRadius: 16,
//     paddingVertical: 16,
//     marginBottom: 24,
//     shadowColor: '#8b5cf6',
//     shadowOffset: { width: 0, height: 8 },
//     shadowOpacity: 0.3,
//     shadowRadius: 16,
//     elevation: 8,
//   },
//   registerButtonDisabled: {
//     backgroundColor: '#a78bfa',
//     opacity: 0.7,
//   },
//   registerButtonText: {
//     marginLeft: 8,
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#ffffff',
//   },
//   dividerContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 24,
//   },
//   dividerLine: {
//     flex: 1,
//     height: 1,
//     backgroundColor: '#e5e7eb',
//   },
//   dividerText: {
//     marginHorizontal: 16,
//     fontSize: 14,
//     color: '#6b7280',
//     fontWeight: '500',
//   },
//   socialBento: {
//     flexDirection: 'row',
//     gap: 12,
//     marginBottom: 24,
//   },
//   socialButton: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: '#ffffff',
//     borderRadius: 16,
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//     borderWidth: 1,
//     borderColor: '#e5e7eb',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   socialButtonText: {
//     marginLeft: 8,
//     fontSize: 14,
//     fontWeight: '500',
//     color: '#374151',
//   },
//   signupBento: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   signupText: {
//     fontSize: 14,
//     color: '#6b7280',
//   },
//   loginText: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#8b5cf6',
//   },
// });

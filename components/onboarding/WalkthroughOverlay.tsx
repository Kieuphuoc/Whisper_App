import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Modal,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView, AnimatePresence } from 'moti';
import { theme } from '@/constants/Theme';

const { width, height } = Dimensions.get('window');

export interface WalkthroughStep {
  id: string;
  title: string;
  description: string;
  targetPos?: { top?: number; bottom?: number; left?: number; right?: number; width?: number; height?: number };
  icon: string;
}

interface WalkthroughOverlayProps {
  visible: boolean;
  steps: WalkthroughStep[];
  onFinish: () => void;
}

export default function WalkthroughOverlay({ visible, steps, onFinish }: WalkthroughOverlayProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  if (!visible || steps.length === 0) return null;

  const currentStep = steps[currentStepIndex];

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      onFinish();
    }
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <StatusBar barStyle="light-content" />
        
        {/* Backdrop holes would be better but let's stick to a simple modal with highlight for now */}
        <AnimatePresence exitBeforeEnter>
          <MotiView
            key={currentStep.id}
            from={{ opacity: 0, scale: 0.9, translateY: 20 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            exit={{ opacity: 0, scale: 0.9, translateY: -20 }}
            transition={{ type: 'timing', duration: 400 }}
            style={[
              styles.card,
              currentStep.targetPos?.bottom 
                ? { bottom: currentStep.targetPos.bottom + 100 } 
                : { top: (currentStep.targetPos?.top || 200) + 80 }
            ]}
          >
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Ionicons name={currentStep.icon as any} size={24} color="#fff" />
              </View>
              <Text style={styles.title}>{currentStep.title}</Text>
            </View>
            <Text style={styles.description}>{currentStep.description}</Text>
            
            <View style={styles.footer}>
              <TouchableOpacity onPress={onFinish}>
                <Text style={styles.skipButtonText}>Bỏ qua</Text>
              </TouchableOpacity>
              
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.stepIndicator}>
                  {currentStepIndex + 1} / {steps.length}
                </Text>
                <TouchableOpacity style={styles.button} onPress={handleNext}>
                  <Text style={styles.buttonText}>
                    {currentStepIndex === steps.length - 1 ? 'Bắt đầu' : 'Tiếp theo'}
                  </Text>
                  <Ionicons 
                    name={currentStepIndex === steps.length - 1 ? "checkmark" : "arrow-forward"} 
                    size={18} 
                    color="#fff" 
                    style={{ marginLeft: 5 }}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </MotiView>
        </AnimatePresence>

        {/* Optional: Highlight circle */}
        {currentStep.targetPos && (
             <MotiView 
                from={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', delay: 200 }}
                style={[
                    styles.highlight,
                    {
                        top: currentStep.targetPos.top,
                        bottom: currentStep.targetPos.bottom,
                        left: currentStep.targetPos.left,
                        right: currentStep.targetPos.right,
                        width: currentStep.targetPos.width || 80,
                        height: currentStep.targetPos.height || 80,
                        borderRadius: (currentStep.targetPos.width || 80) / 2,
                    }
                ]}
             />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    position: 'absolute',
    width: width * 0.85,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Quicksand_700Bold',
    color: '#0f172a',
    flex: 1,
  },
  description: {
    fontSize: 15,
    fontFamily: 'Quicksand_500Medium',
    color: '#64748b',
    lineHeight: 22,
    marginBottom: 24,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepIndicator: {
    fontSize: 14,
    fontFamily: 'Quicksand_600SemiBold',
    color: '#94a3b8',
    marginRight: 12,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Quicksand_700Bold',
  },
  skipButtonText: {
    color: '#94a3b8',
    fontSize: 15,
    fontFamily: 'Quicksand_600SemiBold',
  },
  highlight: {
    position: 'absolute',
    borderWidth: 4,
    borderColor: '#8b5cf6',
    backgroundColor: 'transparent',
    zIndex: -1,
  },
});

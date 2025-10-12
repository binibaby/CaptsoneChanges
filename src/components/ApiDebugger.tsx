import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { reverbMessagingService } from '../services/reverbMessagingService';

const ApiDebugger: React.FC = () => {
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const clearLogs = () => {
    setDebugLogs([]);
  };

  const runComprehensiveDebug = async () => {
    setIsRunning(true);
    addLog('🚀 Starting comprehensive API debug...');
    
    try {
      // Override console.log temporarily to capture logs
      const originalLog = console.log;
      const originalError = console.error;
      
      console.log = (...args) => {
        addLog(args.join(' '));
        originalLog(...args);
      };
      
      console.error = (...args) => {
        addLog(`❌ ${args.join(' ')}`);
        originalError(...args);
      };

      await reverbMessagingService.debugApiIssues();
      
      // Restore original console methods
      console.log = originalLog;
      console.error = originalError;
      
      addLog('✅ Comprehensive debug completed');
    } catch (error) {
      addLog(`❌ Debug error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsRunning(false);
    }
  };

  const testConversations = async () => {
    setIsRunning(true);
    addLog('💬 Testing conversations API...');
    
    try {
      const conversations = await reverbMessagingService.getConversations();
      addLog(`✅ Conversations loaded: ${conversations.length} conversations`);
    } catch (error) {
      addLog(`❌ Conversations error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsRunning(false);
    }
  };

  const testAuth = async () => {
    setIsRunning(true);
    addLog('🔐 Testing authentication...');
    
    try {
      await reverbMessagingService.debugAuthStatus();
      addLog('✅ Auth test completed');
    } catch (error) {
      addLog(`❌ Auth test error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsRunning(false);
    }
  };

  const testConnection = async () => {
    setIsRunning(true);
    addLog('🔌 Testing connection...');
    
    try {
      const result = await reverbMessagingService.testConnection();
      addLog(`✅ Connection test result: ${result}`);
    } catch (error) {
      addLog(`❌ Connection test error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsRunning(false);
    }
  };

  const testAuth = async () => {
    setIsRunning(true);
    addLog('🔐 Testing authentication...');
    
    try {
      const isAuthenticated = await reverbMessagingService.isUserAuthenticated();
      addLog(`🔐 User authenticated: ${isAuthenticated}`);
      
      if (!isAuthenticated) {
        addLog('🔄 Attempting to reconnect with fresh auth...');
        await reverbMessagingService.reconnectWithFreshAuth();
        addLog('✅ Reconnection attempt completed');
      }
    } catch (error) {
      addLog(`❌ Auth test error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsRunning(false);
    }
  };

  const forceReconnect = async () => {
    setIsRunning(true);
    addLog('🔄 Forcing reconnection with fresh auth...');
    
    try {
      await reverbMessagingService.reconnectWithFreshAuth();
      addLog('✅ Reconnection completed');
    } catch (error) {
      addLog(`❌ Reconnection error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsRunning(false);
    }
  };

  const testWebSocket = async () => {
    setIsRunning(true);
    addLog('🔌 Testing WebSocket connection...');
    
    try {
      const result = await reverbMessagingService.testWebSocketConnection();
      addLog(`🔌 WebSocket test result: ${result ? 'SUCCESS' : 'FAILED'}`);
    } catch (error) {
      addLog(`❌ WebSocket test error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>API Debugger</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, isRunning && styles.buttonDisabled]}
          onPress={runComprehensiveDebug}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>Run Full Debug</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, isRunning && styles.buttonDisabled]}
          onPress={testConversations}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>Test Conversations</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, isRunning && styles.buttonDisabled]}
          onPress={testConnection}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>Test Connection</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, isRunning && styles.buttonDisabled]}
          onPress={forceReconnect}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>Force Reconnect</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, isRunning && styles.buttonDisabled]}
          onPress={testWebSocket}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>Test WebSocket</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={clearLogs}
        >
          <Text style={styles.buttonText}>Clear Logs</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.logContainer}>
        {debugLogs.map((log, index) => (
          <Text key={index} style={styles.logText}>
            {log}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  logContainer: {
    flex: 1,
    backgroundColor: '#000',
    borderRadius: 8,
    padding: 10,
  },
  logText: {
    color: '#00FF00',
    fontFamily: 'monospace',
    fontSize: 12,
    marginBottom: 2,
  },
});

export default ApiDebugger;

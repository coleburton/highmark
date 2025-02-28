import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Button, Image, TextInput, TouchableOpacity } from 'react-native';
import { listSupabaseFiles, getSupabasePublicUrl } from '../utils/imageUtils';
import { supabase } from '../lib/supabase';

const DebugScreen = () => {
  const [files, setFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testUrls, setTestUrls] = useState<{url: string, status: string}[]>([]);
  const [customFilename, setCustomFilename] = useState('');

  const loadFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      // Try to list files in different possible locations
      const strainFiles = await listSupabaseFiles('images/strains/');
      const assetsStrainFiles = await listSupabaseFiles('assets/images/strains/');
      const rootFiles = await listSupabaseFiles('');
      
      setFiles([
        ...strainFiles.map(f => `images/strains/${f}`),
        ...assetsStrainFiles.map(f => `assets/images/strains/${f}`),
        ...rootFiles
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testImageUrl = async (path: string) => {
    try {
      const url = getSupabasePublicUrl('assets', path);
      
      // Test if the URL is accessible
      const response = await fetch(url, { method: 'HEAD' });
      
      setTestUrls(prev => [
        ...prev, 
        { 
          url, 
          status: response.ok ? 'OK' : `Error: ${response.status}` 
        }
      ]);
      
      return { url, status: response.ok ? 'OK' : `Error: ${response.status}` };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setTestUrls(prev => [...prev, { url: path, status: `Error: ${errorMsg}` }]);
      return { url: path, status: `Error: ${errorMsg}` };
    }
  };

  const testCommonPaths = async () => {
    setTestUrls([]);
    
    // Test with actual filenames from your database
    const commonFilenames = [
      'blue_dream_1.jpg',
      'og_kush_1.jpg',
      'sour_diesel_1.jpg',
      'northern_lights_1.png',
      'jack_herer_1.png',
      'pineapple_express_1.png',
      'gsc_1.png',
      'gdp_1.png'
    ];
    
    // Test each filename with different path combinations
    for (const filename of commonFilenames) {
      const pathsToTry = [
        `images/strains/${filename}`,
        `strains/${filename}`,
        filename
      ];
      
      for (const path of pathsToTry) {
        await testImageUrl(path);
      }
    }
  };

  const testCustomFilename = async () => {
    if (!customFilename.trim()) {
      setError('Please enter a filename to test');
      return;
    }
    
    setTestUrls([]);
    
    // Test the custom filename with different path combinations
    const pathsToTry = [
      `images/strains/${customFilename}`,
      `strains/${customFilename}`,
      customFilename
    ];
    
    for (const path of pathsToTry) {
      await testImageUrl(path);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Supabase Storage Debug</Text>
      
      <View style={styles.buttonContainer}>
        <Button title="Refresh Files" onPress={loadFiles} disabled={loading} />
        <Button title="Test Common Paths" onPress={testCommonPaths} disabled={loading} />
      </View>
      
      <View style={styles.customTestContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter filename to test (e.g. blue_dream_1.png)"
          placeholderTextColor="#999"
          value={customFilename}
          onChangeText={setCustomFilename}
        />
        <TouchableOpacity 
          style={styles.testButton}
          onPress={testCustomFilename}
          disabled={loading}
        >
          <Text style={styles.testButtonText}>Test</Text>
        </TouchableOpacity>
      </View>
      
      {loading && <Text style={styles.loading}>Loading...</Text>}
      {error && <Text style={styles.error}>{error}</Text>}
      
      <Text style={styles.sectionTitle}>Files in Storage:</Text>
      {files.length === 0 ? (
        <Text style={styles.noFiles}>No files found</Text>
      ) : (
        files.map((file, index) => (
          <Text key={index} style={styles.file}>{file}</Text>
        ))
      )}
      
      <Text style={styles.sectionTitle}>Test Results:</Text>
      {testUrls.map((test, index) => (
        <View key={index} style={styles.testResult}>
          <Text style={styles.testUrl}>{test.url}</Text>
          <Text style={[
            styles.testStatus, 
            test.status === 'OK' ? styles.success : styles.error
          ]}>
            {test.status}
          </Text>
          {test.status === 'OK' && (
            <Image 
              source={{ uri: test.url }} 
              style={styles.thumbnail} 
              resizeMode="contain"
            />
          )}
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  loading: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 16,
  },
  error: {
    fontSize: 16,
    color: 'red',
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  noFiles: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  file: {
    fontSize: 14,
    marginVertical: 4,
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  testResult: {
    marginVertical: 8,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  testUrl: {
    fontSize: 14,
    marginBottom: 4,
  },
  testStatus: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  success: {
    color: 'green',
  },
  thumbnail: {
    width: '100%',
    height: 150,
    marginTop: 8,
    backgroundColor: '#eee',
    borderRadius: 4,
  },
  customTestContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    paddingHorizontal: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginRight: 8,
    color: '#333',
  },
  testButton: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    padding: 10,
    minWidth: 80,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default DebugScreen; 
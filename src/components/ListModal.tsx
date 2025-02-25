import React, { useState } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { List } from '../types';

interface ListModalProps {
  visible: boolean;
  onClose: () => void;
  strainId: string;
  userLists: List[];
  onAddToList: (listId: string) => void;
  onRemoveFromList: (listId: string) => void;
  onCreateNewList: (title: string) => void;
}

export const ListModal = ({
  visible,
  onClose,
  strainId,
  userLists,
  onAddToList,
  onRemoveFromList,
  onCreateNewList
}: ListModalProps) => {
  const [newListTitle, setNewListTitle] = useState('');
  const [showNewListInput, setShowNewListInput] = useState(false);

  const handleCreateList = () => {
    if (newListTitle.trim()) {
      onCreateNewList(newListTitle.trim());
      setNewListTitle('');
      setShowNewListInput(false);
    }
  };

  const isStrainInList = (list: List) => {
    return list.strains.includes(strainId);
  };

  const renderListItem = ({ item }: { item: List }) => {
    const isInList = isStrainInList(item);
    
    return (
      <TouchableOpacity
        style={styles.listItem}
        onPress={() => isInList ? onRemoveFromList(item.id) : onAddToList(item.id)}
      >
        <Text style={styles.listTitle}>{item.title}</Text>
        <View style={styles.listActionContainer}>
          {isInList ? (
            <View style={styles.addedBadge}>
              <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
              <Text style={styles.addedText}>Added</Text>
            </View>
          ) : (
            <View style={styles.addButton}>
              <MaterialCommunityIcons name="plus" size={16} color="#10B981" />
              <Text style={styles.addText}>Add</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>My Lists</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {userLists.length > 0 ? (
            <FlatList
              data={userLists}
              renderItem={renderListItem}
              keyExtractor={(item) => item.id}
              style={styles.listContainer}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                You don't have any lists yet. Create your first list!
              </Text>
            </View>
          )}

          {showNewListInput ? (
            <View style={styles.newListContainer}>
              <TextInput
                style={styles.newListInput}
                placeholder="Enter list name"
                placeholderTextColor="#6B7280"
                value={newListTitle}
                onChangeText={setNewListTitle}
                autoFocus
              />
              <View style={styles.newListActions}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowNewListInput(false);
                    setNewListTitle('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.createButton,
                    !newListTitle.trim() && styles.disabledButton
                  ]}
                  onPress={handleCreateList}
                  disabled={!newListTitle.trim()}
                >
                  <Text style={styles.createButtonText}>Create</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.createListButton}
              onPress={() => setShowNewListInput(true)}
            >
              <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" />
              <Text style={styles.createListText}>Create New List</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#18181B',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 4,
  },
  listContainer: {
    maxHeight: 300,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
  },
  listTitle: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  listActionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  addedText: {
    color: '#FFFFFF',
    marginLeft: 4,
    fontSize: 14,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  addText: {
    color: '#10B981',
    marginLeft: 4,
    fontSize: 14,
  },
  createListButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    margin: 16,
    padding: 12,
    borderRadius: 8,
  },
  createListText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#6B7280',
    textAlign: 'center',
    fontSize: 16,
  },
  newListContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#27272A',
  },
  newListInput: {
    backgroundColor: '#27272A',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 12,
  },
  newListActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    padding: 8,
    marginRight: 12,
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
  },
  createButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#374151',
    opacity: 0.5,
  },
}); 
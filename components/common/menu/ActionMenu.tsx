import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { COLORS } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import Item from '@/database/models/ItemModel';

interface ActionMenuProps {
  item: Item;
  onClose: () => void;
}

const ActionMenu: React.FC<ActionMenuProps> = ({ item, onClose }) => {
  // Handle favorite toggle
  const handleFavoriteToggle = async () => {
    try {
      await item.toggleFavorite();
      onClose();
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  // Handle archive toggle
  const handleArchiveToggle = async () => {
    try {
      await item.toggleArchived();
      onClose();
    } catch (error) {
      console.error('Error toggling archive:', error);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      await item.markAsDeleted();
      onClose();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  // Handle share
  const handleShare = () => {
    // Implement share functionality
    onClose();
  };

  // Handle add tags
  const handleAddTag = () => {
    // Implement tag adding
    onClose();
  };

  return (
    <Modal transparent animationType="fade" visible={true} onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.menuContainer}>
              {/* Share */}
              <TouchableOpacity style={styles.menuItem} onPress={handleShare}>
                <Ionicons name="share-outline" size={24} color={COLORS.text} />
                <Text style={styles.menuText}>Share</Text>
              </TouchableOpacity>

              {/* Favorite */}
              <TouchableOpacity style={styles.menuItem} onPress={handleFavoriteToggle}>
                <Ionicons
                  name={item.favorite ? 'star' : 'star-outline'}
                  size={24}
                  color={item.favorite ? COLORS.favorite : COLORS.text}
                />
                <Text style={styles.menuText}>{item.favorite ? 'Unfavorite' : 'Favorite'}</Text>
              </TouchableOpacity>

              {/* Tag */}
              <TouchableOpacity style={styles.menuItem} onPress={handleAddTag}>
                <Ionicons name="pricetag-outline" size={24} color={COLORS.text} />
                <Text style={styles.menuText}>Tag</Text>
              </TouchableOpacity>

              {/* Archive */}
              <TouchableOpacity style={styles.menuItem} onPress={handleArchiveToggle}>
                <Ionicons name="archive-outline" size={24} color={COLORS.text} />
                <Text style={styles.menuText}>{item.archived ? 'Unarchive' : 'Archive'}</Text>
              </TouchableOpacity>

              {/* Delete - red text */}
              <TouchableOpacity style={styles.menuItem} onPress={handleDelete}>
                <Ionicons name="trash-outline" size={24} color={COLORS.error.main} />
                <Text style={[styles.menuText, { color: COLORS.error.main }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    width: '80%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuText: {
    fontSize: 16,
    marginLeft: 16,
    color: COLORS.text,
  },
});

export default ActionMenu;

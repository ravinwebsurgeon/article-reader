import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  TouchableWithoutFeedback 
} from 'react-native';
import { COLORS } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { 
  useToggleFavoriteMutation,
  useToggleArchiveMutation,
  useDeleteItemMutation
} from '@/redux/services/itemsApi';
import { Item } from '@/types/item';

useToggleFavoriteMutation

interface ActionMenuProps {
  itemId: number;
  onClose: () => void;
  items?: Item[];
}

const ActionMenu: React.FC<ActionMenuProps> = ({ itemId, onClose, items }) => {
  // Find the current item
  const currentItem = items?.find(item => item.id === itemId);
  
  // API mutations
  const [toggleFavorite] = useToggleFavoriteMutation();
  const [toggleArchive] = useToggleArchiveMutation();
  const [deleteItem] = useDeleteItemMutation();

  // Handle favorite toggle
  const handleFavoriteToggle = async () => {
    if (currentItem) {
      await toggleFavorite({ 
        id: itemId, 
        favorite: !currentItem.favorite 
      });
      onClose();
    }
  };

  // Handle archive toggle
  const handleArchiveToggle = async () => {
    if (currentItem) {
      await toggleArchive({ 
        id: itemId, 
        archived: !currentItem.archived 
      });
      onClose();
    }
  };

  // Handle delete
  const handleDelete = async () => {
    await deleteItem(itemId);
    onClose();
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
    <Modal
      transparent
      animationType="fade"
      visible={true}
      onRequestClose={onClose}
    >
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
                  name={currentItem?.favorite ? "star" : "star-outline"} 
                  size={24} 
                  color={currentItem?.favorite ? COLORS.favorite : COLORS.text} 
                />
                <Text style={styles.menuText}>
                  {currentItem?.favorite ? "Unfavorite" : "Favorite"}
                </Text>
              </TouchableOpacity>
              
              {/* Tag */}
              <TouchableOpacity style={styles.menuItem} onPress={handleAddTag}>
                <Ionicons name="pricetag-outline" size={24} color={COLORS.text} />
                <Text style={styles.menuText}>Tag</Text>
              </TouchableOpacity>
              
              {/* Archive */}
              <TouchableOpacity style={styles.menuItem} onPress={handleArchiveToggle}>
                <Ionicons name="archive-outline" size={24} color={COLORS.text} />
                <Text style={styles.menuText}>
                  {currentItem?.archived ? "Unarchive" : "Archive"}
                </Text>
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
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { useTheme, type Theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import Item from '@/database/models/ItemModel';
import { ThemeText, ThemeView } from '@/components/core';
import { scaler } from '@/utils';
import { SvgIcon } from '@/components/SvgIcon';

interface ActionMenuProps {
  item: Item;
  onClose: () => void;
}

const ActionMenu: React.FC<ActionMenuProps> = ({ item, onClose }) => {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

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
        <ThemeView style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <ThemeView style={styles.menuContainer}>
              {/* Share */}
              <TouchableOpacity style={styles.menuItem} onPress={handleShare}>
                <ThemeText style={styles.menuText}>Share</ThemeText>
                <SvgIcon name="share" size={28} color={theme.colors.text.primary} />
              </TouchableOpacity>

              {/* Favorite */}
              <TouchableOpacity style={styles.menuItem} onPress={handleFavoriteToggle}>
                <ThemeText style={styles.menuText}>
                  {item.favorite ? 'Unfavorite' : 'Favorite'}
                </ThemeText>
                <SvgIcon
                  name={item.favorite ? 'favorite' : 'favorite'}
                  size={28}
                  color={item.favorite ? theme.colors.favorite : theme.colors.text.primary}
                />
              </TouchableOpacity>

              {/* Tag */}
              <TouchableOpacity style={styles.menuItem} onPress={handleAddTag}>
                <ThemeText style={styles.menuText}>Tag</ThemeText>
                <SvgIcon name="tag" size={28} color={theme.colors.text.primary} />
              </TouchableOpacity>

              {/* Archive */}
              <TouchableOpacity style={styles.menuItem} onPress={handleArchiveToggle}>
                <ThemeText style={styles.menuText}>
                  {item.archived ? 'Unarchive' : 'Archive'}
                </ThemeText>
                <SvgIcon name="archive" size={28} color={theme.colors.text.primary} />
              </TouchableOpacity>

              {/* Delete - red text */}
              <TouchableOpacity style={styles.menuItem} onPress={handleDelete}>
                <ThemeText style={[styles.menuText, { color: theme.colors.error.main }]}>
                  Delete
                </ThemeText>
                <SvgIcon name="trash" size={28} color={theme.colors.error.main} />
              </TouchableOpacity>
            </ThemeView>
          </TouchableWithoutFeedback>
        </ThemeView>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.backdrop,
    },
    menuContainer: {
      width: '80%',
      borderRadius: scaler(12),
      padding: scaler(8),
      backgroundColor: theme.colors.background.paper,
      ...theme.shadows[3],
    },
    menuItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: scaler(16),
    },
    menuText: {
      fontSize: scaler(16),
      color: theme.colors.text.primary,
    },
  });

export default ActionMenu;

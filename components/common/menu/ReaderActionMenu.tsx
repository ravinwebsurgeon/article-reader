import React, { useCallback } from 'react';
import Item from '@/database/models/ItemModel';
import ReusableActionMenu, { ActionMenuItem, ActionMenuPosition } from './ReusableActionMenu';
import { Linking } from 'react-native';

interface ReaderActionMenuProps {
  item: Item;
  position?: ActionMenuPosition;
  visible?: boolean;
  onClose: () => void;
}

/**
 * Reader-specific implementation of the ActionMenu
 * This component uses the ReusableActionMenu with pre-configured options for reader actions
 */
const ReaderActionMenu: React.FC<ReaderActionMenuProps> = ({
  item,
  position = {},
  visible = false,
  onClose,
}) => {
  // Handle edit tags
  const handleEditTags = useCallback(() => {
    // Implement edit tags functionality
    console.log('Edit tags for item:', item.id);
    onClose();
  }, [item, onClose]);

  // Handle open in browser
  const handleOpenInBrowser = useCallback(async () => {
    if (item.url) {
      try {
        const canOpen = await Linking.canOpenURL(item.url);
        if (canOpen) {
          await Linking.openURL(item.url);
        } else {
          console.error('Cannot open URL:', item.url);
        }
      } catch (error) {
        console.error('Error opening URL:', error);
      }
    }
    onClose();
  }, [item.url, onClose]);

  // Generate menu items based on the item state
  const getMenuItems = useCallback((): ActionMenuItem[] => {
    return [
      {
        id: 'share',
        label: 'Share',
        icon: 'share',
        onPress: () => {
          // Implement share functionality
          console.log('Share item:', item.id);
        },
        dividerAfter: true,
      },
      {
        id: 'favorite',
        label: item.favorite ? 'Unfavorite' : 'Favorite',
        icon: item.favorite ? 'favorite' : 'favorite',
        iconColor: item.favorite ? '#F8E61B' : undefined, // Yellow for favorited items
        onPress: async () => {
          try {
            await item.toggleFavorite();
          } catch (error) {
            console.error('Error toggling favorite:', error);
          }
        },
        dividerAfter: true,
      },
      {
        id: 'edit-tags',
        label: 'Edit Tags',
        icon: 'tag',
        onPress: handleEditTags,
        dividerAfter: true,
      },
      {
        id: 'open-browser',
        label: 'Open in Browser',
        icon: 'compass',
        onPress: handleOpenInBrowser,
        dividerAfter: true,
      },
      {
        id: 'archive',
        label: item.archived ? 'Unarchive' : 'Archive',
        icon: 'archive',
        onPress: async () => {
          try {
            await item.toggleArchived();
          } catch (error) {
            console.error('Error toggling archive:', error);
          }
        },
        dividerAfter: true,
      },
      {
        id: 'delete',
        label: 'Delete',
        icon: 'trash',
        destructive: true,
        onPress: async () => {
          try {
            await item.markAsDeleted();
          } catch (error) {
            console.error('Error deleting item:', error);
          }
        },
      },
    ];
  }, [item, handleEditTags, handleOpenInBrowser]);

  return (
    <ReusableActionMenu
      visible={visible}
      items={getMenuItems()}
      onClose={onClose}
      position={position}
      width={240}
    />
  );
};

export default ReaderActionMenu;
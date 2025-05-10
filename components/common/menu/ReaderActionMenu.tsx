import React, { useCallback, useState } from 'react';
import Item from '@/database/models/ItemModel';
import ReusableActionMenu, { ActionMenuItem, ActionMenuPosition } from './ReusableActionMenu';
import { Linking } from 'react-native';
import TagEditor from '@/screens/EditTag';
import { useTheme } from '@/theme';

interface ReaderActionMenuProps {
  item: Item;
  position?: ActionMenuPosition;
  visible?: boolean;
  onClose: () => void;
  animationDuration?: number;
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
  animationDuration,
}) => {
  const theme = useTheme();
  const [tagEditorVisible, setTagEditorVisible] = useState(false);

  // Open tag editor
  const openTagEditor = useCallback(() => {
    // Close action menu first
    onClose();
    // Then open tag editor
    setTimeout(() => {
      setTagEditorVisible(true);
    }, 300); // Small delay for better UX
  }, [onClose]);

  // Close tag editor
  const closeTagEditor = useCallback(() => {
    setTagEditorVisible(false);
  }, []);

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
        iconColor: item.favorite ? theme.colors.favorite : undefined,
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
        onPress: openTagEditor,
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
  }, [item, openTagEditor, handleOpenInBrowser, theme.colors.favorite]);

  return (
    <>
      <ReusableActionMenu
        visible={visible}
        items={getMenuItems()}
        onClose={onClose}
        position={position}
        width={240}
        animationDuration={animationDuration}
      />
      {tagEditorVisible && (
        <TagEditor visible={tagEditorVisible} onClose={closeTagEditor} item={item} />
      )}
    </>
  );
};

export default ReaderActionMenu;

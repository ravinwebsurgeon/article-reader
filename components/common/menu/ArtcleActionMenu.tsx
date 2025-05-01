import React, { useCallback } from 'react';
import Item from '@/database/models/ItemModel';
import ReusableActionMenu, { ActionMenuItem, ActionMenuPosition } from './ReusableActionMenu';
import { useActionMenu } from '@/utils/hooks';


interface ArticleActionMenuProps {
  item: Item;
  position?: ActionMenuPosition;
  visible?: boolean;
  onClose: () => void;
}

/**
 * Article-specific implementation of the ActionMenu
 * This component uses the ReusableActionMenu with pre-configured options for article actions
 */
const ArticleActionMenu: React.FC<ArticleActionMenuProps> = ({
  item,
  position = {},
  visible = false,
  onClose,
}) => {
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
        id: 'tag',
        label: 'Tag',
        icon: 'tag',
        onPress: () => {
          // Implement tag functionality
          console.log('Tag item:', item.id);
        },
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
  }, [item]);

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

export default ArticleActionMenu;
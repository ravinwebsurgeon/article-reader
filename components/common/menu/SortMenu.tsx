import React from 'react';
import ReusableActionMenu, { ActionMenuItem, ActionMenuPosition } from './ReusableActionMenu';
 
export type SortOption = 'newest' | 'oldest' | 'shortest' | 'longest' | 'alphabetical';
 
interface SortMenuProps {
  visible: boolean;
  position: ActionMenuPosition;
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
  onClose: () => void;
}
 
/**
* Sort menu for the HomeScreen filter tabs
* Uses the ReusableActionMenu with sort-specific options
*/
const SortMenu: React.FC<SortMenuProps> = ({
  visible,
  position,
  currentSort,
  onSortChange,
  onClose,
}) => {
  // Generate menu items based on current sort
  const getSortItems = (): ActionMenuItem[] => {
    return [
      {
        id: 'newest',
        label: 'Newest First',
        icon: 'sort-newest',
        selected: currentSort === 'newest',
        onPress: () => onSortChange('newest'),
      },
      {
        id: 'oldest',
        label: 'Oldest First',
        icon: 'sort-oldest',
        selected: currentSort === 'oldest',
        onPress: () => onSortChange('oldest'),
        dividerAfter: true,
      },
      {
        id: 'shortest',
        label: 'Shortest Reads',
        icon: 'sort-short',
        selected: currentSort === 'shortest',
        onPress: () => onSortChange('shortest'),
      },
      {
        id: 'longest',
        label: 'Longest Reads',
        icon: 'sort-long',
        selected: currentSort === 'longest',
        onPress: () => onSortChange('longest'),
        dividerAfter: true,
      },
      {
        id: 'alphabetical',
        label: 'Alphabetical',
        icon: 'sort-alpha',
        selected: currentSort === 'alphabetical',
        onPress: () => onSortChange('alphabetical'),
      },
    ];
  };
 
  return (
    <ReusableActionMenu
      visible={visible}
      items={getSortItems()}
      onClose={onClose}
      position={position}
      title="Sort By"
      width={240}
    />
  );
};
 
export default SortMenu;
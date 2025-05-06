import { useState, useEffect, useRef } from 'react';
import { Keyboard, AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useCallback } from 'react';
import { View } from 'react-native';
import { ActionMenuItem, ActionMenuPosition } from '@/components/common/menu/ReusableActionMenu';
import { Q } from '@nozbe/watermelondb';
import Tag from '@/database/models/TagModel';
import Item from '@/database/models/ItemModel';
import ItemTag from '@/database/models/ItemTagModel'; 
import database from '@/database/database';

/**
* Custom hook for keyboard visibility
*/
export const useKeyboard = () => {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
 
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardVisible(true);
      setKeyboardHeight(e.endCoordinates.height);
    });
 
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
      setKeyboardHeight(0);
    });
 
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);
 
  return { isKeyboardVisible, keyboardHeight };
};
 
/**
* Custom hook for debouncing a value
*/
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
 
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
 
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
 
  return debouncedValue;
};
 
/**
* Custom hook for network status
*/
export const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
 
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
    });
 
    return () => {
      unsubscribe();
    };
  }, []);
 
  return { isConnected };
};
 
/**
* Custom hook for app state (foreground, background)
*/
export const useAppState = () => {
  const appState = useRef(AppState.currentState);
  const [appStateVisible, setAppStateVisible] = useState(appState.current);
 
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      appState.current = nextAppState;
      setAppStateVisible(appState.current);
    });
 
    return () => {
      subscription.remove();
    };
  }, []);
 
  return appStateVisible;
};
 
 
 
/**
* Hook for managing action menu state and positioning
*/
export const useActionMenu = () => {
  // Visibility state
  const [isVisible, setIsVisible] = useState(false);
  
  // Menu items
  const [menuItems, setMenuItems] = useState<ActionMenuItem[]>([]);
  
  // Position configuration
  const [position, setPosition] = useState<ActionMenuPosition>({});
  
  // Optional title
  const [title, setTitle] = useState<string | undefined>();
  
  // Reference to target element that triggers the menu
  const targetRef = useRef<View | null>(null);
 
  // Custom width for menu
  const [width, setWidth] = useState<number | string>(240);
 
  // Show the menu at a specific position
  const showMenu = useCallback((
    items: ActionMenuItem[],
    menuPosition?: ActionMenuPosition,
    menuTitle?: string,
    menuWidth?: number | string
  ) => {
    setMenuItems(items);
    
    if (menuPosition) {
      setPosition(menuPosition);
    }
    
    if (menuTitle) {
      setTitle(menuTitle);
    }
    
    if (menuWidth) {
      setWidth(menuWidth);
    }
    
    setIsVisible(true);
  }, []);
 
  // Show menu at current pointer position (e.g., from touchable event)
  const showMenuAtPosition = useCallback((
    items: ActionMenuItem[],
    x: number,
    y: number,
    menuTitle?: string,
    align?: 'start' | 'center' | 'end',
    menuWidth?: number | string
  ) => {
    showMenu(items, { x, y, align }, menuTitle, menuWidth);
  }, [showMenu]);
 
  // Show menu at the position of the ref element
  const showMenuFromRef = useCallback(
    (
      items: ActionMenuItem[],
      menuTitle?: string,
      position?: 'top' | 'bottom' | 'left' | 'right' | 'center',
      align?: 'start' | 'center' | 'end',
      menuWidth?: number | string
    ) => {
      if (!targetRef.current) {
        console.warn('No target ref provided to useActionMenu');
        return;
      }
 
      targetRef.current.measure((x, y, width, height, pageX, pageY) => {
        showMenu(
          items,
          {
            x: pageX,
            y: pageY,
            width,
            height,
            position,
            align,
          },
          menuTitle,
          menuWidth
        );
      });
    },
    [showMenu, targetRef]
  );
 
  // Hide the menu
  const hideMenu = useCallback(() => {
    setIsVisible(false);
  }, []);
 
  // Helper for showing menu from a button or any element with position data
  const showMenuFromEvent = useCallback((
    event: any,
    items: ActionMenuItem[],
    menuTitle?: string,
    position?: 'top' | 'bottom' | 'left' | 'right' | 'center',
    align?: 'start' | 'center' | 'end',
    menuWidth?: number | string
  ) => {
    const { pageX, pageY } = event.nativeEvent;
    
    // For elements like buttons that have position data in nativeEvent.layout
    let width = 0;
    let height = 0;
    
    if (event.nativeEvent.layout) {
      width = event.nativeEvent.layout.width;
      height = event.nativeEvent.layout.height;
    }
    
    showMenu(
      items,
      {
        x: pageX,
        y: pageY,
        width,
        height,
        position,
        align,
      },
      menuTitle,
      menuWidth
    );
  }, [showMenu]);
 
  return {
    isVisible,
    menuItems,
    position,
    title,
    width,
    targetRef,
    showMenu,
    showMenuAtPosition,
    showMenuFromRef,
    showMenuFromEvent,
    hideMenu,
  };
};



/**
 * Custom hook for managing tags and item-tag associations
 * 
 * This hook provides a clean, reusable interface for common tag operations:
 * - Loading tags
 * - Filtering tags
 * - Adding/removing tags to/from items
 * - Creating new tags
 */
export const useTagManagement = (item?: Item) => {
  // State for tags
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [recentTags, setRecentTags] = useState<Tag[]>([]);
  const [otherTags, setOtherTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Database collections
  const tagsCollection = database.collections.get<Tag>('tags');
  const itemTagsCollection = database.collections.get<ItemTag>('item_tags');

  // Load all tags from the database
  const loadAllTags = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Fetch all tags ordered by most recently used
      const tags = await tagsCollection.query().fetch();

      console.log('does here any tags', tags);
      
      // Sort by recently used (this would ideally use a real recency metric)
      // In a real app, you might track usage timestamps or have a dedicated recent_tags table
      const sortedTags = [...tags].sort((a, b) => {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
      
      setAllTags(sortedTags);
      
      // Split into recent and other tags
      // Recent tags are the 5 most recently used
      const recent = sortedTags.slice(0, Math.min(5, sortedTags.length));
      const others = sortedTags.slice(Math.min(5, sortedTags.length));
      
      setRecentTags(recent);
      setOtherTags(others);
      
      return sortedTags;
    } catch (error) {
      console.error('Error loading tags:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [tagsCollection]);

  // Load item's current tags
  const loadItemTags = useCallback(async () => {
    if (!item) return;
    
    try {
      // Fetch all item_tag associations for this item
      const itemTags = await item.itemTags.fetch();
      
      // Extract tag IDs and update selected tags set
      const tagIds = new Set(itemTags.map(itemTag => itemTag.tag.id));
      setSelectedTagIds(tagIds);
      
      return tagIds;
    } catch (error) {
      console.error('Error loading item tags:', error);
      return new Set<string>();
    }
  }, [item]);

  // Load all data: tags and item's tags
  const loadData = useCallback(async () => {
    await loadAllTags();
    if (item) {
      await loadItemTags();
    }
  }, [loadAllTags, loadItemTags, item]);

  // Initialize on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Toggle a tag on an item
  const toggleTag = useCallback(async (tag: Tag) => {
    if (!item) return;

    try {
      // Prepare new local state for immediate UI feedback
      const newSelectedTagIds = new Set(selectedTagIds);
      
      if (newSelectedTagIds.has(tag.id)) {
        // Remove the tag
        newSelectedTagIds.delete(tag.id);
        await item.removeTag(tag);
      } else {
        // Add the tag
        newSelectedTagIds.add(tag.id);
        await item.addTag(tag);
      }
      
      // Update local state
      setSelectedTagIds(newSelectedTagIds);
      
      return true;
    } catch (error) {
      console.error('Error toggling tag:', error);
      return false;
    }
  }, [selectedTagIds, item]);

  // Create a new tag and optionally associate it with the item
  const createTag = useCallback(async (tagName: string, associateWithItem: boolean = true) => {
    if (!tagName.trim()) return null;

    try {
      // Check if tag already exists (case-insensitive)
      const existingTag = allTags.find(
        tag => tag.name.toLowerCase() === tagName.trim().toLowerCase()
      );
      
      // If tag exists
      if (existingTag) {
        // If item provided and association requested, toggle the tag
        if (item && associateWithItem && !selectedTagIds.has(existingTag.id)) {
          await toggleTag(existingTag);
        }
        
        return existingTag;
      }
      
      // Create new tag
      let newTag: Tag | null = null;
      
      await database.write(async () => {
        // Create tag
        newTag = await tagsCollection.create(tag => {
          tag.name = tagName.trim();
        });
        
        // Associate with item if requested
        if (item && associateWithItem) {
          await item.addTag(newTag!);
          
          // Update selected tags
          setSelectedTagIds(prev => new Set(prev).add(newTag!.id));
        }
      });
      
      // Update tags lists
      if (newTag) {
        setAllTags(prev => [newTag!, ...prev]);
        setRecentTags(prev => [newTag!, ...prev].slice(0, 5));
      }
      
      return newTag;
    } catch (error) {
      console.error('Error creating tag:', error);
      return null;
    }
  }, [allTags, selectedTagIds, toggleTag, tagsCollection, item]);

  // Search for tags matching a query
  const searchTags = useCallback((query: string) => {
    if (!query.trim()) return [];
    
    const searchTerm = query.trim().toLowerCase();
    return allTags.filter(tag => 
      tag.name.toLowerCase().includes(searchTerm)
    );
  }, [allTags]);

  // Get tags for an item
  const getItemTags = useCallback(async (itemToQuery: Item) => {
    try {
      const itemTags = await itemToQuery.itemTags.fetch();
      return await Promise.all(itemTags.map(async (itemTag) => {
        return await itemTag.tag.fetch();
      }));
    } catch (error) {
      console.error('Error getting item tags:', error);
      return [];
    }
  }, []);

  return {
    // State
    allTags,
    recentTags,
    otherTags,
    selectedTagIds,
    isLoading,
    
    // Actions
    loadData,
    loadAllTags,
    loadItemTags,
    toggleTag,
    createTag,
    searchTags,
    getItemTags,
  };
};
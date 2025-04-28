import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, ScrollView, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/theme';
import { ItemFilter } from '@/types/item';
import { scaler } from '@/utils';
import Svg, { Path } from 'react-native-svg';

interface FilterTabsProps {
  currentFilter: ItemFilter;
  onFilterChange: (filter: ItemFilter) => void;
  isDarkMode: boolean;
}

interface FilterOption {
  id: ItemFilter;
  icon: string;
}

const filterOptions = [
  {
    id: 'sorting',
    label: '',
    icon: (color) => (
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Path
          d="M18 3.75C18 3.33579 17.6642 3 17.25 3C16.8358 3 16.5 3.33579 16.5 3.75L16.5 18.4393L13.7803 15.7197C13.4874 15.4268 13.0126 15.4268 12.7197 15.7197C12.4268 16.0126 12.4268 16.4874 12.7197 16.7803L16.7197 20.7803C16.8603 20.921 17.0511 21 17.25 21C17.4489 21 17.6397 20.921 17.7803 20.7803L21.7803 16.7803C22.0732 16.4874 22.0732 16.0126 21.7803 15.7197C21.4874 15.4268 21.0126 15.4268 20.7197 15.7197L18 18.4393V3.75Z"
          fill={color}
          fillOpacity="0.84"
        />
        <Path
          d="M2 6.75C2 6.33579 2.33579 6 2.75 6H10.25C10.6642 6 11 6.33579 11 6.75C11 7.16421 10.6642 7.5 10.25 7.5H2.75C2.33579 7.5 2 7.16421 2 6.75Z"
          fill={color}
          fillOpacity="0.84"
        />
        <Path
          d="M2 11.75C2 11.3358 2.33579 11 2.75 11H8.25C8.66421 11 9 11.3358 9 11.75C9 12.1642 8.66421 12.5 8.25 12.5H2.75C2.33579 12.5 2 12.1642 2 11.75Z"
          fill={color}
          fillOpacity="0.84"
        />
        <Path
          d="M2.75 16C2.33579 16 2 16.3358 2 16.75C2 17.1642 2.33579 17.5 2.75 17.5H6.25C6.66421 17.5 7 17.1642 7 16.75C7 16.3358 6.66421 16 6.25 16H2.75Z"
          fill={color}
          fillOpacity="0.84"
        />
      </Svg>
    ),
  },
  {
    id: 'all',
    label: 'All',
  },
  {
    id: 'favorites',
    label: 'Favorites',
    icon: (color) => (
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M9.94148 3.28365C10.7881 1.58481 13.2119 1.58482 14.0586 3.28365L15.6977 6.57275C15.8148 6.80778 16.0398 6.97036 16.2997 7.00777L19.9399 7.5316C21.8334 7.80407 22.586 10.1343 21.2097 11.4629L18.5949 13.9871C18.4042 14.1712 18.317 14.4379 18.3623 14.6991L18.9822 18.2784C19.3071 20.1543 17.3424 21.5901 15.6538 20.711L12.3695 19.001C12.1379 18.8804 11.8621 18.8804 11.6306 19.001L8.34627 20.711C6.65763 21.5901 4.69297 20.1543 5.01785 18.2784L5.63774 14.6991C5.68299 14.4379 5.59585 14.1712 5.4051 13.9871L2.79032 11.4629C1.41401 10.1343 2.16668 7.80407 4.06013 7.5316L7.7003 7.00777C7.96022 6.97036 8.18523 6.80778 8.30236 6.57275L9.94148 3.28365ZM12.716 3.9527C12.4216 3.3618 11.5785 3.3618 11.284 3.9527L9.64489 7.24179C9.30815 7.91751 8.66123 8.38494 7.91395 8.49247L4.27378 9.01631C3.61519 9.11108 3.35339 9.9216 3.83211 10.3837L6.44688 12.9079C6.99532 13.4373 7.24582 14.204 7.11574 14.9551L6.49585 18.5344C6.38285 19.1869 7.06621 19.6863 7.65356 19.3805L10.9379 17.6705C11.6036 17.3239 12.3965 17.3239 13.0622 17.6705L16.3465 19.3805C16.9338 19.6863 17.6172 19.1869 17.5042 18.5344L16.8843 14.9551C16.7542 14.204 17.0047 13.4373 17.5532 12.9079L20.1679 10.3837C20.6466 9.9216 20.3848 9.11108 19.7263 9.01631L16.0861 8.49247C15.3388 8.38494 14.6919 7.91751 14.3551 7.24179L12.716 3.9527Z"
          fill={color}
          fillOpacity="0.84"
        />
      </Svg>
    ),
  },
  {
    id: 'tagged',
    label: 'Tagged',
    icon: (color) => (
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Path
          d="M15.9889 7.11095C15.7448 6.86688 15.3491 6.86688 15.105 7.11095C14.8609 7.35503 14.8609 7.75076 15.105 7.99484L15.9889 8.87872C16.233 9.1228 16.6287 9.1228 16.8728 8.87872C17.1169 8.63464 17.1169 8.23891 16.8728 7.99484L15.9889 7.11095Z"
          fill={color}
          fillOpacity="0.84"
        />
        <Path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M18.3326 3.98007C17.6875 3.3317 16.8105 2.96718 15.8959 2.96718L12.3504 2.96716C11.4386 2.96716 10.5642 3.3294 9.9195 3.97419L3.07546 10.8194C1.73323 12.1618 1.73332 14.3382 3.07567 15.6805L8.31786 20.9227C9.66102 22.2659 11.839 22.2651 13.1811 20.9209L20.0117 14.0798C20.6552 13.4353 21.0166 12.5617 21.0166 11.651V8.09635C21.0166 7.18764 20.6568 6.3159 20.0158 5.67174L18.3326 3.98007ZM15.8959 4.52968C16.3948 4.52968 16.8731 4.72851 17.225 5.08216L18.9082 6.77384C19.2578 7.1252 19.4541 7.60069 19.4541 8.09635V11.651C19.4541 12.1477 19.257 12.6242 18.906 12.9758L12.0754 19.8169C11.3433 20.5501 10.1553 20.5505 9.42272 19.8179L4.18052 14.5757C3.44833 13.8435 3.44828 12.6564 4.18041 11.9241L11.0244 5.07895C11.3761 4.72725 11.8531 4.52966 12.3504 4.52966L15.8959 4.52968Z"
          fill={color}
          fillOpacity="0.84"
        />
      </Svg>
    ),
  },
  {
    id: 'short',
    label: 'Short Reads',
    icon: (color) => (
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 3.5C10.0335 3.5 8.1278 4.18187 6.60767 5.42942C5.08753 6.67697 4.04699 8.41301 3.66334 10.3417C3.27969 12.2705 3.57668 14.2726 4.50369 16.0069C5.4307 17.7412 6.93038 19.1004 8.74721 19.853C10.564 20.6055 12.5856 20.7048 14.4674 20.134C16.3493 19.5631 17.975 18.3574 19.0675 16.7223C20.16 15.0872 20.6518 13.1239 20.4591 11.1669C20.2663 9.2098 19.401 7.38013 18.0104 5.98959C17.7175 5.6967 17.7175 5.22182 18.0104 4.92893C18.3033 4.63604 18.7782 4.63604 19.0711 4.92893C20.707 6.56486 21.7251 8.71741 21.9519 11.0198C22.1786 13.3222 21.6001 15.632 20.3147 17.5557C19.0294 19.4793 17.1168 20.8978 14.9029 21.5694C12.6889 22.241 10.3106 22.1242 8.17319 21.2388C6.03574 20.3534 4.27141 18.7543 3.18081 16.714C2.0902 14.6736 1.74081 12.3182 2.19216 10.0491C2.64351 7.78001 3.86768 5.73761 5.65607 4.2699C7.44447 2.8022 9.68645 2 12 2C12.4142 2 12.75 2.33579 12.75 2.75C12.75 3.16421 12.4142 3.5 12 3.5Z"
          fill={color}
          fillOpacity="0.84"
        />
        <Path
          d="M12 5C12.4142 5 12.75 5.33579 12.75 5.75V10.253L13.9834 9.08125C14.2837 8.79596 14.7585 8.80813 15.0437 9.10844C15.329 9.40874 15.3169 9.88346 15.0166 10.1687L12.5166 12.5437C12.2992 12.7503 11.9797 12.8075 11.7041 12.6892C11.4286 12.5709 11.25 12.2999 11.25 12V5.75C11.25 5.33579 11.5858 5 12 5Z"
          fill={color}
          fillOpacity="0.84"
        />
        <Path
          d="M14.5218 2.32092C14.1209 2.21674 13.7115 2.45728 13.6073 2.85818C13.5031 3.25908 13.7437 3.66853 14.1446 3.7727C14.1824 3.78255 14.2202 3.79264 14.2579 3.80299C14.6573 3.91274 15.07 3.67792 15.1798 3.27851C15.2895 2.8791 15.0547 2.46634 14.6553 2.3566C14.6109 2.34441 14.5664 2.33251 14.5218 2.32092Z"
          fill={color}
          fillOpacity="0.84"
        />
        <Path
          d="M16.9416 3.30449C16.5816 3.09953 16.1237 3.22517 15.9187 3.58512C15.7138 3.94507 15.8394 4.40302 16.1994 4.60798C16.2333 4.6273 16.2671 4.64685 16.3007 4.66663C16.6578 4.87653 17.1175 4.75722 17.3274 4.40013C17.5373 4.04305 17.418 3.58341 17.0609 3.3735C17.0213 3.35023 16.9815 3.32723 16.9416 3.30449Z"
          fill={color}
          fillOpacity="0.84"
        />
      </Svg>
    ),
  },
  {
    id: 'long',
    label: 'Long Reads',
    icon: (color) => (
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 3.5C10.6022 3.5 9.22591 3.84474 7.99313 4.50367C6.76035 5.1626 5.70911 6.1154 4.93251 7.27765C4.15592 8.43991 3.67794 9.77575 3.54093 11.1669C3.40392 12.558 3.6121 13.9614 4.14703 15.2528C4.68195 16.5442 5.52712 17.6838 6.60766 18.5706C7.6882 19.4574 8.97076 20.064 10.3417 20.3367C11.7127 20.6094 13.1298 20.5398 14.4674 20.134C15.8051 19.7282 17.022 18.9988 18.0104 18.0104C18.3033 17.7175 18.7782 17.7175 19.0711 18.0104C19.364 18.3033 19.364 18.7782 19.0711 19.0711C17.9082 20.2339 16.4765 21.092 14.9028 21.5694C13.3292 22.0468 11.662 22.1287 10.0491 21.8079C8.43619 21.487 6.92729 20.7734 5.65607 19.7301C4.38485 18.6868 3.39053 17.3462 2.76121 15.8268C2.13188 14.3075 1.88697 12.6564 2.04816 11.0198C2.20935 9.38324 2.77167 7.81166 3.68531 6.4443C4.59895 5.07694 5.83571 3.956 7.28604 3.18079C8.73636 2.40557 10.3555 2 12 2C12.4142 2 12.75 2.33579 12.75 2.75C12.75 3.16421 12.4142 3.5 12 3.5Z"
          fill={color}
          fillOpacity="0.84"
        />
        <Path
          d="M12 5C12.4142 5 12.75 5.33579 12.75 5.75V11.6893L15.0303 13.9697C15.3232 14.2626 15.3232 14.7374 15.0303 15.0303C14.7374 15.3232 14.2626 15.3232 13.9697 15.0303L11.4697 12.5303C11.329 12.3897 11.25 12.1989 11.25 12V5.75C11.25 5.33579 11.5858 5 12 5Z"
          fill={color}
          fillOpacity="0.84"
        />
        <Path
          d="M14.5218 2.32092C14.1209 2.21674 13.7115 2.45728 13.6073 2.85818C13.5031 3.25908 13.7437 3.66853 14.1446 3.7727C14.1824 3.78255 14.2202 3.79264 14.2579 3.80299C14.6573 3.91274 15.07 3.67792 15.1798 3.27851C15.2895 2.8791 15.0547 2.46634 14.6553 2.3566C14.6109 2.34441 14.5664 2.33251 14.5218 2.32092Z"
          fill={color}
          fillOpacity="0.84"
        />
        <Path
          d="M16.9416 3.30449C16.5816 3.09953 16.1237 3.22517 15.9187 3.58512C15.7138 3.94507 15.8394 4.40302 16.1994 4.60798C16.2333 4.6273 16.2671 4.64685 16.3007 4.66663C16.6578 4.87653 17.1175 4.75722 17.3274 4.40013C17.5373 4.04305 17.418 3.58341 17.0609 3.3735C17.0213 3.35023 16.9815 3.32723 16.9416 3.30449Z"
          fill={color}
          fillOpacity="0.84"
        />
        <Path
          d="M19.0222 4.88045C18.7273 4.58957 18.2525 4.59282 17.9616 4.88772C17.6707 5.18261 17.674 5.65747 17.9689 5.94835C17.9967 5.97579 18.0243 6.00341 18.0517 6.03122C18.3426 6.32611 18.8175 6.32936 19.1124 6.03848C19.4072 5.7476 19.4105 5.27274 19.1196 4.97785C19.0874 4.94516 19.0549 4.9127 19.0222 4.88045Z"
          fill={color}
          fillOpacity="0.84"
        />
        <Path
          d="M20.6266 6.9392C20.4167 6.58212 19.957 6.4628 19.5999 6.67271C19.2429 6.88262 19.1235 7.34226 19.3334 7.69935C19.3532 7.73299 19.3728 7.76678 19.3921 7.80071C19.5971 8.16066 20.055 8.2863 20.415 8.08134C20.7749 7.87638 20.9005 7.41842 20.6956 7.05848C20.6728 7.01854 20.6498 6.97879 20.6266 6.9392Z"
          fill={color}
          fillOpacity="0.84"
        />
        <Path
          d="M21.6435 9.34479C21.5337 8.94538 21.121 8.71056 20.7216 8.8203C20.3222 8.93005 20.0873 9.3428 20.1971 9.74221C20.2074 9.77987 20.2175 9.81764 20.2274 9.85551C20.3315 10.2564 20.741 10.497 21.1419 10.3928C21.5428 10.2886 21.7833 9.87915 21.6792 9.47825C21.6676 9.43364 21.6557 9.38915 21.6435 9.34479Z"
          fill={color}
          fillOpacity="0.84"
        />
        <Path
          d="M21.9998 11.9309C21.997 11.5167 21.6589 11.1832 21.2447 11.186C20.8305 11.1888 20.497 11.5269 20.4998 11.9411L20.4999 11.9635L20.5 12.0001L20.4998 12.059C20.497 12.4732 20.8305 12.8113 21.2447 12.8141C21.6589 12.8169 21.997 12.4834 21.9998 12.0692L21.9999 12.0383L22 12.0001L21.9998 11.9309Z"
          fill={color}
          fillOpacity="0.84"
        />
        <Path
          d="M21.6792 14.5219C21.7833 14.121 21.5428 13.7115 21.1419 13.6073C20.741 13.5032 20.3315 13.7437 20.2274 14.1446C20.2175 14.1825 20.2074 14.2202 20.1971 14.2579C20.0873 14.6573 20.3222 15.0701 20.7216 15.1798C21.121 15.2895 21.5337 15.0547 21.6435 14.6553C21.6557 14.611 21.6676 14.5665 21.6792 14.5219Z"
          fill={color}
          fillOpacity="0.84"
        />
        <Path
          d="M20.6956 16.9416C20.9005 16.5817 20.7749 16.1237 20.415 15.9188C20.055 15.7138 19.5971 15.8394 19.3921 16.1994C19.3728 16.2333 19.3532 16.2671 19.3334 16.3008C19.1235 16.6578 19.2429 17.1175 19.5999 17.3274C19.957 17.5373 20.4167 17.418 20.6266 17.0609C20.6498 17.0213 20.6728 16.9816 20.6956 16.9416Z"
          fill={color}
          fillOpacity="0.84"
        />
      </Svg>
    ),
  },
  {
    id: 'archived',
    label: 'Archived',
    icon: (color) => (
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Path
          d="M9.99994 10.5C9.58573 10.5 9.24994 10.8358 9.24994 11.25C9.24994 11.6642 9.58573 12 9.99994 12H13.9999C14.4141 12 14.7499 11.6642 14.7499 11.25C14.7499 10.8358 14.4141 10.5 13.9999 10.5H9.99994Z"
          fill={color}
          fillOpacity="0.84"
        />
        <Path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M2 4.75098C2 3.78396 2.78431 3.00025 3.75132 3.00098L20.2513 3.01341C21.2173 3.01414 22 3.79743 22 4.76341V6.75022C22 7.44832 21.5912 8.05095 21 8.33181V16C21 18.7614 18.7614 21 16 21H8C5.23857 21 3 18.7614 3 16V8.33181C2.40876 8.05095 2 7.44832 2 6.75022V4.75098ZM4.5 8.50022H19.5V16C19.5 17.933 17.933 19.5 16 19.5H8C6.067 19.5 4.5 17.933 4.5 16V8.50022ZM3.75019 4.50098C3.61204 4.50087 3.5 4.61283 3.5 4.75098V6.75022C3.5 6.88829 3.61193 7.00022 3.75 7.00022H20.25C20.3881 7.00022 20.5 6.88829 20.5 6.75022V4.76341C20.5 4.62541 20.3882 4.51352 20.2502 4.51341L3.75019 4.50098Z"
          fill={color}
          fillOpacity="0.84"
        />
      </Svg>
    ),
  },
];

// Mapping object to store positions of each filter tab
const tabPositions = {};

const FilterTabs: React.FC<FilterTabsProps> = ({ currentFilter, onFilterChange, isDarkMode }) => {
   // Create ref for the ScrollView
   const scrollViewRef = useRef(null);
   // Ref to track tab measurements
   const tabRefs = useRef({});
   
   // Get the current selected tab ref
   useEffect(() => {
     // If we have the current filter's position, scroll to it
     if (scrollViewRef.current && tabPositions[currentFilter]) {
       // Small delay to ensure the transition is smooth
       const timeout = setTimeout(() => {
         scrollViewRef.current.scrollTo({
           x: tabPositions[currentFilter],
           animated: true,
         });
       }, 100);
       return () => clearTimeout(timeout);
     }
   }, [currentFilter]);

   const handleTabPress = (filterId) => {
    // Apply the filter change using callback from props
    onFilterChange(filterId);
  };

  const measureTab = (event, filterId) => {
    if (event.nativeEvent) {
      // Store the x position of the tab
      tabPositions[filterId] = event.nativeEvent.layout.x;
    }
  };

  const getIconColor = (filterId: string) => {
    return currentFilter === filterId ? COLORS.white : isDarkMode ? COLORS.white : COLORS.black;
  };

  const getTextColor = (filterId: string) => {
    return currentFilter === filterId
      ? COLORS.white
      : isDarkMode
        ? COLORS.lightGray
        : COLORS.darkGray;
  };

  const getTabBackgroundColor = (filterId: string) => {
    if (currentFilter === filterId) {
      return filterId === 'all'
        ? COLORS.primary.main
        : isDarkMode
          ? COLORS.darkGray
          : COLORS.lightGray;
    }
    return isDarkMode ? COLORS.darkGray : COLORS.lightGray;
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContainer}
      style={[
        styles.container,
        { borderBottomColor: isDarkMode ? COLORS.darkBorder : COLORS.tasksConBorder },
      ]}
       // Use this to prevent gesture handling issues
       keyboardShouldPersistTaps="handled"
       // Disable scroll indicator
       scrollIndicatorInsets={{ right: 1 }}
       // Maintain smooth scroll animation
       scrollEventThrottle={16}
       // Improve performance by disabling dynamic content height changes
       removeClippedSubviews={true}
    >
      {filterOptions.map((option) => (
        <TouchableOpacity
          key={option.id}
          ref={ref => tabRefs.current[option.id] = ref}
          style={[
            styles.tab,
            !option.label && styles.iconOnlyTab,
            { backgroundColor: getTabBackgroundColor(option.id) },
            currentFilter === option.id && styles.activeTab,
          ]}
          // onPress={() => onFilterChange(option.id)}
          onPress={() => handleTabPress(option.id)}
          activeOpacity={0.7}
          onLayout={(event) => measureTab(event, option.id)}
        >
          {option.icon && (
            <View style={styles.iconContainer}>{option.icon(getIconColor(option.id))}</View>
          )}
          {option.label && (
            <Text style={[styles.tabText, { color: getTextColor(option.id) }]}>{option.label}</Text>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: scaler(1),
    borderBottomColor: COLORS.lightBorder,
  },
  scrollContainer: {
    paddingHorizontal: scaler(12),
    paddingVertical: scaler(12),
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaler(16),
    paddingVertical: scaler(10),
    marginHorizontal: scaler(4),
    borderRadius: scaler(20),
    backgroundColor: COLORS.lightGray,
    alignSelf: 'center',
    height: scaler(40),
  },
  activeTab: {
    backgroundColor: COLORS.primary.main,
  },
  inactiveTab: {
    backgroundColor: COLORS.lightGray,
  },
  darkTab: {
    backgroundColor: COLORS.darkGray,
  },
  icon: {
    marginRight: scaler(4),
  },
  tabText: {
    fontSize: scaler(14),
    fontWeight: '500',
    color: COLORS.text,
  },
  activeTabText: {
    color: COLORS.white,
  },
  iconContainer: {
    marginRight: scaler(6),
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconOnlyTab: {
    paddingHorizontal: scaler(10), // Less padding for icon-only tabs
    minWidth: scaler(40), // Fixed width for icon-only tabs
    justifyContent: 'center',
  },
});

export default React.memo(FilterTabs);

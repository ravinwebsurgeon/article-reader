import { useState, useCallback, useEffect } from "react";
import { ScrollView } from "react-native";
import Item from "@/database/models/ItemModel";

const RESTORE_SCROLL_INITIAL_DELAY = 300;
const RESTORE_SCROLL_RETRY_TIMEOUT = 100;

interface UseScrollProgressProps {
  item: Item;
  scrollViewRef: React.RefObject<ScrollView | null>;
  onUserScrolled?: () => void;
}

export const useScrollProgress = ({
  item,
  scrollViewRef,
  onUserScrolled,
}: UseScrollProgressProps) => {
  // State
  const [progress, setProgress] = useState(item.progress);
  const [isUserScrolled, setIsUserScrolled] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);
  const [shouldRestoreScroll, setShouldRestoreScroll] = useState(false);
  const [isContentLoaded, setIsContentLoaded] = useState(false);

  // Calculate scroll position from progress
  const getScrollPositionFromProgress = useCallback(
    (progressValue: number) => {
      if (!contentHeight || !scrollViewHeight) return 0;
      const maxScrollY = Math.max(0, contentHeight - scrollViewHeight);
      return progressValue * maxScrollY;
    },
    [contentHeight, scrollViewHeight],
  );

  // Calculate progress from scroll position
  const getProgressFromScrollPosition = useCallback(
    (scrollY: number) => {
      if (!contentHeight || !scrollViewHeight) return 0;
      const maxScrollY = Math.max(0, contentHeight - scrollViewHeight);
      if (maxScrollY === 0) return 0;
      return Math.min(1, Math.max(0, scrollY / maxScrollY));
    },
    [contentHeight, scrollViewHeight],
  );

  // Handle progress change from scroll tracking
  const handleProgressChange = useCallback(
    (newProgress: number) => {
      if (Math.abs(newProgress - (progress ?? 0)) > 0.01) {
        setProgress(newProgress);
      }
    },
    [progress],
  );

  // Handle user scrolled
  const handleUserScrolled = useCallback(() => {
    setIsUserScrolled(true);
    onUserScrolled?.();
  }, [onUserScrolled]);

  // Handle scroll position changes
  const handleScrollChange = useCallback(
    (event: any) => {
      const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
      const scrollY = Number(contentOffset.y);

      // Update content dimensions if they changed
      if (typeof contentSize.height === "number" && contentSize.height !== contentHeight) {
        setContentHeight(Number(contentSize.height));
      }
      if (layoutMeasurement.height !== scrollViewHeight) {
        setScrollViewHeight(Number(layoutMeasurement.height));
      }

      // Calculate and update progress
      const newProgress = getProgressFromScrollPosition(scrollY);
      handleProgressChange(newProgress);
      handleUserScrolled();
    },
    [
      contentHeight,
      scrollViewHeight,
      getProgressFromScrollPosition,
      handleProgressChange,
      handleUserScrolled,
    ],
  );

  // Handle content loaded - this is when we should restore scroll
  const handleContentLoaded = useCallback(() => {
    console.log(
      "Content loaded, should restore scroll:",
      shouldRestoreScroll,
      "progress:",
      item.progress,
    );
    setIsContentLoaded(true);

    // Restore scroll position based on saved progress
    if (shouldRestoreScroll && item.progress && item.progress > 0) {
      // Wait for content dimensions to be available
      const attemptRestore = () => {
        if (contentHeight > 0 && scrollViewHeight > 0 && scrollViewRef.current) {
          const scrollY = getScrollPositionFromProgress(item.progress || 0);
          console.log("Restoring scroll to:", scrollY, "from progress:", item.progress);

          if (scrollY > 0) {
            scrollViewRef.current.scrollTo({
              y: scrollY,
              animated: true,
            });
          }
          setShouldRestoreScroll(false);
        } else {
          // Try again in a bit if dimensions aren't ready
          setTimeout(attemptRestore, RESTORE_SCROLL_RETRY_TIMEOUT);
        }
      };

      // Start attempting restoration after a delay
      setTimeout(attemptRestore, RESTORE_SCROLL_INITIAL_DELAY);
    } else {
      setShouldRestoreScroll(false);
    }
  }, [
    shouldRestoreScroll,
    item.progress,
    getScrollPositionFromProgress,
    contentHeight,
    scrollViewHeight,
    scrollViewRef,
  ]);

  // Save progress to database
  const saveProgress = useCallback(async () => {
    try {
      if (
        isUserScrolled &&
        progress !== undefined &&
        Math.abs(progress - (item.progress || 0)) > 0.01
      ) {
        console.log("Saving progress:", progress);
        await item.setProgress(progress);
      }
    } catch (error) {
      console.error("Error saving progress:", error);
    }
  }, [isUserScrolled, progress, item]);

  // Better content size handling
  const handleContentSizeChange = useCallback((width: number, height: number) => {
    console.log("Content size changed:", height);
    setContentHeight(height);
  }, []);

  const handleLayoutChange = useCallback(
    (event: { nativeEvent: { layout: { height: number } } }) => {
      const { height } = event.nativeEvent.layout;
      console.log("ScrollView layout changed:", height);
      setScrollViewHeight(height);
    },
    [],
  );

  // Reset state when item changes
  useEffect(() => {
    setIsUserScrolled(false);
    setProgress(item.progress);
    setShouldRestoreScroll((item.progress || 0) > 0);
    setIsContentLoaded(false);
    setContentHeight(0);
    setScrollViewHeight(0);
  }, [item.id, item.progress]);

  return {
    // State
    progress,
    isUserScrolled,
    isContentLoaded,

    // Handlers
    handleScrollChange,
    handleContentLoaded,
    handleContentSizeChange,
    handleLayoutChange,
    saveProgress,

    // For compatibility with existing progress change handler
    handleProgressChange,
  };
};

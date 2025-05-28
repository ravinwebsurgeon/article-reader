// hooks/useAnnotations.ts - React Native version
import { useState, useEffect, useCallback } from "react";
import { withObservables } from "@nozbe/watermelondb/react";
import Item from "@/database/models/ItemModel";
import Annotation from "@/database/models/AnnotationModel";
import {
  handleTextHighlight,
  loadAnnotations,
  deleteAnnotation,
  updateAnnotationNote,
} from "./annotationHelpers";

interface SelectionData {
  selectedText: string;
  selectionStart: number;
  selectionEnd: number;
  fullText: string;
}

interface UseAnnotationsOptions {
  item: Item;
}

interface UseAnnotationsReturn {
  annotations: Annotation[];
  isLoading: boolean;
  saveHighlight: (selectionData: SelectionData) => Promise<Annotation | null>;
  deleteHighlight: (annotation: Annotation) => Promise<void>;
  updateNote: (annotation: Annotation, note: string) => Promise<void>;
  refreshAnnotations: () => Promise<void>;
}

// HOC for reactive annotations
export const withAnnotations = () => {
  return withObservables(["item"], ({ item }: { item: Item }) => ({
    annotations: item.annotations?.observe() ?? [],
  }));
};

// Custom hook for managing annotations in React Native
export const useAnnotations = ({ item }: UseAnnotationsOptions): UseAnnotationsReturn => {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load annotations on mount and when item changes
  const refreshAnnotations = useCallback(async () => {
    setIsLoading(true);
    try {
      const existingAnnotations = await loadAnnotations(item);
      setAnnotations(existingAnnotations);
    } catch (error) {
      console.error("Error loading annotations:", error);
    } finally {
      setIsLoading(false);
    }
  }, [item]);

  useEffect(() => {
    refreshAnnotations();
  }, [refreshAnnotations]);

  // Set up reactive subscription to annotations
  useEffect(() => {
    if (!item.annotations) return;

    const subscription = item.annotations.observe().subscribe((updatedAnnotations) => {
      setAnnotations(updatedAnnotations);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [item]);

  // Save highlight
  const saveHighlight = useCallback(
    async (selectionData: SelectionData): Promise<Annotation | null> => {
      if (!selectionData.selectedText.trim() || !item) return null;

      try {
        const annotation = await handleTextHighlight(item, selectionData);
        if (annotation) {
          // The reactive subscription should automatically update the state
          // But we can also manually update for immediate feedback
          setAnnotations((prev) => {
            const exists = prev.some((ann) => ann.id === annotation.id);
            return exists ? prev : [...prev, annotation];
          });
          return annotation;
        }
      } catch (error) {
        console.error("Failed to save highlight:", error);
      }

      return null;
    },
    [item],
  );

  // Delete highlight
  const deleteHighlight = useCallback(async (annotation: Annotation): Promise<void> => {
    try {
      await deleteAnnotation(annotation);
      // Update local state immediately for better UX
      setAnnotations((prev) => prev.filter((ann) => ann.id !== annotation.id));
    } catch (error) {
      console.error("Failed to delete annotation:", error);
      throw error;
    }
  }, []);

  // Update annotation note
  const updateNote = useCallback(async (annotation: Annotation, note: string): Promise<void> => {
    try {
      await updateAnnotationNote(annotation, note);
      // Update local state immediately
      // setAnnotations((prev) =>
      //   prev.map((ann) => (ann.id === annotation.id ? { ...ann, note } : ann)),
      // );
    } catch (error) {
      console.error("Failed to update annotation note:", error);
      throw error;
    }
  }, []);

  return {
    annotations,
    isLoading,
    saveHighlight,
    deleteHighlight,
    updateNote,
    refreshAnnotations,
  };
};

// Hook specifically for WebView integration
export const useWebViewAnnotations = (item: Item) => {
  const { annotations, saveHighlight, deleteHighlight, updateNote } = useAnnotations({ item });

  // Handle WebView messages
  const handleWebViewMessage = useCallback(
    async (event: { nativeEvent: { data: string } }) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);

        switch (data.type) {
          case "textSelected":
            return await saveHighlight({
              selectedText: data.selectedText,
              selectionStart: data.selectionStart,
              selectionEnd: data.selectionEnd,
              fullText: data.fullText,
            });

          case "highlightClicked":
            const annotation = annotations.find((ann) => ann.id === data.annotationId);
            return annotation;

          default:
            console.log("Unknown WebView message type:", data.type);
            return null;
        }
      } catch (error) {
        console.error("Error handling WebView message:", error);
        return null;
      }
    },
    [saveHighlight, annotations],
  );

  // JavaScript to inject into WebView
  const getInjectedJavaScript = useCallback(
    () => `
    (function() {
      let isSelecting = false;
      
      document.addEventListener('selectionchange', function() {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const selectedText = selection.toString().trim();
          
          if (selectedText && selectedText.length > 0 && !isSelecting) {
            isSelecting = true;
            
            // Get full text content
            const fullText = document.body.textContent || document.body.innerText || '';
            
            // Calculate selection position in full text
            const beforeRange = range.cloneRange();
            beforeRange.selectNodeContents(document.body);
            beforeRange.setEnd(range.startContainer, range.startOffset);
            const selectionStart = beforeRange.toString().length;
            const selectionEnd = selectionStart + selectedText.length;
            
            // Send data to React Native
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'textSelected',
              selectedText: selectedText,
              selectionStart: selectionStart,
              selectionEnd: selectionEnd,
              fullText: fullText
            }));
            
            // Clear selection after a short delay
            setTimeout(() => {
              selection.removeAllRanges();
              isSelecting = false;
            }, 100);
          }
        }
      });
      
      // Handle clicking on existing highlights
      document.addEventListener('click', function(e) {
        if (e.target.tagName === 'MARK' && e.target.dataset.annotationId) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'highlightClicked',
            annotationId: e.target.dataset.annotationId
          }));
        }
      });
    })();
    true;
  `,
    [],
  );

  return {
    annotations,
    handleWebViewMessage,
    getInjectedJavaScript,
    deleteHighlight,
    updateNote,
  };
};

export default useAnnotations;

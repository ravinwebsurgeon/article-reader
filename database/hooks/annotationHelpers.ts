// Add this to your HTMLviewer.tsx component (React Native)

import database from '@/database';
import Annotation from '@/database/models/AnnotationModel';
import Item from '@/database/models/ItemModel';

// Add these interfaces for type safety
interface AnnotationData {
  text: string;
  prefix: string;
  suffix: string;
  note?: string;
}

interface SelectionData {
  selectedText: string;
  selectionStart: number;
  selectionEnd: number;
  fullText: string;
}

// Function to extract text context for prefix and suffix
const getTextContext = (
  fullText: string, 
  selectionStart: number, 
  selectionEnd: number, 
  contextLength: number = 50
): { prefix: string; suffix: string } => {
  // Extract prefix and suffix
  const prefixStart = Math.max(0, selectionStart - contextLength);
  const suffixEnd = Math.min(fullText.length, selectionEnd + contextLength);
  
  const prefix = fullText.substring(prefixStart, selectionStart);
  const suffix = fullText.substring(selectionEnd, suffixEnd);
  
  return { prefix, suffix };
};

// Function to save annotation to database
const saveAnnotation = async (item: Item, annotationData: AnnotationData): Promise<Annotation> => {
  return database.write(async () => {
    const annotation = await database.get<Annotation>('annotations').create((newAnnotation) => {
      // Set the item relationship
      if (newAnnotation.item) {
        newAnnotation.item.set(item);
      }
      
      // Set the annotation data
      newAnnotation.text = annotationData.text;
      newAnnotation.prefix = annotationData.prefix;
      newAnnotation.suffix = annotationData.suffix;
      newAnnotation.note = annotationData.note || null;
    });
    
    return annotation;
  });
};

// Function to check if an annotation already exists
const findExistingAnnotation = async (
  item: Item, 
  text: string, 
  prefix: string, 
  suffix: string
): Promise<Annotation | null> => {
  const annotations = await item.annotations?.fetch();
  if (!annotations) return null;
  
  return annotations.find(annotation => 
    annotation.text === text && 
    annotation.prefix === prefix && 
    annotation.suffix === suffix
  ) || null;
};

// Main function to handle text highlighting and annotation saving
const handleTextHighlight = async (
  item: Item, 
  selectionData: SelectionData
): Promise<Annotation | null> => {
  const { selectedText, selectionStart, selectionEnd, fullText } = selectionData;
  
  if (!selectedText.trim()) {
    console.log('No text selected');
    return null;
  }
  
  try {
    // Get context for the selected text
    const { prefix, suffix } = getTextContext(fullText, selectionStart, selectionEnd);
    
    // Check if this annotation already exists
    const existingAnnotation = await findExistingAnnotation(item, selectedText, prefix, suffix);
    if (existingAnnotation) {
      console.log('Annotation already exists');
      return existingAnnotation;
    }
    
    // Create annotation data
    const annotationData: AnnotationData = {
      text: selectedText,
      prefix,
      suffix,
      note: '' // Can be filled later by user
    };
    
    // Save to database
    const annotation = await saveAnnotation(item, annotationData);
    
    console.log('Annotation saved:', annotation);
    return annotation;
    
  } catch (error) {
    console.error('Error saving annotation:', error);
    return null;
  }
};

// Function to load and display existing annotations
const loadAnnotations = async (item: Item): Promise<Annotation[]> => {
  try {
    const annotations = await item.annotations?.fetch();
    return annotations || [];
  } catch (error) {
    console.error('Error loading annotations:', error);
    return [];
  }
};

// Function to delete an annotation
const deleteAnnotation = async (annotation: Annotation): Promise<void> => {
  return database.write(async () => {
    await annotation.markAsDeleted();
  });
};

// Function to update annotation note
const updateAnnotationNote = async (annotation: Annotation, note: string): Promise<void> => {
  return database.write(async () => {
    await annotation.update((ann) => {
      ann.note = note;
    });
  });
};

// Function to create HTML with highlighted annotations
const createHighlightedHTML = (originalHTML: string, annotations: Annotation[]): string => {
  let highlightedHTML = originalHTML;
  
  // Sort annotations by position (longer texts first to avoid conflicts)
  const sortedAnnotations = [...annotations].sort((a, b) => (b.text?.length || 0) - (a.text?.length || 0));
  
  sortedAnnotations.forEach((annotation) => {
    if (annotation.text && annotation.prefix && annotation.suffix) {
      // Create a more unique pattern using prefix and suffix
      const beforeText = annotation.prefix.slice(-10); // Last 10 chars of prefix
      const afterText = annotation.suffix.slice(0, 10); // First 10 chars of suffix
      
      // Create the pattern to find the exact text
      const pattern = new RegExp(
        `(${escapeRegExp(beforeText)})${escapeRegExp(annotation.text)}(${escapeRegExp(afterText)})`,
        'g'
      );
      
      // Replace with highlighted version
      const replacement = `$1<mark style="background-color: #ffeb3b; padding: 2px 4px; border-radius: 2px;" data-annotation-id="${annotation.id}">${annotation.text}</mark>$2`;
      
      highlightedHTML = highlightedHTML.replace(pattern, replacement);
    }
  });
  
  return highlightedHTML;
};

// Helper function to escape special regex characters
const escapeRegExp = (string: string): string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export {
  handleTextHighlight,
  saveAnnotation,
  findExistingAnnotation,
  loadAnnotations,
  deleteAnnotation,
  updateAnnotationNote,
  getTextContext,
  createHighlightedHTML
};
// utils/textFragments.ts
export type LiteSelection = Pick<
  Selection,
  "anchorNode" | "anchorOffset" | "focusNode" | "focusOffset"
>;

export interface TextFragment {
  text: string;
  prefix?: string;
  suffix?: string;
}

/**
 * Generate a text fragment from a selection that can uniquely identify the selected text
 * This is a simplified version that doesn't support partial text ranges
 */
export function generateTextFragment(selection: LiteSelection): TextFragment | null {
  const { anchorNode, anchorOffset, focusNode, focusOffset } = selection;

  if (!anchorNode || !focusNode) {
    return null;
  }

  // Get the selected text
  const selectedText = getSelectedText(selection);
  if (!selectedText) {
    return null;
  }

  // For single node selections
  if (anchorNode === focusNode) {
    const nodeText = anchorNode.textContent ?? "";

    // Get prefix (text before selection)
    const prefix = getUniquePrefix(nodeText, anchorOffset, selectedText);

    // Get suffix (text after selection)
    const suffix = getUniqueSuffix(nodeText, focusOffset, selectedText);

    return {
      text: selectedText,
      prefix,
      suffix,
    };
  }

  // For multi-node selections, we need to traverse the DOM
  // This is more complex, so let's use the container text approach
  if (!anchorNode || !focusNode) {
    return null;
  }
  const container = findCommonContainer(anchorNode, focusNode);
  if (!container) {
    return null;
  }

  const containerText = container.textContent ?? "";
  const textIndex = containerText.indexOf(selectedText);

  if (textIndex === -1) {
    return null;
  }

  const prefix = getUniquePrefix(containerText, textIndex, selectedText);
  const suffix = getUniqueSuffix(containerText, textIndex + selectedText.length, selectedText);

  return {
    text: selectedText,
    prefix,
    suffix,
  };
}

/**
 * Get the selected text from a selection
 */
function getSelectedText(selection: LiteSelection): string {
  const range = document.createRange();

  if (selection.anchorNode && selection.focusNode) {
    range.setStart(selection.anchorNode, selection.anchorOffset);
    range.setEnd(selection.focusNode, selection.focusOffset);
    return range.toString();
  }

  return "";
}

/**
 * Find the closest common container of two nodes
 */
function findCommonContainer(node1: Node, node2: Node): Node | null {
  const ancestors1 = getAncestors(node1);
  const ancestors2 = getAncestors(node2);

  for (const ancestor of ancestors1) {
    if (ancestors2.includes(ancestor)) {
      return ancestor;
    }
  }

  return null;
}

/**
 * Get all ancestors of a node
 */
function getAncestors(node: Node): Node[] {
  const ancestors: Node[] = [];
  let current: Node | null = node;

  while (current) {
    ancestors.push(current);
    current = current.parentNode;
  }

  return ancestors;
}

/**
 * Get a unique prefix for the selection
 * We want the minimum amount of text that makes this selection unique
 */
function getUniquePrefix(fullText: string, startOffset: number, selectedText: string): string {
  const textBefore = fullText.substring(0, startOffset);
  const words = textBefore.split(/\s+/).filter((word) => word.length > 0);

  // Start with the last word before selection
  if (words.length === 0) {
    return "";
  }

  // Try with just the last word
  let prefix = words[words.length - 1];

  // Check if this prefix + selected text appears multiple times
  const searchString = prefix + selectedText;
  const occurrences = countOccurrences(fullText, searchString);

  if (occurrences === 1) {
    return prefix;
  }

  // Add more words until unique or we run out
  for (let i = words.length - 2; i >= 0 && occurrences > 1; i--) {
    prefix = words[i] + " " + prefix;
    const newSearchString = prefix + selectedText;
    const newOccurrences = countOccurrences(fullText, newSearchString);

    if (newOccurrences === 1) {
      return prefix;
    }
  }

  // If still not unique, include character-level prefix
  const charPrefix = textBefore.substring(Math.max(0, startOffset - 20), startOffset);
  return charPrefix.trim();
}

/**
 * Get a unique suffix for the selection
 */
function getUniqueSuffix(fullText: string, endOffset: number, selectedText: string): string {
  const textAfter = fullText.substring(endOffset);
  const words = textAfter.split(/\s+/).filter((word) => word.length > 0);

  if (words.length === 0) {
    return "";
  }

  // Start with the first word after selection
  let suffix = words[0];

  // Check if selected text + this suffix appears multiple times
  const searchString = selectedText + suffix;
  const occurrences = countOccurrences(fullText, searchString);

  if (occurrences === 1) {
    return suffix;
  }

  // Add more words until unique
  for (let i = 1; i < words.length && occurrences > 1; i++) {
    suffix = suffix + " " + words[i];
    const newSearchString = selectedText + suffix;
    const newOccurrences = countOccurrences(fullText, newSearchString);

    if (newOccurrences === 1) {
      return suffix;
    }
  }

  // If still not unique, include character-level suffix
  const charSuffix = textAfter.substring(0, Math.min(20, textAfter.length));
  return charSuffix.trim();
}

/**
 * Count occurrences of a substring in a string
 */
function countOccurrences(text: string, substring: string): number {
  let count = 0;
  let index = text.indexOf(substring);

  while (index !== -1) {
    count++;
    index = text.indexOf(substring, index + 1);
  }

  return count;
}

/**
 * Helper function to get text inside a node
 */
// function getTextInsideNode(node: Node | null, start?: number, end?: number): string {
//   if (!node) {
//     return "";
//   }

//   return node.nodeType === 3
//     ? // text node
//       (node as any).data.slice(start ?? 0, end ?? (node as any).data.length)
//     : // DOM node
//       node.textContent
//       ? node.textContent.slice(start ?? 0, end ?? node.textContent.length)
//       : "";
// }

/**
 * Find and highlight text based on a text fragment
 */
export function findAndHighlightTextFragment(
  fragment: TextFragment,
  container: HTMLElement,
  highlightId: string,
  color: string = "#FFFF00",
): boolean {
  const { text, prefix, suffix } = fragment;

  // Build search pattern
  let searchPattern = text;
  if (prefix) {
    searchPattern = prefix + searchPattern;
  }
  if (suffix) {
    searchPattern = searchPattern + suffix;
  }

  // Find the text in the container
  const containerText = container.textContent ?? "";
  const index = containerText.indexOf(searchPattern);

  if (index === -1) {
    // Try without prefix/suffix as fallback
    const fallbackIndex = containerText.indexOf(text);
    if (fallbackIndex === -1) {
      return false;
    }

    // Verify this is the only occurrence
    const occurrences = countOccurrences(containerText, text);
    if (occurrences === 1) {
      return highlightTextAtIndex(container, text, fallbackIndex, highlightId, color);
    }

    return false;
  }

  // Calculate the actual text position
  const textStart = index + (prefix?.length ?? 0);

  return highlightTextAtIndex(container, text, textStart, highlightId, color);
}

/**
 * Highlight text at a specific index in the container
 */
function highlightTextAtIndex(
  container: HTMLElement,
  text: string,
  textIndex: number,
  highlightId: string,
  color: string,
): boolean {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);

  let currentIndex = 0;
  let node: Node | null;

  while ((node = walker.nextNode())) {
    const nodeLength = node.textContent?.length ?? 0;

    // Check if this node contains our start position
    if (currentIndex + nodeLength > textIndex) {
      const startInNode = textIndex - currentIndex;
      const endInNode = Math.min(startInNode + text.length, nodeLength);

      // Create highlight span
      const range = document.createRange();
      range.setStart(node, startInNode);

      // Handle case where highlight spans multiple nodes
      if (endInNode < startInNode + text.length) {
        // Find the end node
        let remainingLength = text.length - (endInNode - startInNode);
        let endNode = node;
        let endOffset = endInNode;

        while (remainingLength > 0) {
          const nextNode = walker.nextNode();
          if (!nextNode) {
            break;
          }
          endNode = nextNode;
          const endNodeLength = endNode.textContent?.length ?? 0;

          if (remainingLength <= endNodeLength) {
            endOffset = remainingLength;
            break;
          }

          remainingLength -= endNodeLength;
        }

        if (endNode) {
          range.setEnd(endNode, endOffset);
        }
      } else {
        range.setEnd(node, endInNode);
      }

      // Apply highlight
      try {
        const highlightEl = document.createElement("span");
        highlightEl.id = highlightId;
        highlightEl.className = "text-highlight";
        highlightEl.style.backgroundColor = color;
        highlightEl.setAttribute("role", "mark");
        highlightEl.setAttribute("aria-label", `Highlighted text: ${text}`);

        range.surroundContents(highlightEl);
        return true;
      } catch (e) {
        console.error("Error applying highlight:", e);
        return false;
      }
    }

    currentIndex += nodeLength;
  }

  return false;
}

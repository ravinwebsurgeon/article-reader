import { HTMLViewerPlugin, PluginContext, PluginMessage, HighlightMessage } from "./types";
import { HighlightData } from "@/database/hooks/withAnnotations";

export interface HighlightsPluginCallbacks {
  onHighlightAdded?: (text: string, prefix?: string, suffix?: string) => void;
  onHighlightRemoved?: (highlightId: string) => void;
}

/**
 * Plugin for handling text highlighting in the HTML viewer.
 * Supports both single-paragraph and cross-paragraph highlights with context-aware matching.
 */
export class HighlightsPlugin implements HTMLViewerPlugin {
  name = "highlights";

  private callbacks: HighlightsPluginCallbacks;
  private context: PluginContext | null = null;
  private currentSelection: {
    text: string;
    isHighlighted: boolean;
    highlightId?: string;
  } = { text: "", isHighlighted: false };
  private currentHighlights: HighlightData[] = [];
  private isActivated: boolean = false;

  constructor(callbacks: HighlightsPluginCallbacks = {}) {
    this.callbacks = callbacks;
  }

  /**
   * Initialize the plugin (called by HTMLViewer when WebView is ready)
   */
  initialize(context: PluginContext) {
    this.context = context;
    this.isActivated = true;

    // Send any stored highlights to the WebView now that we're initialized
    if (this.currentHighlights.length > 0) {
      context.sendCommand(this.name, "set-highlights", { highlights: this.currentHighlights });
    }

    // Start selection monitoring
    context.sendCommand(this.name, "start-monitoring");
  }

  /**
   * Update the highlights to render (called by parent when database changes)
   */
  setHighlights(highlights: HighlightData[]) {
    // Always store the current highlights
    this.currentHighlights = highlights;

    // Only send to WebView if plugin is activated
    if (this.isActivated && this.context?.sendCommand) {
      // Simple full re-render - blow away and rebuild everything
      this.context.sendCommand(this.name, "set-highlights", { highlights });
    }
  }

  /**
   * Get current menu items based on selection state
   */
  getMenuItems(): { label: string; key: string }[] {
    console.log(
      "HighlightsPlugin: getMenuItems called with selection state:",
      this.currentSelection,
    );

    // Return highlight-specific items based on state
    if (!this.currentSelection.isHighlighted && this.currentSelection.text) {
      console.log("HighlightsPlugin: Adding Highlight menu item");
      return [{ label: "Highlight", key: "highlight" }];
    }

    if (this.currentSelection.isHighlighted && this.currentSelection.highlightId) {
      console.log("HighlightsPlugin: Adding Remove Highlight menu item");
      return [{ label: "Remove Highlight", key: "removeHighlight" }];
    }

    console.log("HighlightsPlugin: Returning no menu items");
    return [];
  }

  /**
   * Handle menu selection events
   */
  handleMenuSelection(key: string, selectedText: string) {
    switch (key) {
      case "highlight":
        // Send command to get selection context and create highlight
        if (this.context?.sendCommand) {
          this.context.sendCommand(this.name, "create-highlight-from-selection");
        }
        break;

      case "removeHighlight":
        if (this.currentSelection.highlightId && this.callbacks.onHighlightRemoved) {
          this.callbacks.onHighlightRemoved(this.currentSelection.highlightId);
        }
        break;

      default:
        // Unknown action - do nothing
        return;
    }

    // Clear selection after any menu action
    if (this.context?.sendCommand) {
      this.context.sendCommand(this.name, "clear-selection");
    }
  }

  /**
   * CSS styles for highlights
   */
  get cssCode(): string {
    return `
      .pocket-highlight {
        background-color: rgba(255, 255, 0, 0.3);
        border-radius: 2px;
      }
    `;
  }

  /**
   * JavaScript code that runs in the WebView to handle highlighting
   */
  get jsCode(): string {
    return `
      (function() {
        // ============================================================================
        // CONSTANTS AND CONFIGURATION
        // ============================================================================
        
        /**
         * List of HTML elements that create block boundaries.
         * Text highlights cannot span across these elements.
         */
        const BLOCK_ELEMENTS = [
          'ADDRESS', 'ARTICLE', 'ASIDE', 'BLOCKQUOTE', 'BR', 'DETAILS',
          'DIALOG', 'DD', 'DIV', 'DL', 'DT', 'FIELDSET',
          'FIGCAPTION', 'FIGURE', 'FOOTER', 'FORM', 'H1', 'H2',
          'H3', 'H4', 'H5', 'H6', 'HEADER', 'HGROUP',
          'HR', 'LI', 'MAIN', 'NAV', 'OL', 'P',
          'PRE', 'SECTION', 'TABLE', 'UL', 'TR', 'TH',
          'TD', 'COLGROUP', 'COL', 'CAPTION', 'THEAD', 'TBODY',
          'TFOOT',
        ];

        // ============================================================================
        // TEXT NORMALIZATION AND UTILITIES
        // ============================================================================

        /**
         * Normalize text for consistent matching across different whitespace representations.
         * Handles Unicode normalization, whitespace collapse, diacritic removal, and case.
         */
        function normalizeString(str) {
          return (str || '')
            .normalize('NFKD')                    // Decompose diacriticals
            .replace(/\\s+/g, ' ')                // Collapse whitespace to single spaces
            .replace(/[\\u0300-\\u036f]/g, '')    // Remove diacritical marks
            .toLowerCase();                       // Normalize case
        }

        /**
         * Check if a DOM node is visible to the user.
         * Invisible nodes should be excluded from text search.
         */
        function isNodeVisible(node) {
          let elt = node;
          while (elt != null && !(elt instanceof HTMLElement)) elt = elt.parentNode;
          if (elt != null) {
            const nodeStyle = window.getComputedStyle(elt);
            if (nodeStyle.visibility === 'hidden' || nodeStyle.display === 'none' ||
                parseInt(nodeStyle.height, 10) === 0 ||
                parseInt(nodeStyle.width, 10) === 0 ||
                parseInt(nodeStyle.opacity, 10) === 0) {
              return false;
            }
          }
          return true;
        }

        /**
         * Filter function for TreeWalker to accept only visible nodes within a range.
         */
        function acceptNodeIfVisibleInRange(node, range) {
          if (range != null && !range.intersectsNode(node))
            return NodeFilter.FILTER_REJECT;
          return isNodeVisible(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }

        // ============================================================================
        // TEXT NODE COLLECTION AND CONTENT EXTRACTION
        // ============================================================================

        /**
         * Get all text nodes grouped by block boundaries.
         * Text within the same block can be searched together.
         */
        function getAllTextNodes(root, range) {
          const blocks = [];
          let tmp = [];

          const walker = document.createTreeWalker(
            root,
            NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
            (node) => acceptNodeIfVisibleInRange(node, range)
          );

          let node = walker.nextNode();
          while (node) {
            if (node.nodeType === Node.TEXT_NODE) {
              tmp.push(node);
            } else if (
              node instanceof HTMLElement &&
              BLOCK_ELEMENTS.includes(node.tagName.toUpperCase()) && 
              tmp.length > 0
            ) {
              blocks.push(tmp);
              tmp = [];
            }
            node = walker.nextNode();
          }
          
          if (tmp.length > 0) blocks.push(tmp);
          return blocks;
        }

        /**
         * Extract text content from a list of text nodes with proper whitespace handling.
         */
        function getTextContent(nodes, startOffset, endOffset) {
          let str = '';
          if (nodes.length === 1) {
            str = nodes[0].textContent.substring(startOffset, endOffset);
          } else {
            str = nodes[0].textContent.substring(startOffset) +
              nodes.slice(1, -1).reduce((s, n) => s + n.textContent, '') +
              nodes.slice(-1)[0].textContent.substring(0, endOffset);
          }
          return str.replace(/[\\t\\n\\r ]+/g, ' ');
        }

        // ============================================================================
        // POSITION MAPPING BETWEEN NORMALIZED AND ORIGINAL TEXT
        // ============================================================================

        /**
         * Convert a position in normalized text back to the corresponding DOM position.
         * This is complex because normalized text collapses whitespace that exists in the DOM.
         */
        function getBoundaryPointAtIndex(index, textNodes, isEnd) {
          let counted = 0;
          let normalizedData;
          
          for (let i = 0; i < textNodes.length; i++) {
            const node = textNodes[i];
            if (!normalizedData) normalizedData = normalizeString(node.data);
            let nodeEnd = counted + normalizedData.length;
            if (isEnd) nodeEnd += 1;
            
            if (nodeEnd > index) {
              const normalizedOffset = index - counted;
              let denormalizedOffset = Math.min(index - counted, node.data.length);

              const targetSubstring = isEnd ?
                normalizedData.substring(0, normalizedOffset) :
                normalizedData.substring(normalizedOffset);

              let candidateSubstring = isEnd ?
                normalizeString(node.data.substring(0, denormalizedOffset)) :
                normalizeString(node.data.substring(denormalizedOffset));

              const direction = (isEnd ? -1 : 1) *
                (targetSubstring.length > candidateSubstring.length ? -1 : 1);

              while (denormalizedOffset >= 0 && denormalizedOffset <= node.data.length) {
                if (candidateSubstring.length === targetSubstring.length) {
                  return {node: node, offset: denormalizedOffset};
                }
                denormalizedOffset += direction;
                candidateSubstring = isEnd ?
                  normalizeString(node.data.substring(0, denormalizedOffset)) :
                  normalizeString(node.data.substring(denormalizedOffset));
              }
            }
            
            counted += normalizedData.length;
            
            // Handle space between text nodes
            if (i + 1 < textNodes.length) {
              const nextNormalizedData = normalizeString(textNodes[i + 1].data);
              if (normalizedData.slice(-1) === ' ' && nextNormalizedData.slice(0, 1) === ' ') {
                counted -= 1;
              }
              normalizedData = nextNormalizedData;
            }
          }
          return undefined;
        }

        // ============================================================================
        // TEXT SEARCH WITHIN BLOCKS
        // ============================================================================

        /**
         * Find text within a specific list of text nodes (typically within one block).
         */
        function findRangeFromNodeList(query, range, textNodes) {
          if (!query || !range || !(textNodes || []).length) return undefined;
          
          const data = normalizeString(getTextContent(textNodes, 0, undefined));
          const normalizedQuery = normalizeString(query);
          let searchStart = textNodes[0] === range.startContainer ? range.startOffset : 0;
          
          while (searchStart < data.length) {
            const matchIndex = data.indexOf(normalizedQuery, searchStart);
            if (matchIndex === -1) return undefined;
            
            const start = getBoundaryPointAtIndex(matchIndex, textNodes, false);
            const end = getBoundaryPointAtIndex(matchIndex + normalizedQuery.length, textNodes, true);
            
            if (start != null && end != null) {
              const foundRange = new Range();
              foundRange.setStart(start.node, start.offset);
              foundRange.setEnd(end.node, end.offset);

              if (range.compareBoundaryPoints(Range.START_TO_START, foundRange) <= 0 &&
                  range.compareBoundaryPoints(Range.END_TO_END, foundRange) >= 0) {
                return foundRange;
              }
            }
            searchStart = matchIndex + 1;
          }
          return undefined;
        }

        /**
         * Find text within a range using block-aware search.
         * This is the standard approach that respects block boundaries.
         */
        function findTextInRange(query, range) {
          const textNodeLists = getAllTextNodes(range.commonAncestorContainer, range);
          
          for (const list of textNodeLists) {
            const found = findRangeFromNodeList(query, range, list);
            if (found !== undefined) return found;
          }
          return undefined;
        }

        // ============================================================================
        // CROSS-BLOCK TEXT SEARCH
        // ============================================================================

        /**
         * Find text that spans across block boundaries.
         * This ignores block boundaries and searches the entire text as one string.
         */
        function findTextInRangeCrossBlock(query, range) {
          // Get ALL text nodes in the range, ignoring block boundaries
          const walker = document.createTreeWalker(
            range.commonAncestorContainer,
            NodeFilter.SHOW_TEXT,
            (node) => {
              if (!range.intersectsNode(node)) return NodeFilter.FILTER_REJECT;
              return isNodeVisible(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
            }
          );

          const allTextNodes = [];
          let node = walker.nextNode();
          while (node) {
            allTextNodes.push(node);
            node = walker.nextNode();
          }

          if (allTextNodes.length === 0) return undefined;

          // Create a single concatenated text string with normalization
          const fullText = normalizeString(getTextContent(allTextNodes, 0, undefined));
          const normalizedQuery = normalizeString(query);
          
          console.log('Cross-block search:', {
            queryLength: normalizedQuery.length,
            fullTextLength: fullText.length,
            query: normalizedQuery.substring(0, 100),
            fullTextStart: fullText.substring(0, 200)
          });

          let searchStart = 0;
          while (searchStart < fullText.length) {
            const matchIndex = fullText.indexOf(normalizedQuery, searchStart);
            if (matchIndex === -1) return undefined;

            console.log('Found potential match at index:', matchIndex);

            const start = getBoundaryPointAtIndex(matchIndex, allTextNodes, false);
            const end = getBoundaryPointAtIndex(matchIndex + normalizedQuery.length, allTextNodes, true);

            if (start != null && end != null) {
              const foundRange = new Range();
              foundRange.setStart(start.node, start.offset);
              foundRange.setEnd(end.node, end.offset);

              // Verify that foundRange is within our search range
              if (range.compareBoundaryPoints(Range.START_TO_START, foundRange) <= 0 &&
                  range.compareBoundaryPoints(Range.END_TO_END, foundRange) >= 0) {
                console.log('Cross-block match found successfully');
                return foundRange;
              }
            }
            searchStart = matchIndex + 1;
          }
          return undefined;
        }

        /**
         * Enhanced text search that tries block-aware search first, then cross-block search.
         */
        function findTextInRangeWithBlocks(query, range) {
          // First try standard approach (within blocks)
          const standardResult = findTextInRange(query, range);
          if (standardResult) {
            return standardResult;
          }
          
          // If not found, try cross-block search
          console.log('Standard search failed, trying cross-block search');
          return findTextInRangeCrossBlock(query, range);
        }

        // ============================================================================
        // RANGE MANIPULATION UTILITIES
        // ============================================================================

        /**
         * Move the start of a range past any whitespace characters.
         * This is used to skip whitespace between prefix and target text.
         */
        function advanceRangeStartToNonWhitespace(range) {
          const walker = document.createTreeWalker(
            range.commonAncestorContainer,
            NodeFilter.SHOW_TEXT,
            (node) => {
              if (!range.intersectsNode(node)) return NodeFilter.FILTER_REJECT;
              return isNodeVisible(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
            }
          );

          let node = walker.nextNode();
          while (!range.collapsed && node != null) {
            if (node !== range.startContainer) {
              range.setStart(node, 0);
            }

            if (node.textContent.length > range.startOffset) {
              const firstChar = node.textContent[range.startOffset];
              if (!firstChar.match(/\\s/)) {
                return;
              }
            }

            try {
              range.setStart(node, range.startOffset + 1);
            } catch (err) {
              node = walker.nextNode();
              if (node == null) {
                range.collapse();
              } else {
                range.setStart(node, 0);
              }
            }
          }
        }

        // ============================================================================
        // TEXT FRAGMENT PROCESSING (MAIN SEARCH LOGIC)
        // ============================================================================

        /**
         * Process a text fragment directive to find matching text in the document.
         * Uses prefix/suffix context to find the correct instance of the text.
         */
        function processTextFragmentDirective(textFragment) {
          const results = [];
          const searchRange = document.createRange();
          searchRange.selectNodeContents(document.body);

          while (!searchRange.collapsed && results.length < 2) {
            let potentialMatch;
            
            if (textFragment.prefix) {
              // Find the prefix first
              const prefixMatch = findTextInRangeWithBlocks(textFragment.prefix, searchRange);
              if (prefixMatch == null) {
                break;
              }
              
              // Move search range past the first character of prefix for future iterations
              try {
                searchRange.setStart(prefixMatch.startContainer, prefixMatch.startOffset + 1);
              } catch (err) {
                searchRange.setStartAfter(prefixMatch.startContainer);
              }

              // Search for target text after the prefix
              const matchRange = document.createRange();
              matchRange.setStart(prefixMatch.endContainer, prefixMatch.endOffset);
              matchRange.setEnd(searchRange.endContainer, searchRange.endOffset);

              // Skip whitespace after prefix
              advanceRangeStartToNonWhitespace(matchRange);
              if (matchRange.collapsed) {
                break;
              }

              // Use cross-block search for the main text
              potentialMatch = findTextInRangeWithBlocks(textFragment.textStart, matchRange);
              if (potentialMatch == null) {
                break;
              }

              // Check if target text is immediately after the prefix
              if (potentialMatch.compareBoundaryPoints(Range.START_TO_START, matchRange) !== 0) {
                continue;
              }
            } else {
              // No prefix, just look for target text
              potentialMatch = findTextInRangeWithBlocks(textFragment.textStart, searchRange);
              if (potentialMatch == null) {
                break;
              }
              
              try {
                searchRange.setStart(potentialMatch.startContainer, potentialMatch.startOffset + 1);
              } catch (err) {
                searchRange.setStartAfter(potentialMatch.startContainer);
              }
            }

            // Check suffix if provided
            if (textFragment.suffix) {
              const suffixRange = document.createRange();
              suffixRange.setStart(potentialMatch.endContainer, potentialMatch.endOffset);
              suffixRange.setEnd(searchRange.endContainer, searchRange.endOffset);
              
              advanceRangeStartToNonWhitespace(suffixRange);
              
              const suffixMatch = findTextInRangeWithBlocks(textFragment.suffix, suffixRange);
              if (suffixMatch == null) {
                break;
              }

              // Check if suffix is immediately after the target text
              if (suffixMatch.compareBoundaryPoints(Range.START_TO_START, suffixRange) !== 0) {
                continue;
              }
            }

            results.push(potentialMatch.cloneRange());
          }
          
          return results;
        }

        // ============================================================================
        // HIGHLIGHT RENDERING
        // ============================================================================

        /**
         * Create highlight elements around a range of text.
         * Handles both single-node and multi-node ranges.
         */
        function markRange(range, highlightId) {
          if (range.startContainer.nodeType != Node.TEXT_NODE ||
              range.endContainer.nodeType != Node.TEXT_NODE)
            return [];

          // If the range is entirely within a single node, just surround it
          if (range.startContainer === range.endContainer) {
            const mark = document.createElement('span');
            mark.className = 'pocket-highlight';
            mark.dataset.highlightId = highlightId;
            range.surroundContents(mark);
            return [mark];
          }

          // Handle multi-node ranges
          const startNode = range.startContainer;
          const startNodeSubrange = range.cloneRange();
          startNodeSubrange.setEndAfter(startNode);

          const endNode = range.endContainer;
          const endNodeSubrange = range.cloneRange();
          endNodeSubrange.setStartBefore(endNode);

          const marks = [];
          range.setStartAfter(startNode);
          range.setEndBefore(endNode);
          
          // Mark middle nodes
          const walker = document.createTreeWalker(
            range.commonAncestorContainer,
            NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
            {
              acceptNode: function(node) {
                if (!range.intersectsNode(node)) return NodeFilter.FILTER_REJECT;
                if (node.nodeType === Node.TEXT_NODE ||
                    BLOCK_ELEMENTS.includes(node.tagName.toUpperCase()))
                  return NodeFilter.FILTER_ACCEPT;
                return NodeFilter.FILTER_SKIP;
              },
            },
          );
          
          let node = walker.nextNode();
          while (node) {
            if (node.nodeType === Node.TEXT_NODE) {
              const mark = document.createElement('span');
              mark.className = 'pocket-highlight';
              mark.dataset.highlightId = highlightId;
              node.parentNode.insertBefore(mark, node);
              mark.appendChild(node);
              marks.push(mark);
            }
            node = walker.nextNode();
          }

          // Mark start node
          const startMark = document.createElement('span');
          startMark.className = 'pocket-highlight';
          startMark.dataset.highlightId = highlightId;
          startNodeSubrange.surroundContents(startMark);
          
          // Mark end node
          const endMark = document.createElement('span');
          endMark.className = 'pocket-highlight';  
          endMark.dataset.highlightId = highlightId;
          endNodeSubrange.surroundContents(endMark);

          return [startMark, ...marks, endMark];
        }

        // ============================================================================
        // SELECTION CONTEXT EXTRACTION
        // ============================================================================

        /**
         * Extract context information from the current selection.
         * This includes the selected text plus surrounding words for precise matching.
         */
        function getSelectionContext() {
          const selection = window.getSelection();
          if (!selection || selection.isCollapsed) return null;
          
          const text = selection.toString().trim(); // Keep original text
          if (!text) return null;
          
          // Get surrounding context (keep original text)
          const range = selection.getRangeAt(0);
          const contextRange = document.createRange();
          contextRange.selectNodeContents(document.body);
          
          // Get prefix - keep original
          const prefixRange = contextRange.cloneRange();
          prefixRange.setEnd(range.startContainer, range.startOffset);
          const prefixText = prefixRange.toString().trim();
          const prefixWords = prefixText.split(/\\s+/).filter(w => w.length > 0);
          const prefix = prefixWords.length >= 3 ? prefixWords.slice(-3).join(' ') : undefined;
          
          // Get suffix - keep original  
          const suffixRange = contextRange.cloneRange();
          suffixRange.setStart(range.endContainer, range.endOffset);
          const suffixText = suffixRange.toString().trim();
          const suffixWords = suffixText.split(/\\s+/).filter(w => w.length > 0);
          const suffix = suffixWords.length >= 3 ? suffixWords.slice(0, 3).join(' ') : undefined;
          
          return { text, prefix, suffix }; // All original text
        }

        // ============================================================================
        // HIGHLIGHT MANAGEMENT
        // ============================================================================

        /**
         * Apply all highlights to the document using the sophisticated search algorithm.
         */
        function applyHighlights(highlights) {
          console.log('Applying highlights:', highlights.length);
          
          // Clear existing highlights
          const existingHighlights = document.querySelectorAll('.pocket-highlight');
          existingHighlights.forEach(highlight => {
            const parent = highlight.parentNode;
            if (parent) {
              while (highlight.firstChild) {
                parent.insertBefore(highlight.firstChild, highlight);
              }
              parent.removeChild(highlight);
            }
          });
          document.normalize();
          
          // Apply each highlight using text fragment processing
          highlights.forEach((highlight) => {
            const { text, prefix, suffix, id } = highlight;
            console.log('Processing highlight:', { 
              textStart: text.substring(0, 50) + '...', 
              prefix, 
              suffix, 
              id 
            });
            
            // Create text fragment object
            const textFragment = {
              textStart: text,
              prefix: prefix || '',
              suffix: suffix || ''
            };
            
            // Use the sophisticated search algorithm
            const results = processTextFragmentDirective(textFragment);
            
            if (results.length > 0) {
              try {
                // Use the first result
                markRange(results[0], id);
                console.log('Successfully applied highlight for:', text.substring(0, 30) + '...');
              } catch (error) {
                console.error('Error applying highlight for text:', text.substring(0, 30), error);
              }
            } else {
              console.warn('No match found for highlight:', text.substring(0, 30) + '...');
            }
          });
        }

        /**
         * Create a new highlight from the current selection.
         */
        function createHighlight(text, prefix, suffix) {
          const selection = window.getSelection();
          if (!selection || selection.isCollapsed) return;
          
          // Send message to React Native
          window.htmlViewer.postMessage({
            pluginName: 'highlights',
            type: 'highlight-created',
            payload: { text, prefix, suffix }
          });
          
          // Clear selection and update UI
          selection.removeAllRanges();
          checkSelectionChange();
        }

        // ============================================================================
        // SELECTION MONITORING
        // ============================================================================

        let lastSelectionText = '';

        /**
         * Check for changes in text selection and update the UI accordingly.
         */
        function checkSelectionChange() {
          const selection = window.getSelection();
          const currentText = selection ? selection.toString().trim() : '';
          
          if (currentText !== lastSelectionText) {
            lastSelectionText = currentText;
            
            let selectionData = null;
            if (currentText) {
              const context = getSelectionContext();
              if (context) {
                selectionData = {
                  text: context.text,
                  prefix: context.prefix,
                  suffix: context.suffix,
                  isHighlighted: false
                };
                
                // Check if this text is already highlighted
                if (selection.rangeCount > 0) {
                  const range = selection.getRangeAt(0);
                  const containersToCheck = [
                    range.startContainer,
                    range.endContainer,
                    range.commonAncestorContainer
                  ];
                  
                  for (const container of containersToCheck) {
                    let node = container;
                    while (node && node !== document.body) {
                      if (node.nodeType === 1 && node.classList && 
                          node.classList.contains('pocket-highlight')) {
                        selectionData.isHighlighted = true;
                        selectionData.highlightId = node.dataset.highlightId;
                        break;
                      }
                      node = node.parentNode;
                    }
                    if (selectionData.isHighlighted) break;
                  }
                }
              }
            }
            
            // Send selection change to React Native
            window.htmlViewer.postMessage({
              pluginName: 'highlights',
              type: 'selection-changed',
              payload: selectionData
            });
          }
        }

        /**
         * Start monitoring selection changes.
         */
        function startSelectionMonitoring() {
          document.addEventListener('selectionchange', checkSelectionChange);
        }

        // ============================================================================
        // EVENT HANDLERS
        // ============================================================================

        /**
         * Listen for commands from React Native and dispatch to appropriate handlers.
         */
        window.addEventListener('highlightsCommand', function(event) {
          const { type, payload } = event.detail;
          
          switch (type) {
            case 'set-highlights':
              applyHighlights(payload.highlights);
              break;
              
            case 'create-highlight-from-selection':
              const context = getSelectionContext();
              if (context) {
                createHighlight(context.text, context.prefix, context.suffix);
              }
              break;
              
            case 'clear-selection':
              const selection = window.getSelection();
              if (selection) {
                selection.removeAllRanges();
              }
              break;
              
            case 'start-monitoring':
              startSelectionMonitoring();
              break;
          }
        });

        // Start monitoring when script loads
        startSelectionMonitoring();
      })();
    `;
  }

  /**
   * Handle messages from the WebView
   */
  messageHandler = (message: PluginMessage, context: PluginContext) => {
    if (message.pluginName !== "highlights") return;

    switch (message.type) {
      case "selection-changed":
        // Update current selection state
        if (message.payload) {
          const highlightMessage = message as HighlightMessage;
          this.currentSelection = {
            text: highlightMessage.payload.text ?? "",
            isHighlighted: highlightMessage.payload.isHighlighted ?? false,
            highlightId: highlightMessage.payload.highlightId,
          };
        } else {
          this.currentSelection = { text: "", isHighlighted: false };
        }

        // Trigger menu items recalculation
        if (context.invalidateMenuItems) {
          context.invalidateMenuItems();
        }

        break;

      case "highlight-created":
        const highlightMessage = message as HighlightMessage;
        if (highlightMessage.payload) {
          const { text, prefix, suffix } = highlightMessage.payload;
          if (typeof text === "string") {
            if (this.callbacks.onHighlightAdded) {
              this.callbacks.onHighlightAdded(
                text,
                prefix as string | undefined,
                suffix as string | undefined,
              );
            }
          }
        }
        break;
    }
  };
}

import { HTMLViewerPlugin, PluginContext, PluginMessage, HighlightMessage } from "./types";
import { HighlightData } from "@/database/hooks/withAnnotations";

export interface HighlightsPluginCallbacks {
  onHighlightAdded?: (text: string, prefix?: string, suffix?: string) => void;
  onHighlightRemoved?: (highlightId: string) => void;
}

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

  // Get current menu items based on selection state
  getMenuItems(): { label: string; key: string }[] {
    // Base menu items that should always be available
    const baseItems = [
      { label: "Copy", key: "copy" },
      { label: "Share", key: "share" },
      { label: "Select All", key: "selectAll" },
    ];

    // Add highlight-specific items based on state
    if (!this.currentSelection.isHighlighted && this.currentSelection.text) {
      return [{ label: "Highlight", key: "highlight" }, ...baseItems];
    }

    if (this.currentSelection.isHighlighted && this.currentSelection.highlightId) {
      return [{ label: "Remove Highlight", key: "removeHighlight" }, ...baseItems];
    }

    return baseItems;
  }

  // Handle menu selection
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

      case "copy":
      case "share":
      case "selectAll":
        // These actions are handled by the system
        break;
    }

    // Clear selection after any menu action
    if (this.context?.sendCommand) {
      this.context.sendCommand(this.name, "clear-selection");
    }
  }

  get cssCode(): string {
    return `
      .pocket-highlight {
        background-color: rgba(255, 255, 0, 0.3);
        border-radius: 2px;
      }
    `;
  }

  get jsCode(): string {
    return `
      (function() {
        // Google's text fragments approach - exact implementation
        
        // Block elements list from Google's implementation
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

        // Google's normalization function
        function normalizeString(str) {
          return (str || '')
            .normalize('NFKD')
            .replace(/\\s+/g, ' ')
            .replace(/[\\u0300-\\u036f]/g, '')
            .toLowerCase();
        }

        // Check if node is visible (simplified version of Google's)
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

        // Filter function from Google's implementation
        function acceptNodeIfVisibleInRange(node, range) {
          if (range != null && !range.intersectsNode(node))
            return NodeFilter.FILTER_REJECT;
          return isNodeVisible(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }

        // Get all text nodes grouped by block boundaries (Google's approach)
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

        // Get text content with normalization (Google's approach)
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

        // Google's boundary point generation
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

        // Google's range finding from node list
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

        // Google's main text finding function
        function findTextInRange(query, range) {
          const textNodeLists = getAllTextNodes(range.commonAncestorContainer, range);
          
          for (const list of textNodeLists) {
            const found = findRangeFromNodeList(query, range, list);
            if (found !== undefined) return found;
          }
          return undefined;
        }

        // Google's mark range function (simplified for our highlights)
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

          const startMark = document.createElement('span');
          startMark.className = 'pocket-highlight';
          startMark.dataset.highlightId = highlightId;
          startNodeSubrange.surroundContents(startMark);
          
          const endMark = document.createElement('span');
          endMark.className = 'pocket-highlight';  
          endMark.dataset.highlightId = highlightId;
          endNodeSubrange.surroundContents(endMark);

          return [startMark, ...marks, endMark];
        }

        // Context extraction for new highlights - keep original text
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

        // Enhanced text finding that matches with prefix/suffix context
        function findTextWithContext(text, prefix, suffix) {
          console.log('Finding text with context:', { text, prefix, suffix });
          
          // Create search range for the entire document
          const searchRange = document.createRange();
          searchRange.selectNodeContents(document.body);
          
          let results = [];
          
          // First, find all instances of the text
          const textNodeLists = getAllTextNodes(searchRange.commonAncestorContainer, searchRange);
          
          for (const list of textNodeLists) {
            const data = normalizeString(getTextContent(list, 0, undefined));
            const normalizedText = normalizeString(text);
            let searchStart = 0;
            
            while (searchStart < data.length) {
              const matchIndex = data.indexOf(normalizedText, searchStart);
              if (matchIndex === -1) break;
              
              const start = getBoundaryPointAtIndex(matchIndex, list, false);
              const end = getBoundaryPointAtIndex(matchIndex + normalizedText.length, list, true);
              
              if (start && end) {
                const foundRange = new Range();
                foundRange.setStart(start.node, start.offset);
                foundRange.setEnd(end.node, end.offset);
                results.push(foundRange);
              }
              
              searchStart = matchIndex + 1;
            }
          }
          
          console.log('Found', results.length, 'text matches');
          
          // Now filter by context
          for (const textRange of results) {
            let isValidMatch = true;
            
            // Check prefix if provided
            if (prefix && isValidMatch) {
              // Look backwards from text start to find prefix
              const prefixSearchRange = document.createRange();
              prefixSearchRange.selectNodeContents(document.body);
              prefixSearchRange.setEnd(textRange.startContainer, textRange.startOffset);
              
              // Get the text before our match and check if it ends with our prefix
              const beforeText = normalizeString(prefixSearchRange.toString());
              const normalizedPrefix = normalizeString(prefix);
              
              if (!beforeText.endsWith(normalizedPrefix)) {
                console.log('Prefix mismatch. Expected:', normalizedPrefix, 'Found ending:', beforeText.slice(-normalizedPrefix.length * 2));
                isValidMatch = false;
              }
            }
            
            // Check suffix if provided  
            if (suffix && isValidMatch) {
              // Look forwards from text end to find suffix
              const suffixSearchRange = document.createRange();
              suffixSearchRange.selectNodeContents(document.body);
              suffixSearchRange.setStart(textRange.endContainer, textRange.endOffset);
              
              // Get the text after our match and check if it starts with our suffix
              const afterText = normalizeString(suffixSearchRange.toString());
              const normalizedSuffix = normalizeString(suffix);
              
              if (!afterText.startsWith(normalizedSuffix)) {
                console.log('Suffix mismatch. Expected:', normalizedSuffix, 'Found beginning:', afterText.slice(0, normalizedSuffix.length * 2));
                isValidMatch = false;
              }
            }
            
            if (isValidMatch) {
              console.log('Found valid match with context');
              return textRange;
            }
          }
          
          console.log('No valid match found with context');
          return null;
        }

        // Enhanced findTextInRange that can handle cross-block text
        function findTextInRangeWithBlocks(query, range) {
          // First try Google's standard approach (within blocks)
          const standardResult = findTextInRange(query, range);
          if (standardResult) {
            return standardResult;
          }
          
          // If not found, try cross-block search
          console.log('Standard search failed, trying cross-block search');
          return findTextInRangeCrossBlock(query, range);
        }

        // New function to search across block boundaries
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

        // Modified processTextFragmentDirective to use cross-block search
        function processTextFragmentDirective(textFragment) {
          const results = [];
          const searchRange = document.createRange();
          searchRange.selectNodeContents(document.body);

          while (!searchRange.collapsed && results.length < 2) {
            let potentialMatch;
            
            if (textFragment.prefix) {
              const prefixMatch = findTextInRangeWithBlocks(textFragment.prefix, searchRange);
              if (prefixMatch == null) {
                break;
              }
              
              try {
                searchRange.setStart(prefixMatch.startContainer, prefixMatch.startOffset + 1);
              } catch (err) {
                searchRange.setStartAfter(prefixMatch.startContainer);
              }

              const matchRange = document.createRange();
              matchRange.setStart(prefixMatch.endContainer, prefixMatch.endOffset);
              matchRange.setEnd(searchRange.endContainer, searchRange.endOffset);

              advanceRangeStartToNonWhitespace(matchRange);
              if (matchRange.collapsed) {
                break;
              }

              // Use cross-block search for the main text
              potentialMatch = findTextInRangeWithBlocks(textFragment.textStart, matchRange);
              if (potentialMatch == null) {
                break;
              }

              if (potentialMatch.compareBoundaryPoints(Range.START_TO_START, matchRange) !== 0) {
                continue;
              }
            } else {
              // Use cross-block search for text without prefix
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

            if (textFragment.suffix) {
              const suffixRange = document.createRange();
              suffixRange.setStart(potentialMatch.endContainer, potentialMatch.endOffset);
              suffixRange.setEnd(searchRange.endContainer, searchRange.endOffset);
              
              advanceRangeStartToNonWhitespace(suffixRange);
              
              const suffixMatch = findTextInRangeWithBlocks(textFragment.suffix, suffixRange);
              if (suffixMatch == null) {
                break;
              }

              if (suffixMatch.compareBoundaryPoints(Range.START_TO_START, suffixRange) !== 0) {
                continue;
              }
            }

            results.push(potentialMatch.cloneRange());
          }
          
          return results;
        }

        // Google's advance range to non-whitespace
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

        // Apply highlights using Google's exact approach
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
          
          // Apply each highlight using Google's processTextFragmentDirective
          highlights.forEach((highlight) => {
            const { text, prefix, suffix, id } = highlight;
            console.log('Processing highlight:', { 
              textStart: text.substring(0, 50) + '...', 
              prefix, 
              suffix, 
              id 
            });
            
            // Create text fragment object like Google expects
            const textFragment = {
              textStart: text,
              prefix: prefix || '',
              suffix: suffix || ''
            };
            
            // Use Google's exact logic
            const results = processTextFragmentDirective(textFragment);
            
            if (results.length > 0) {
              try {
                // Use the first result (Google's behavior)
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

        // Rest of the existing functions for selection tracking and UI...
        function createHighlight(text, prefix, suffix) {
          const selection = window.getSelection();
          if (!selection || selection.isCollapsed) return;
          
          window.htmlViewer.postMessage({
            pluginName: 'highlights',
            type: 'highlight-created',
            payload: { text, prefix, suffix }
          });
          
          selection.removeAllRanges();
          checkSelectionChange();
        }

        let lastSelectionText = '';

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
            
            window.htmlViewer.postMessage({
              pluginName: 'highlights',
              type: 'selection-changed',
              payload: selectionData
            });
          }
        }

        function startSelectionMonitoring() {
          document.addEventListener('selectionchange', checkSelectionChange);
        }

        // Listen for commands from React
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

        startSelectionMonitoring();
      })();
    `;
  }

  messageHandler = (message: PluginMessage, context: PluginContext) => {
    if (message.pluginName !== "highlights") return;

    switch (message.type) {
      case "selection-changed":
        // Update current selection state
        if (message.payload) {
          this.currentSelection = {
            text: (message.payload as any).text || "",
            isHighlighted: (message.payload as any).isHighlighted || false,
            highlightId: (message.payload as any).highlightId,
          };
        } else {
          this.currentSelection = { text: "", isHighlighted: false };
        }

        context.updateMenus();
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

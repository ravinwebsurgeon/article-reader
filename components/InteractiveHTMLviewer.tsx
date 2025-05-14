import React, { useRef, useState, useEffect } from "react";
import { StyleSheet, View, TouchableOpacity, Text, SafeAreaView } from "react-native";
import { WebView } from "react-native-webview";
import type { WebViewMessageEvent } from "react-native-webview";

interface Highlight {
  id: string;
  text: string;
  startOffset: number;
  endOffset: number;
  paragraphIndex?: number;
}

interface InteractiveHtmlViewerProps {
  html: string;
  onTextSelect?: (text: string) => void;
  onHighlightAdd?: (highlight: Highlight) => void;
  onHighlightRemove?: (highlightId: string) => void;
  onParagraphTap?: (paragraphIndex: number, text: string) => void;
  highlights?: Highlight[];
  highlightColor?: string;
}

const generateId = () => Math.random().toString(36).substring(2, 11);

const InteractiveHtmlViewer: React.FC<InteractiveHtmlViewerProps> = ({
  html,
  onTextSelect,
  onHighlightAdd,
  onHighlightRemove,
  onParagraphTap,
  highlights = [],
  highlightColor = "rgba(255, 255, 0, 0.5)",
}) => {
  const webViewRef = useRef<WebView>(null);
  const [selectedText, setSelectedText] = useState<any | null>(null);
  const [localHighlights, setLocalHighlights] = useState<Highlight[]>(highlights);

  useEffect(() => {
    setLocalHighlights(highlights);
  }, [highlights]);

  const generateHighlightsScript = (highlights: Highlight[]) => `
  (function() {
    document.querySelectorAll('.highlight-wrapper').forEach(el => el.remove());
    
    ${JSON.stringify(highlights)}.forEach(highlight => {
      try {
        if (highlight.paragraphIndex !== undefined) {
          // Paragraph highlighting logic
        } else if (highlight.startXPath && highlight.endXPath) {
          const startNode = document.evaluate(
            highlight.startXPath,
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
          ).singleNodeValue;
          
          const endNode = document.evaluate(
            highlight.endXPath,
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
          ).singleNodeValue;
          
          if (startNode && endNode) {
            const range = document.createRange();
            range.setStart(startNode, highlight.startOffset);
            range.setEnd(endNode, highlight.endOffset);
            
            if (!range.collapsed) {
              const wrapper = document.createElement('span');
              wrapper.className = 'highlight-wrapper';
              wrapper.dataset.highlightId = highlight.id;
              wrapper.style.backgroundColor = '${highlightColor}';
              range.surroundContents(wrapper);
            }
          }
        }
      } catch (e) {
        console.error('Highlight error:', e);
      }
    });
    
    // Add click listeners
    document.querySelectorAll('.highlight-wrapper').forEach(el => {
      el.addEventListener('click', function(e) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'removeHighlight',
          highlightId: this.dataset.highlightId
        }));
        e.stopPropagation();
      });
    });
  })();
`;

  const initialScript = `

  (function() {
    // Prevent context menu
    document.addEventListener('contextmenu', function(e) {
      e.preventDefault();
      return false;
    });

    // Initialize text selection handling
    document.addEventListener('selectionchange', () => {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const { startContainer, startOffset, endContainer, endOffset } = range;

        const getXPath = (node) => {
          const parts = [];
          while (node !== null && node.nodeType !== Node.DOCUMENT_NODE) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              let index = 0;
              let sibling = node.previousSibling;
              while (sibling) {
                if (sibling.nodeType === Node.ELEMENT_NODE && sibling.tagName === node.tagName) {
                  index++;
                }
                sibling = sibling.previousSibling;
              }
              parts.push(\`\${node.tagName.toLowerCase()}[\${index + 1}]\`);
            } else if (node.nodeType === Node.TEXT_NODE) {
              let index = 0;
              let sibling = node.previousSibling;
              while (sibling) {
                if (sibling.nodeType === Node.TEXT_NODE) index++;
                sibling = sibling.previousSibling;
              }
              parts.push(\`text()[\${index + 1}]\`);
            }
            node = node.parentNode;
          }
          return parts.reverse().join('/');
        };

        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'textSelected',
          text: selection.toString(),
          startXPath: getXPath(startContainer),
          startOffset,
          endXPath: getXPath(endContainer),
          endOffset,
        }));
      }
    });

    // (function() {
    //   // Initialize text selection handling
    //   document.addEventListener('selectionchange', () => {
    //     const selection = window.getSelection();
    //     if (selection && selection.toString()) {
    //       const text = selection.toString();
    //       window.ReactNativeWebView.postMessage(JSON.stringify({
    //         type: 'textSelected',
    //         text
    //       }));
    //     }
    //   });
      
      // Set up paragraph tap handling
      const paragraphs = document.querySelectorAll('p');
      Array.from(paragraphs).forEach((paragraph, index) => {
        paragraph.setAttribute('data-paragraph-index', index.toString());
        paragraph.addEventListener('click', function(e) {
          // Only trigger if this is a direct click on the paragraph, not on a highlight
          if (e.target === paragraph) {
            const paragraphIndex = parseInt(this.getAttribute('data-paragraph-index'));
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'paragraphTap',
              paragraphIndex,
              text: this.textContent
            }));
          }
        });
      });
      
      // Prepare the page
      document.body.style.userSelect = 'text';
      document.body.style.webkitUserSelect = 'text';
      document.body.style.padding = '15px';
      document.body.style.fontSize = '16px';
      document.body.style.lineHeight = '1.5';
      
      // Add CSS for highlights
      const style = document.createElement('style');
      style.textContent = \`
        .highlight-wrapper {
          cursor: pointer;
          border-radius: 2px;
          transition: background-color 0.2s;
        }
        .highlight-wrapper:hover {
          opacity: 0.8;
        }
      \`;
      document.head.appendChild(style);
    })();
  `;

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      console.log("Received message from WebView:", data.type);

      switch (data.type) {
        case "textSelected":
          setSelectedText({
            text: data.text,
            startXPath: data.startXPath,
            startOffset: data.startOffset,
            endXPath: data.endXPath,
            endOffset: data.endOffset,
          });
          if (onTextSelect) onTextSelect(data.text);
          break;
        case "removeHighlight":
          const filteredHighlights = localHighlights.filter((h) => h.id !== data.highlightId);
          setLocalHighlights(filteredHighlights);
          webViewRef.current?.injectJavaScript(generateHighlightsScript(filteredHighlights));

          if (onHighlightRemove) onHighlightRemove(data.highlightId);
          break;

        case "paragraphTap":
          const paragraphIndex = data.paragraphIndex;

          // Check if paragraph is already highlighted
          const existingParagraphHighlight = localHighlights.find(
            (h) => h.paragraphIndex === paragraphIndex,
          );

          if (existingParagraphHighlight) {
            // If already highlighted, remove the highlight
            const filteredHighlights = localHighlights.filter(
              (h) => h.id !== existingParagraphHighlight.id,
            );
            setLocalHighlights(filteredHighlights);
            webViewRef.current?.injectJavaScript(generateHighlightsScript(filteredHighlights));

            if (onHighlightRemove) onHighlightRemove(existingParagraphHighlight.id);
          } else {
            // Add new paragraph highlight
            const newHighlight: Highlight = {
              id: generateId(),
              text: data.text,
              startOffset: 0,
              endOffset: data.text.length,
              paragraphIndex: data.paragraphIndex,
            };

            const updatedHighlights = [...localHighlights, newHighlight];
            setLocalHighlights(updatedHighlights);
            webViewRef.current?.injectJavaScript(generateHighlightsScript(updatedHighlights));

            if (onHighlightAdd) onHighlightAdd(newHighlight);
          }

          if (onParagraphTap) onParagraphTap(paragraphIndex, data.text);
          break;
      }
    } catch (error) {
      console.error("Error handling message:", error);
    }
  };

  // 5. Update highlight creation
  const handleAddHighlight = () => {
    if (!selectedText) return;

    const newHighlight: Highlight = {
      id: generateId(),
      text: selectedText.text,
      startXPath: selectedText.startXPath,
      startOffset: selectedText.startOffset,
      endXPath: selectedText.endXPath,
      endOffset: selectedText.endOffset,
    };

    const updatedHighlights = [...localHighlights, newHighlight];
    setLocalHighlights(updatedHighlights);
    webViewRef.current?.injectJavaScript(generateHighlightsScript(updatedHighlights));

    setSelectedText(null);
    if (onHighlightAdd) onHighlightAdd(newHighlight);
  };

  

  const getHTMLWithWrapper = () => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              padding: 0;
              margin: 0;
              color: #000;
            }
            @media (prefers-color-scheme: dark) {
              body {
                background-color: #121212;
                color: #fff;
              }
            }
          </style>
        </head>
        <body>
          ${html}
        </body>
      </html>
    `;
  };

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={["*"]}
        source={{ html: getHTMLWithWrapper() }}
        style={styles.webview}
        injectedJavaScript={initialScript}
        injectedJavaScriptBeforeContentLoaded={generateHighlightsScript(localHighlights)}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onLoad={() => {
          // Apply highlights after the content is loaded
          webViewRef.current?.injectJavaScript(generateHighlightsScript(localHighlights));
        }}
      />

      {selectedText ? (
        <View style={styles.toolbar}>
          <TouchableOpacity style={styles.button} onPress={handleAddHighlight}>
            <Text style={styles.buttonText}>Highlight</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  toolbar: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#f5f5f5",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#007AFF",
    borderRadius: 4,
    marginHorizontal: 5,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default InteractiveHtmlViewer;

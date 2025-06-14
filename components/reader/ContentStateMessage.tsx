import React, { useEffect } from "react";
import { View, TouchableOpacity, Linking } from "react-native";
import { useTheme, useSpacing } from "@/theme/hooks";
import { ThemeView, ThemeText } from "@/components/primitives";
import { useTranslation } from "react-i18next";

interface ContentStateMessageProps {
  message: string;
  showWaybackLink?: boolean;
  showWebLink?: boolean;
  showPaywallInfo?: boolean;
  onSwitchToWebView?: () => void;
  waybackData?: { available: boolean; url?: string } | null;
  isCheckingWayback?: boolean;
  onCheckWayback?: () => void;
  itemUrl?: string;
}

export const ContentStateMessage: React.FC<ContentStateMessageProps> = ({
  message,
  showWaybackLink = false,
  showWebLink = false,
  showPaywallInfo = false,
  onSwitchToWebView,
  waybackData,
  isCheckingWayback = false,
  onCheckWayback,
  itemUrl,
}) => {
  const theme = useTheme();
  const spacing = useSpacing();
  const { t } = useTranslation();

  // Check wayback when component mounts and showWaybackLink is true
  useEffect(() => {
    if (showWaybackLink && onCheckWayback) {
      onCheckWayback();
    }
  }, [showWaybackLink, onCheckWayback]);

  return (
    <ThemeView
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: spacing.lg,
      }}
    >
      <ThemeText
        variant="body1"
        style={{
          textAlign: "center",
          marginBottom: showWaybackLink || showWebLink || showPaywallInfo ? spacing.md : 0,
          color: theme.colors.text.secondary,
        }}
      >
        {message}
      </ThemeText>
      {showPaywallInfo && (
        <ThemeText
          variant="caption"
          style={{
            textAlign: "center",
            marginBottom: spacing.md,
            color: theme.colors.text.subtle,
            fontStyle: "italic",
          }}
        >
          {t("reader.content.paywallNotice")}
        </ThemeText>
      )}
      {showWebLink && itemUrl && onSwitchToWebView && (
        <TouchableOpacity
          onPress={onSwitchToWebView}
          style={{
            backgroundColor: theme.colors.primary.main,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderRadius: 8,
            marginBottom: showWaybackLink ? spacing.sm : 0,
          }}
        >
          <ThemeText variant="button" style={{ color: theme.colors.white }}>
            {t("reader.content.switchToWebView")}
          </ThemeText>
        </TouchableOpacity>
      )}
      {showWaybackLink && (
        <View style={{ alignItems: "center" }}>
          {isCheckingWayback ? (
            <ThemeText variant="caption" style={{ color: theme.colors.text.subtle }}>
              {t("reader.content.checkingArchive")}
            </ThemeText>
          ) : waybackData?.available && waybackData.url ? (
            <TouchableOpacity
              onPress={() => {
                if (waybackData.url) {
                  Linking.openURL(waybackData.url);
                }
              }}
              style={{
                backgroundColor: theme.colors.primary.main,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                borderRadius: 8,
                marginTop: spacing.sm,
              }}
            >
              <ThemeText variant="button" style={{ color: theme.colors.white }}>
                {t("reader.content.viewInWaybackMachine")}
              </ThemeText>
            </TouchableOpacity>
          ) : waybackData?.available === false ? (
            <ThemeText
              variant="caption"
              style={{
                color: theme.colors.text.subtle,
                textAlign: "center",
                marginTop: spacing.sm,
              }}
            >
              {t("reader.content.noArchivedVersion")}
            </ThemeText>
          ) : null}
        </View>
      )}
    </ThemeView>
  );
};

export default ContentStateMessage;

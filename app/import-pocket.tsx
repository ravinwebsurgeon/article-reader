import React, { useState, useCallback, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import WebView from "react-native-webview";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ThemeText, ThemeView } from "@/components/primitives";
import { Button } from "@/components/shared/button/Button";
import { useColors } from "@/theme/hooks";
import { useAuthStore } from "@/stores/authStore";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path, Circle } from "react-native-svg";

type ImportStep = "explanation" | "webview" | "success";

export default function ImportPocketScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useColors();
  const webViewRef = useRef<WebView>(null);

  const [currentStep, setCurrentStep] = useState<ImportStep>("explanation");

  // Get auth token from Zustand store
  const { token: authToken } = useAuthStore();

  const handleStartImport = useCallback(() => {
    setCurrentStep("webview");
  }, []);

  const handleWebViewMessage = useCallback((event: { nativeEvent: { data: string } }) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);

      if (message.type === "import-complete") {
        setCurrentStep("success");
      } else if (message.type === "import-error") {
        // Handle error - could show error state or go back
        console.error("Import error:", message.error);
      }
    } catch (error) {
      console.error("Error parsing WebView message:", error);
    }
  }, []);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const renderExplanationStep = () => (
    <ThemeView style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Ionicons name="download-outline" size={64} color={colors.primary.main} />
      </View>

      <ThemeText variant="h3" style={[styles.title, { color: colors.text.primary }]}>
        {t("import.pocket.title")}
      </ThemeText>

      <ThemeText variant="body1" style={[styles.description, { color: colors.text.secondary }]}>
        {t("import.pocket.description")}
      </ThemeText>

      <View style={styles.bulletPoints}>
        <View style={styles.bulletPoint}>
          <Ionicons name="checkmark" size={20} color={colors.success.main} />
          <ThemeText variant="body2" style={[styles.bulletText, { color: colors.text.primary }]}>
            {t("import.pocket.benefits.importArticles")}
          </ThemeText>
        </View>
        <View style={styles.bulletPoint}>
          <Ionicons name="checkmark" size={20} color={colors.success.main} />
          <ThemeText variant="body2" style={[styles.bulletText, { color: colors.text.primary }]}>
            {t("import.pocket.benefits.preserveProgress")}
          </ThemeText>
        </View>
        <View style={styles.bulletPoint}>
          <Ionicons name="checkmark" size={20} color={colors.success.main} />
          <ThemeText variant="body2" style={[styles.bulletText, { color: colors.text.primary }]}>
            {t("import.pocket.benefits.keepAccount")}
          </ThemeText>
        </View>
      </View>

      <ThemeText variant="body2" style={[styles.note, { color: colors.text.secondary }]}>
        {t("import.pocket.note")}
      </ThemeText>

      <View style={styles.buttonContainer}>
        <Button
          variant="primary"
          size="large"
          onPress={handleStartImport}
          buttonStyle={styles.primaryButton}
          title={t("import.pocket.startImport")}
        />
        <TouchableOpacity onPress={handleClose} style={styles.skipButton}>
          <ThemeText variant="body2" style={[styles.skipText, { color: colors.text.secondary }]}>
            {t("import.pocket.notNow")}
          </ThemeText>
        </TouchableOpacity>
      </View>
    </ThemeView>
  );

  const renderWebViewStep = () => {
    const importUrl = `https://api.savewithfolio.com/import/pocket/start?auth_token=${authToken}`;

    // JavaScript to inject for communication
    const injectedJavaScript = `
      (function() {
        // Listen for messages from the web page
        window.addEventListener('message', function(event) {
          if (event.data && event.data.type === 'folio-import-complete') {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'import-complete'
            }));
          } else if (event.data && event.data.type === 'folio-import-error') {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'import-error',
              error: event.data.error
            }));
          }
        });
        
        // Also check for a global function that the web page might call
        window.folioImportComplete = function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'import-complete'
          }));
        };
        
        window.folioImportError = function(error) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'import-error',
            error: error
          }));
        };
      })();
      true;
    `;

    return (
      <ThemeView style={styles.webViewContainer}>
        <WebView
          ref={webViewRef}
          source={{ uri: importUrl }}
          style={styles.webView}
          onMessage={handleWebViewMessage}
          injectedJavaScript={injectedJavaScript}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={Platform.OS === "android"}
        />
      </ThemeView>
    );
  };

  const renderSuccessStep = () => (
    <ThemeView style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <Path
            d="M10 13C13.469 13 16.9117 13.461 20.2607 14.3594C24.5761 15.5551 28.8596 17.6152 32 20.876C35.2171 17.5355 39.5924 15.4975 44.0273 14.2861C44.0107 14.522 44 14.7599 44 15C44 20.5228 48.4772 25 54 25C54.685 25 55.3537 24.93 56 24.7988V44C56 45.1045 55.1045 45.9999 54 46C52.6959 46 51.3917 46.0698 50.1025 46.21C45.892 46.7018 41.61 47.8612 38 50.1465C36.1431 51.322 34.3073 53 32 53C29.6926 53 27.8572 51.3216 26 50.1465C22.655 48.0301 18.7 46.8889 14.8115 46.3213C13.2151 46.1052 11.6099 46.014 10 46.001C8.91094 46.001 8.00001 45.09 8 44.001L8.01074 14.7959C8.113 13.7872 8.96435 13 10 13ZM49.1826 34.1279C43.1678 34.7333 37.1777 36.4679 32 39.6338C26.8229 36.4683 20.8313 34.7332 14.8174 34.1279C14.3779 34.0837 14 34.4323 14 34.874V39.3906C14.0002 39.7796 14.296 40.104 14.6826 40.1475C20.8774 40.8419 27.2068 42.906 32 47.0166C36.7958 42.9039 43.1186 40.8424 49.3174 40.1475C49.704 40.104 49.9998 39.7796 50 39.3906V34.874C50 34.4323 49.6221 34.0837 49.1826 34.1279Z"
            fill="#DEDEDE"
            fill-opacity="0.16"
          />
          <Path
            d="M34.5879 52.3232C33.7798 52.7248 32.9288 53 32 53L31.7852 52.9951C30.9388 52.957 30.1568 52.6939 29.4111 52.3232L30.3008 50.5352C30.9316 50.8487 31.4745 51 32 51C32.5255 51 33.0684 50.8486 33.6992 50.5352L34.5879 52.3232ZM24.7988 47.1904C25.5741 47.5695 26.3332 47.9903 27.0693 48.4561L27.6738 48.8525C27.871 48.9856 28.0632 49.1183 28.2471 49.2451C28.6257 49.5064 28.9722 49.7455 29.3203 49.9688L28.2412 51.6514C27.4771 51.1615 26.7398 50.6146 26 50.1465C25.3292 49.7221 24.6333 49.3375 23.9189 48.9883L23.9199 48.9873L24.7988 47.1904ZM40.2451 48.9043L40.2461 48.9062C39.4748 49.2774 38.7233 49.6886 38 50.1465C37.2601 50.6149 36.5222 51.1614 35.7578 51.6514L35.5244 51.2861L34.6797 49.9688C35.0278 49.7456 35.3744 49.5064 35.7529 49.2451C36.1207 48.9913 36.5221 48.7147 36.9307 48.4561L37.5293 48.0898C38.1328 47.733 38.7498 47.4044 39.377 47.1025L40.2451 48.9043ZM34.5654 46.3008L35.1338 47.124C34.4988 47.5632 33.8867 48.0326 33.3018 48.5342C32.5526 49.1766 31.4473 49.1766 30.6982 48.5342C30.1135 48.0327 29.5015 47.5632 28.8662 47.124L30.0029 45.4795C30.5313 45.8448 31.0467 46.2299 31.5459 46.6367L32 47.0166C32.6396 46.4681 33.3071 45.9566 33.9971 45.4795L34.5654 46.3008ZM18.7949 45.0566C20.4277 45.4572 22.0548 45.9791 23.626 46.6533L22.8369 48.4912L22.8359 48.4922C21.3801 47.8675 19.8597 47.3783 18.3174 47L18.3184 46.999L18.7949 45.0566ZM46.3076 46.8467C44.6369 47.2196 42.9901 47.7213 41.415 48.3799L40.6436 46.5342C42.342 45.824 44.1035 45.2893 45.8721 44.8945L46.3076 46.8467ZM13.0459 44.125C13.5529 44.1641 14.0614 44.2134 14.5703 44.2744L15.0801 44.3389L15.1006 44.3418L15.7148 44.4365C16.3305 44.5355 16.9485 44.6489 17.5664 44.7783L17.3613 45.7559L17.3623 45.7568L17.1572 46.7354L17.1562 46.7363C16.3756 46.5729 15.5923 46.4352 14.8115 46.3213C14.1729 46.2349 13.5328 46.1686 12.8916 46.1191L12.9082 45.9102L13.0459 44.125ZM51.6582 46.0752V46.0781C51.138 46.1117 50.6189 46.1538 50.1025 46.21C49.2574 46.3087 48.4093 46.4346 47.5645 46.5908L47.2012 44.624C48.0924 44.4592 48.9843 44.3271 49.8701 44.2236L49.8867 44.2217L50.707 44.1416C50.9807 44.1179 51.2549 44.0968 51.5293 44.0791L51.6582 46.0752ZM24.4492 42.5273C26.0135 43.1534 27.5233 43.9039 28.9482 44.7891L27.8945 46.4873C26.578 45.6694 25.1728 44.9714 23.707 44.3848L24.0791 43.4551L24.4492 42.5273ZM40.293 44.3838C38.8274 44.9704 37.4222 45.6681 36.1055 46.4863L35.0498 44.7891C36.4752 43.9032 37.9853 43.1525 39.5498 42.5264L40.293 44.3838ZM10.0166 44.001C10.6861 44.0064 11.3583 44.0247 12.0322 44.0596L11.9795 45.0576L11.9805 45.0586L11.9287 46.0566C11.2871 46.0235 10.6434 46.0062 10 46.001C9.56587 46.001 9.16118 45.8544 8.83008 45.6113L10.0107 44.002H10.0088L10 44.001C10.0054 44.001 10.0112 44.0009 10.0166 44.001ZM53.999 44.001L55.1738 45.6162C54.8439 45.8562 54.4392 46 54 46L53.0225 46.0127C52.8277 46.0179 52.633 46.0268 52.4385 46.0352V46.0332L52.3525 44.0352C52.901 44.0116 53.4508 44 54 44L53.999 44.001ZM56 44L55.9893 44.2041C55.9526 44.5648 55.8177 44.8956 55.6152 45.1738L54.001 43.998C54.001 43.998 54.0004 43.9989 54 44V41.0996H56V44ZM9.98242 44.001H9.98047L8.38867 45.1699C8.18423 44.8911 8.04808 44.5601 8.01074 44.2031L8 44.001L8.00098 41.0801L10.001 41.0811L10 44.001C9.99996 43.9982 9.99952 43.9942 9.99902 43.9912L9.99805 43.9883L9.98242 44.001ZM18.415 40.7373C20.0581 41.0753 21.6872 41.5186 23.2705 42.082L22.6006 43.9668C21.1123 43.4372 19.5737 43.0163 18.0137 42.6953L18.415 40.7373ZM45.9863 42.6953C44.4259 43.0161 42.8874 43.4364 41.3994 43.9658L41.0459 42.9746L40.7285 42.0811C42.3116 41.5178 43.9406 41.0742 45.584 40.7363L45.9863 42.6953ZM14.2783 39.9736C14.3905 40.0664 14.5287 40.1302 14.6826 40.1475C15.513 40.2405 16.3456 40.359 17.1768 40.5029L16.8369 42.4727C16.0461 42.3357 15.2523 42.2236 14.46 42.1348C13.9107 42.073 13.4082 41.8512 13.0049 41.5186L14.2773 39.9756L14.2783 39.9736ZM49.7227 39.9756L50.3594 40.7471L50.9951 41.5186C50.5918 41.8512 50.0902 42.073 49.541 42.1348C48.7484 42.2236 47.9538 42.3358 47.1631 42.4727L46.9922 41.4863L46.8223 40.5029C47.4599 40.3926 48.0985 40.2971 48.7363 40.2168L49.3174 40.1475C49.471 40.1302 49.6086 40.0661 49.7207 39.9736L49.7227 39.9756ZM14 39.3906C14.0001 39.5449 14.0486 39.6882 14.1289 39.8086L14.1279 39.8105L13.2979 40.3682L13.2969 40.3672L12.4668 40.9248C12.1728 40.4862 12.0003 39.9561 12 39.3916V37.584H14V39.3906ZM52 39.3916C51.9997 39.9561 51.8272 40.4862 51.5332 40.9248L50.7021 40.3672L49.8721 39.8105L49.8701 39.8086C49.9506 39.6881 49.9999 39.5451 50 39.3906V37.584H52V39.3916ZM56 39.6494H54V33.8496H56V39.6494ZM35.1992 37.9023C34.1046 38.4236 33.0359 39.0004 32 39.6338L31.5127 39.3408C30.6299 38.8212 29.7238 38.3433 28.7998 37.9033L28.8008 37.9023L29.6611 36.0967C30.4537 36.4741 31.2334 36.8814 32 37.3154C32.7666 36.8814 33.5463 36.4741 34.3389 36.0967L35.1992 37.9023ZM10.002 39.6211L8.00195 39.6201L8.00098 39.6191L8.00391 33.7793H10.0039L10.002 39.6211ZM20.6357 33.0332C23.1119 33.5805 25.555 34.3334 27.9092 35.3154L27.1396 37.1611L27.1387 37.1621C24.9022 36.2292 22.5733 35.5111 20.2031 34.9873L20.2041 34.9863L20.6357 33.0332ZM43.7949 34.9863C41.425 35.5101 39.0966 36.2292 36.8604 37.1621L36.0908 35.3154C38.445 34.3333 40.888 33.5805 43.3643 33.0332L43.7949 34.9863ZM14.1113 34.373L14.1592 34.4102C14.0598 34.5374 14.0001 34.6986 14 34.874V36.6807H12V34.874C12.0001 34.238 12.2179 33.6463 12.582 33.1797L14.1113 34.373ZM51.418 33.1797C51.7821 33.6463 51.9999 34.238 52 34.874V36.6807H50V34.874C49.9999 34.6984 49.9395 34.5375 49.8398 34.4102L49.8887 34.373L51.418 33.1797ZM15.0176 32.1377L15.958 32.2412C16.8979 32.3537 17.8376 32.4935 18.7734 32.6611L18.4209 34.6299L18.4199 34.6309C17.2241 34.4167 16.0213 34.2491 14.8174 34.1279C14.6424 34.1103 14.4773 34.1552 14.3418 34.2432L13.7969 33.4043L13.2529 32.5654C13.6922 32.2803 14.2199 32.1168 14.7773 32.124L15.0176 32.1377ZM49.2227 32.124C49.7801 32.1168 50.3078 32.2803 50.7471 32.5654L50.2021 33.4033L50.2031 33.4043L49.6582 34.2432C49.5229 34.1555 49.3573 34.1104 49.1826 34.1279C47.9783 34.2491 46.7751 34.4167 45.5791 34.6309L45.2266 32.6611C46.4744 32.4377 47.7289 32.2639 48.9824 32.1377L49.2227 32.124ZM56 32.3994H54V26.5996H56V32.3994ZM8.00684 26.4775L10.0068 26.4785L10.0039 32.3193L9.00391 32.3184H8.00391L8.00586 26.4766L8.00684 26.4775ZM56 25.1494H54V25C54.685 25 55.3537 24.93 56 24.7988V25.1494ZM10.0068 25.0186L8.00684 25.0176L8.00879 19.1768H10.0088L10.0068 25.0186ZM35.4219 20.5C34.7156 21.0414 34.0522 21.6275 33.4404 22.2627C33.0634 22.6541 32.5435 22.876 32 22.876C31.4565 22.876 30.9366 22.6541 30.5596 22.2627C29.9983 21.6799 29.3922 21.1361 28.748 20.6299L29.498 19.6758L29.9824 19.0576C30.6947 19.6174 31.3706 20.2225 32 20.876C32.6858 20.1639 33.4247 19.5113 34.2051 18.9131L35.4219 20.5ZM24.1123 15.6816C25.7862 16.378 27.4018 17.2279 28.8887 18.2529L28.3223 19.0762L28.3213 19.0752L27.7539 19.8994C26.398 18.9646 24.9086 18.178 23.3447 17.5273L24.1123 15.6816ZM41.3828 17.249C39.6533 17.913 38.0075 18.7278 36.5146 19.7197L35.4082 18.0547C37.0432 16.9683 38.8239 16.09 40.666 15.3828L41.3828 17.249ZM10.6504 13.0049C11.8192 13.0243 12.9843 13.0977 14.1436 13.2207L13.9336 15.208C12.6322 15.0699 11.3227 15.0003 10.0098 15V17.7168L9.00977 17.7158H8.00977L8.01074 14.7959C8.05169 14.3925 8.21354 14.0249 8.45801 13.7285L9.75293 14.7959H9.86719L9.44629 14.166L8.8916 13.3359C9.20889 13.1241 9.58979 13 10 13L10.6504 13.0049ZM16.2012 13.4932C17.5664 13.711 18.9212 14 20.2607 14.3594C21.1271 14.5994 21.9919 14.8751 22.8467 15.1875L22.5195 16.0869L22.1611 17.0654C21.3643 16.7741 20.5554 16.5158 19.7422 16.29C18.4693 15.9486 17.1828 15.6746 15.8867 15.4678L16.0459 14.4717L16.2012 13.4932ZM44.0273 14.2881C44.0108 14.5233 44 14.7606 44 15C44 15.4565 44.0335 15.9054 44.0928 16.3457C43.6226 16.4807 43.1546 16.6252 42.6904 16.7803L42.0566 14.8848C42.7098 14.6665 43.368 14.4685 44.0273 14.2881ZM9.99805 14.999L10 14.998L10.001 14.9971L9.99512 14.9961L9.99805 14.999Z"
            fill="#BBBBBB"
            fill-opacity="0.55"
          />
          <Path
            d="M10 13C13.469 13 16.9118 13.461 20.2607 14.3594C24.576 15.5551 28.8596 17.6154 32 20.876C35.2171 17.5357 39.5925 15.4975 44.0273 14.2861C44.0107 14.522 44 14.7599 44 15C44 20.5228 48.4772 25 54 25C54.685 25 55.3537 24.93 56 24.7988V44C55.9997 45.1043 55.1043 45.9999 54 46C52.6959 46 51.3916 46.0698 50.1025 46.21C45.8921 46.7018 41.61 47.8613 38 50.1465C36.1432 51.322 34.3072 53 32 53C29.6927 53 27.8572 51.3216 26 50.1465C22.6551 48.0302 18.6999 46.8889 14.8115 46.3213C13.2151 46.1052 11.6098 46.014 10 46.001C8.91111 46.001 8.00028 45.0898 8 44.001L8.01074 14.7959C8.11322 13.7874 8.96451 13 10 13ZM49.1826 34.1279C43.1679 34.7333 37.1777 36.4679 32 39.6338C26.823 36.4683 20.8312 34.7332 14.8174 34.1279C14.3781 34.0837 14.0003 34.4325 14 34.874V39.3906C14.0004 39.7794 14.2962 40.104 14.6826 40.1475C20.8773 40.8419 27.2068 42.9061 32 47.0166C36.7958 42.904 43.1187 40.8424 49.3174 40.1475C49.7038 40.104 49.9996 39.7794 50 39.3906V34.874C49.9997 34.4325 49.6219 34.0838 49.1826 34.1279Z"
            fill="#02807A"
          />
          <Circle cx="54" cy="15" r="8" fill="#FFD966" />
          <Path
            d="M49.2502 15.5L52.2503 18.5L58.3614 12.5"
            stroke="#B78900"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </Svg>
      </View>

      <ThemeText variant="h3" style={[styles.title, { color: colors.text.primary }]}>
        {t("import.pocket.success.title")}
      </ThemeText>

      <ThemeText variant="body1" style={[styles.description, { color: colors.text.secondary }]}>
        {t("import.pocket.success.description")}
      </ThemeText>

      <ThemeText variant="body2" style={[styles.note, { color: colors.text.secondary }]}>
        {t("import.pocket.success.note")}
      </ThemeText>

      <View style={styles.buttonContainer}>
        <Button
          variant="primary"
          size="large"
          onPress={handleClose}
          buttonStyle={styles.primaryButton}
          title={t("import.pocket.done")}
        />
      </View>
    </ThemeView>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "explanation":
        return renderExplanationStep();
      case "webview":
        return renderWebViewStep();
      case "success":
        return renderSuccessStep();
      default:
        return renderExplanationStep();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.default }]}>
      <View style={[styles.modalContainer, { backgroundColor: colors.background.default }]}>
        {/* Modal indicator bar */}
        <View style={styles.topBar}>
          <View style={[styles.topBarIndicator, { backgroundColor: colors.divider }]} />
        </View>

        {/* Step content */}
        <View style={styles.content}>{renderCurrentStep()}</View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 8,
  },
  topBarIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    marginRight: 24, // Offset for close button
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    textAlign: "center",
    marginBottom: 16,
  },
  description: {
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  bulletPoints: {
    alignSelf: "stretch",
    marginBottom: 24,
  },
  bulletPoint: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  bulletText: {
    marginLeft: 12,
    flex: 1,
  },
  note: {
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 20,
    fontSize: 14,
  },
  buttonContainer: {
    alignSelf: "stretch",
    gap: 12,
  },
  primaryButton: {
    width: "100%",
  },
  secondaryButton: {
    width: "100%",
  },
  skipButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  skipText: {
    textAlign: "center",
  },
  webViewContainer: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
});

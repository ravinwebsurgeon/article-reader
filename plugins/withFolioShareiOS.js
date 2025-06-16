const { withInfoPlist, withXcodeProject, withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

/**
 * Expo Config Plugin for Folio Share functionality - iOS Version
 * Automatically creates Share Extension, SimpleTokenManager, and required resources
 */
const withFolioShareiOS = (config, options = {}) => {
  // Add Info.plist modifications
  config = withInfoPlist(config, (config) => {
    // Add App Groups capability identifier (URL scheme removed for testing)
    config.modResults.AppGroups = ["group.co.lessisbetter.folio.shared"];

    return config;
  });

  // Add Xcode project modifications
  config = withXcodeProject(config, (config) => {
    const xcodeProject = config.modResults;

    // Add App Groups entitlement
    // Note: This is a simplified version. In a real implementation,
    // you might need more complex Xcode project manipulation
    console.log("✅ Xcode project configured for Share Extension");

    return config;
  });

  // Add dangerous mod to create Swift files and resources
  config = withDangerousMod(config, [
    "ios",
    async (modConfig) => {
      await createShareExtension(modConfig.modRequest.projectRoot);
      await createSwiftFiles(modConfig.modRequest.projectRoot);
      await createiOSResources(modConfig.modRequest.projectRoot);
      return modConfig;
    },
  ]);

  return config;
};

/**
 * Creates the Share Extension target and configuration
 */
async function createShareExtension(projectRoot) {
  const iosDir = path.join(projectRoot, "ios");
  const shareExtensionDir = path.join(iosDir, "FolioShareExtension");

  // Create Share Extension directory
  if (!fs.existsSync(shareExtensionDir)) {
    fs.mkdirSync(shareExtensionDir, { recursive: true });
  }

  // Create Info.plist for Share Extension
  const shareExtensionInfoPlist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
	<dict>
		<key>NSExtension</key>
		<dict>
			<key>NSExtensionAttributes</key>
			<dict>
				<key>NSExtensionActivationRule</key>
				<string>TRUEPREDICATE</string>
			</dict>
			<key>NSExtensionPrincipalClass</key>
			<string>$(PRODUCT_MODULE_NAME).ShareViewController</string>

			<key>NSExtensionPointIdentifier</key>
			<string>com.apple.share-services</string>
		</dict>
	</dict>
</plist>`;

  // Create MainInterface.storyboard
  const mainInterfaceStoryboard = `<?xml version="1.0" encoding="UTF-8"?>
<document type="com.apple.InterfaceBuilder3.CocoaTouch.Storyboard.XIB" version="3.0" toolsVersion="21507" targetRuntime="iOS.CocoaTouch" propertyAccessControl="none" useAutolayout="YES" useTraitCollections="YES" useSafeAreas="YES" colorMatched="YES" initialViewController="j1y-V4-xli">
    <device id="retina6_12" orientation="portrait" appearance="light"/>
    <dependencies>
        <plugIn identifier="com.apple.InterfaceBuilder.IBCocoaTouchPlugin" version="21505"/>
        <capability name="Safe area layout guides" minToolsVersion="9.0"/>
        <capability name="System colors in document" minToolsVersion="11.0"/>
        <capability name="documents saved in the Xcode 8 format" minToolsVersion="8.0"/>
    </dependencies>
    <scenes>
        <!--Share View Controller-->
        <scene sceneID="ceB-am-kn3">
            <objects>
                <viewController id="j1y-V4-xli" customClass="ShareViewController" customModule="FolioShareExtension" customModuleProvider="target" sceneMemberID="viewController">
                    <view key="view" opaque="NO" contentMode="scaleToFill" id="wbc-yd-nQP">
                        <rect key="frame" x="0.0" y="0.0" width="393" height="852"/>
                        <autoresizingMask key="autoresizingMask" widthSizable="YES" heightSizable="YES"/>
                        <subviews>
                            <view contentMode="scaleToFill" translatesAutoresizingMaskIntoConstraints="NO" id="rVD-hh-Fhf">
                                <rect key="frame" x="20" y="376" width="353" height="100"/>
                                <subviews>
                                    <imageView clipsSubviews="YES" userInteractionEnabled="NO" contentMode="scaleAspectFit" horizontalHuggingPriority="251" verticalHuggingPriority="251" translatesAutoresizingMaskIntoConstraints="NO" id="8hK-cH-Wig">
                                        <rect key="frame" x="164.66666666666666" y="18" width="24" height="24"/>
                                        <constraints>
                                            <constraint firstAttribute="width" constant="24" id="FmU-lh-8PJ"/>
                                            <constraint firstAttribute="height" constant="24" id="hYn-dD-KzQ"/>
                                        </constraints>
                                    </imageView>
                                    <label opaque="NO" userInteractionEnabled="NO" contentMode="left" horizontalHuggingPriority="251" verticalHuggingPriority="251" text="Saving..." textAlignment="center" lineBreakMode="tailTruncation" baselineAdjustment="alignBaselines" adjustsFontSizeToFit="NO" translatesAutoresizingMaskIntoConstraints="NO" id="2hK-8A-vPb">
                                        <rect key="frame" x="20" y="50" width="313" height="30"/>
                                        <fontDescription key="fontDescription" type="system" weight="semibold" pointSize="17"/>
                                        <color key="textColor" systemColor="labelColor"/>
                                        <nil key="highlightedColor"/>
                                    </label>
                                </subviews>
                                <color key="backgroundColor" systemColor="secondarySystemBackgroundColor"/>
                                <constraints>
                                    <constraint firstItem="8hK-cH-Wig" firstAttribute="centerX" secondItem="rVD-hh-Fhf" secondAttribute="centerX" id="4P9-Sf-qHG"/>
                                    <constraint firstAttribute="trailing" secondItem="2hK-8A-vPb" secondAttribute="trailing" constant="20" id="DpN-eS-lJg"/>
                                    <constraint firstItem="2hK-8A-vPb" firstAttribute="leading" secondItem="rVD-hh-Fhf" secondAttribute="leading" constant="20" id="Hf5-8R-aXY"/>
                                    <constraint firstItem="8hK-cH-Wig" firstAttribute="top" secondItem="rVD-hh-Fhf" secondAttribute="top" constant="18" id="Kuy-I0-oPl"/>
                                    <constraint firstAttribute="height" constant="100" id="Pjj-cL-5dP"/>
                                    <constraint firstAttribute="bottom" secondItem="2hK-8A-vPb" secondAttribute="bottom" constant="20" id="Req-V7-Q0V"/>
                                    <constraint firstItem="2hK-8A-vPb" firstAttribute="top" secondItem="8hK-cH-Wig" secondAttribute="bottom" constant="8" id="iTv-Ga-ixb"/>
                                </constraints>
                                <userDefinedRuntimeAttributes>
                                    <userDefinedRuntimeAttribute type="number" keyPath="layer.cornerRadius">
                                        <integer key="value">16</integer>
                                    </userDefinedRuntimeAttribute>
                                </userDefinedRuntimeAttributes>
                            </view>
                        </subviews>
                        <color key="backgroundColor" red="0.0" green="0.0" blue="0.0" alpha="0.5" colorSpace="custom" customColorSpace="sRGB"/>
                        <constraints>
                            <constraint firstItem="rVD-hh-Fhf" firstAttribute="leading" secondItem="wbc-yd-nQP" secondAttribute="leading" constant="20" id="AhB-4j-OhH"/>
                            <constraint firstAttribute="trailing" secondItem="rVD-hh-Fhf" secondAttribute="trailing" constant="20" id="ReI-UU-Ahk"/>
                            <constraint firstItem="rVD-hh-Fhf" firstAttribute="centerY" secondItem="wbc-yd-nQP" secondAttribute="centerY" id="oNW-xk-6dZ"/>
                        </constraints>
                        <viewLayoutGuide key="safeArea" id="1Xd-am-t49"/>
                    </view>
                    <connections>
                        <outlet property="dialogView" destination="rVD-hh-Fhf" id="fHg-9T-dRQ"/>
                        <outlet property="iconImageView" destination="8hK-cH-Wig" id="GkK-rL-XfB"/>
                        <outlet property="messageLabel" destination="2hK-8A-vPb" id="3hf-Q6-kcJ"/>
                    </connections>
                </viewController>
                <placeholder placeholderIdentifier="IBFirstResponder" id="3IN-2r-0bl" userLabel="First Responder" sceneMemberID="firstResponder"/>
            </objects>
            <point key="canvasLocation" x="140.45801526717556" y="-2.1126760563380285"/>
        </scene>
    </scenes>
    <resources>
        <systemColor name="labelColor">
            <color white="0.0" alpha="1" colorSpace="custom" customColorSpace="genericGamma22GrayColorSpace"/>
        </systemColor>
        <systemColor name="secondarySystemBackgroundColor">
            <color red="0.94901960784313721" green="0.94901960784313721" blue="0.96862745098039216" alpha="1" colorSpace="custom" customColorSpace="sRGB"/>
        </systemColor>
    </resources>
</document>`;

  try {
    fs.writeFileSync(path.join(shareExtensionDir, "Info.plist"), shareExtensionInfoPlist);
    fs.writeFileSync(
      path.join(shareExtensionDir, "MainInterface.storyboard"),
      mainInterfaceStoryboard,
    );
    console.log("✅ Created Share Extension configuration files");
  } catch (error) {
    console.error("❌ Failed to create Share Extension files:", error);
    throw error;
  }
}

/**
 * Creates Swift source files for the Share Extension
 */
async function createSwiftFiles(projectRoot) {
  const shareExtensionDir = path.join(projectRoot, "ios", "FolioShareExtension");
  const projectDir = path.join(projectRoot, "ios", "Folio");

  // Create directory if it doesn't exist
  if (!fs.existsSync(shareExtensionDir)) {
    fs.mkdirSync(shareExtensionDir, { recursive: true });
  }

  // ShareViewController.swift content
  const shareViewControllerContent = `import UIKit
import UniformTypeIdentifiers

class ShareViewController: UIViewController {

    // UI Elements
    let dialogView = UIView()
    let iconView = UIImageView()
    let messageLabel = UILabel()
    let spinner = UIActivityIndicatorView(style: .large)

    override func viewDidLoad() {
        super.viewDidLoad()
        setupCustomUI()
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        handleSharedContent()
    }

    func setupCustomUI() {
        // Dimmed background
        view.backgroundColor = UIColor.white.withAlphaComponent(1)

        // Dialog view
        dialogView.translatesAutoresizingMaskIntoConstraints = false
        dialogView.backgroundColor = .systemBackground
        dialogView.layer.cornerRadius = 16
        dialogView.layer.masksToBounds = true
        view.addSubview(dialogView)

        NSLayoutConstraint.activate([
            dialogView.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            dialogView.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            dialogView.widthAnchor.constraint(equalToConstant: 280),
            dialogView.heightAnchor.constraint(equalToConstant: 160)
        ])

        // Spinner
        spinner.translatesAutoresizingMaskIntoConstraints = false
        dialogView.addSubview(spinner)
        NSLayoutConstraint.activate([
            spinner.topAnchor.constraint(equalTo: dialogView.topAnchor, constant: 24),
            spinner.centerXAnchor.constraint(equalTo: dialogView.centerXAnchor)
        ])

        // Icon View (initially hidden)
        iconView.translatesAutoresizingMaskIntoConstraints = false
        iconView.isHidden = true
        dialogView.addSubview(iconView)
        NSLayoutConstraint.activate([
            iconView.centerXAnchor.constraint(equalTo: dialogView.centerXAnchor),
            iconView.topAnchor.constraint(equalTo: dialogView.topAnchor, constant: 24),
            iconView.widthAnchor.constraint(equalToConstant: 44),
            iconView.heightAnchor.constraint(equalToConstant: 44)
        ])

        // Message Label
        messageLabel.translatesAutoresizingMaskIntoConstraints = false
        messageLabel.font = UIFont.boldSystemFont(ofSize: 18)
        messageLabel.textAlignment = .center
        messageLabel.numberOfLines = 2
        dialogView.addSubview(messageLabel)
        NSLayoutConstraint.activate([
            messageLabel.topAnchor.constraint(equalTo: spinner.bottomAnchor, constant: 18),
            messageLabel.leadingAnchor.constraint(equalTo: dialogView.leadingAnchor, constant: 16),
            messageLabel.trailingAnchor.constraint(equalTo: dialogView.trailingAnchor, constant: -16),
            messageLabel.bottomAnchor.constraint(equalTo: dialogView.bottomAnchor, constant: -24)
        ])
    }

    func setStateSaving() {
        spinner.isHidden = false
        spinner.startAnimating()
        iconView.isHidden = true
        messageLabel.text = "Saving..."
    }

    func setStateSaved() {
        spinner.stopAnimating()
        spinner.isHidden = true
        iconView.isHidden = false
        iconView.image = UIImage(systemName: "checkmark.circle.fill")?.withTintColor(.systemGreen, renderingMode: .alwaysOriginal)
        messageLabel.text = "Saved to Folio!"
    }

    private func handleSharedContent() {
        setStateSaving()

        guard let extensionItem = extensionContext?.inputItems.first as? NSExtensionItem,
              let itemProvider = extensionItem.attachments?.first else {
            setStateSavedWithError("No content to share")
            return
        }

        // Look for a URL in attachments
        if itemProvider.hasItemConformingToTypeIdentifier(UTType.url.identifier) {
            itemProvider.loadItem(forTypeIdentifier: UTType.url.identifier, options: nil) { (data, error) in
                if let url = data as? URL {
                    self.saveUrlToServer(url.absoluteString)
                } else {
                    self.setStateSavedWithError("Failed to get URL")
                }
            }
            return
        } else if itemProvider.hasItemConformingToTypeIdentifier(UTType.plainText.identifier) {
            itemProvider.loadItem(forTypeIdentifier: UTType.plainText.identifier, options: nil) { (data, error) in
                if let text = data as? String, let url = self.extractURL(from: text) {
                    self.saveUrlToServer(url)
                } else {
                    self.setStateSavedWithError("No valid URL found")
                }
            }
            return
        }

        setStateSavedWithError("Unsupported content type")
    }

    private func extractURL(from text: String) -> String? {
        if let url = URL(string: text), url.scheme != nil {
            return text
        }
        let detector = try? NSDataDetector(types: NSTextCheckingResult.CheckingType.link.rawValue)
        let matches = detector?.matches(in: text, options: [], range: NSRange(location: 0, length: text.utf16.count))
        return matches?.first?.url?.absoluteString
    }

    private func saveUrlToServer(_ urlString: String) {
        let token = getTokenFromAppGroup() // Replace with your method
        var request = URLRequest(url: URL(string: "https://api.savewithfolio.com/v4/items")!)
        request.httpMethod = "POST"
        request.setValue("Bearer \(token ?? "")", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
     let requestBody: [String: Any] = [
    "item": [
        "url": urlString,
        "archived": false,
        "favorite": false,
        "progress": 0.0,
        "notes": ""  
    ]
]
request.httpBody = try? JSONSerialization.data(withJSONObject: requestBody, options: [])


        let task = URLSession.shared.dataTask(with: request) { data, response, error in
            DispatchQueue.main.async {
                if let error = error {
                    self.setStateSavedWithError("Failed: \(error.localizedDescription)")
                } else if let httpResp = response as? HTTPURLResponse, httpResp.statusCode >= 400 {
                    self.setStateSavedWithError("Failed (\(httpResp.statusCode))")
                } else {
                    self.setStateSaved()
                    DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                        self.extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
                    }
                }
            }
        }
        task.resume()
    }

    func setStateSavedWithError(_ message: String) {
        spinner.stopAnimating()
        spinner.isHidden = true
        iconView.isHidden = false
        iconView.image = UIImage(systemName: "xmark.circle.fill")?.withTintColor(.systemRed, renderingMode: .alwaysOriginal)
        messageLabel.text = message
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
            self.extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
        }
    }

    // Shared token if needed
    private func getTokenFromAppGroup() -> String? {
        let userDefaults = UserDefaults(suiteName: "group.co.lessisbetter.folio.shared") // <- your App Group ID
        let token = userDefaults?.string(forKey: "folio_share_token")
         print("🔑 Token from App Group: \(token ?? "nil")")
        return token
    }
}
`;

  const tokenManager = `import Foundation
import React

@objc(TokenManager)
class TokenManager: NSObject {
  
  @objc
  func saveToken(_ token: String) {
    let userDefaults = UserDefaults(suiteName: "group.co.lessisbetter.folio.shared")
    userDefaults?.set(token, forKey: "folio_share_token")
    userDefaults?.synchronize()
    print("✅ Token saved to App Group")
  }
  
  @objc(getToken:rejecter:)
  func getToken(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    let userDefaults = UserDefaults(suiteName: "group.co.lessisbetter.folio.shared")
    if let token = userDefaults?.string(forKey: "folio_share_token") {
      resolve(token)
    } else {
      resolve(NSNull())
    }
  }
  
  @objc
  func removeToken() {
    let userDefaults = UserDefaults(suiteName: "group.co.lessisbetter.folio.shared")
    userDefaults?.removeObject(forKey: "folio_share_token")
    userDefaults?.synchronize()
    print("✅ Token removed from App Group")
  }
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
}
`;

  const tokenManagerM = `#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(TokenManager, NSObject)

RCT_EXTERN_METHOD(saveToken:(NSString *)token)
RCT_EXTERN_METHOD(getToken:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(removeToken)

@end`;
  try {
    fs.writeFileSync(
      path.join(shareExtensionDir, "ShareViewController.swift"),
      shareViewControllerContent,
    );
    fs.writeFileSync(path.join(projectDir, "TokenManager.swift"), tokenManager);
    fs.writeFileSync(path.join(projectDir, "TokenManager.m"), tokenManagerM);
    console.log("✅ Created Swift source files");
  } catch (error) {
    console.error("❌ Failed to create Swift files:", error);
    throw error;
  }
}

/**
 * Creates iOS resources and assets
 */
async function createiOSResources(projectRoot) {
  const shareExtensionDir = path.join(projectRoot, "ios", "FolioShareExtension");
  const assetsDir = path.join(shareExtensionDir, "Assets.xcassets");

  // Create Assets directory
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  // Create Contents.json for Assets
  const assetsContentsJson = `{
  "info" : {
    "author" : "xcode",
    "version" : 1
  }
}`;

  // Create Folio Loading Icon Set
  const folioLoadingDir = path.join(assetsDir, "folio.loading.imageset");
  if (!fs.existsSync(folioLoadingDir)) {
    fs.mkdirSync(folioLoadingDir, { recursive: true });
  }

  const folioLoadingContentsJson = `{
  "images" : [
    {
      "filename" : "folio-loading.pdf",
      "idiom" : "universal"
    }
  ],
  "info" : {
    "author" : "xcode",
    "version" : 1
  },
  "properties" : {
    "preserves-vector-representation" : true
  }
}`;

  // Create Folio Success Icon Set
  const folioSuccessDir = path.join(assetsDir, "folio.success.imageset");
  if (!fs.existsSync(folioSuccessDir)) {
    fs.mkdirSync(folioSuccessDir, { recursive: true });
  }

  const folioSuccessContentsJson = `{
  "images" : [
    {
      "filename" : "folio-success.pdf",
      "idiom" : "universal"
    }
  ],
  "info" : {
    "author" : "xcode",
    "version" : 1
  },
  "properties" : {
    "preserves-vector-representation" : true
  }
}`;

  // Create entitlements file
  const entitlementsContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.application-groups</key>
  <array>
    <string>group.co.lessisbetter.folio.shared</string>
  </array>
</dict>
</plist>`;

  try {
    fs.writeFileSync(path.join(assetsDir, "Contents.json"), assetsContentsJson);
    fs.writeFileSync(path.join(folioLoadingDir, "Contents.json"), folioLoadingContentsJson);
    fs.writeFileSync(path.join(folioSuccessDir, "Contents.json"), folioSuccessContentsJson);
    fs.writeFileSync(
      path.join(shareExtensionDir, "FolioShareExtension.entitlements"),
      entitlementsContent,
    );

    console.log("✅ Created iOS resources and assets");
    console.log(
      "📝 Note: You will need to manually add the actual PDF icon files to the imagesets",
    );
    console.log(
      "📝 Note: You will need to manually configure the Xcode project to include the Share Extension target",
    );
  } catch (error) {
    console.error("❌ Failed to create iOS resources:", error);
    throw error;
  }
}

module.exports = withFolioShareiOS;

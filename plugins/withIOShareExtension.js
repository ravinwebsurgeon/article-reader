const {
  withXcodeProject,
  withEntitlementsPlist,
  withDangerousMod,
} = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const SHARE_EXTENSION_NAME = "FolioShareExtension";
const APP_GROUP_IDENTIFIER = "group.co.lessisbetter.folio";

function withIOSShareExtension(config) {
  // First add app group to main app
  config = withEntitlementsPlist(config, (config) => {
    if (!config.modResults["com.apple.security.application-groups"]) {
      config.modResults["com.apple.security.application-groups"] = [];
    }
    config.modResults["com.apple.security.application-groups"].push(APP_GROUP_IDENTIFIER);
    return config;
  });

  // Then create the share extension
  config = withXcodeProject(config, (config) => {
    const project = config.modResults;
    const targetName = SHARE_EXTENSION_NAME;
    const projectRoot = config.modRequest.projectRoot;
    const iosPath = path.join(projectRoot, "ios");
    const extensionPath = path.join(iosPath, targetName);

    // Check if extension already exists
    const existingTarget = project.pbxTargetByName(targetName);
    if (existingTarget) {
      console.log(`Share extension ${targetName} already exists`);
      return config;
    }

    // Ensure we have required properties
    if (!config.ios?.bundleIdentifier) {
      throw new Error("iOS bundleIdentifier is required in app config");
    }

    // Create extension directory if it doesn't exist
    if (!fs.existsSync(extensionPath)) {
      fs.mkdirSync(extensionPath, { recursive: true });
    }

    // Create files (moved to withDangerousMod to ensure proper order)
    return config;
  });

  // Create share extension files after Xcode project is ready
  config = withDangerousMod(config, [
    "ios",
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const iosPath = path.join(projectRoot, "ios");
      const extensionPath = path.join(iosPath, SHARE_EXTENSION_NAME);

      // Create extension directory if it doesn't exist
      if (!fs.existsSync(extensionPath)) {
        fs.mkdirSync(extensionPath, { recursive: true });
      }

      // Create Info.plist
      const infoPlist = `<?xml version="1.0" encoding="UTF-8"?>
  <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
  <plist version="1.0">
  <dict>
      <key>CFBundleDevelopmentRegion</key>
      <string>en</string>
      <key>CFBundleDisplayName</key>
      <string>Folio</string>
      <key>CFBundleExecutable</key>
      <string>$(EXECUTABLE_NAME)</string>
      <key>CFBundleIdentifier</key>
      <string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
      <key>CFBundleInfoDictionaryVersion</key>
      <string>6.0</string>
      <key>CFBundleName</key>
      <string>$(PRODUCT_NAME)</string>
      <key>CFBundlePackageType</key>
      <string>XPC!</string>
      <key>CFBundleShortVersionString</key>
      <string>1.0</string>
      <key>CFBundleVersion</key>
      <string>1</string>
      <key>NSExtension</key>
      <dict>
          <key>NSExtensionAttributes</key>
          <dict>
              <key>NSExtensionActivationRule</key>
              <dict>
                  <key>NSExtensionActivationSupportsWebPageWithMaxCount</key>
                  <integer>1</integer>
                  <key>NSExtensionActivationSupportsWebURLWithMaxCount</key>
                  <integer>1</integer>
                  <key>NSExtensionActivationSupportsText</key>
                  <true/>
              </dict>
          </dict>
          <key>NSExtensionMainStoryboard</key>
          <string>MainInterface</string>
          <key>NSExtensionPointIdentifier</key>
          <string>com.apple.share-services</string>
      </dict>
  </dict>
  </plist>`;

      fs.writeFileSync(path.join(extensionPath, "Info.plist"), infoPlist);

      // Create Entitlements
      const entitlements = `<?xml version="1.0" encoding="UTF-8"?>
  <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
  <plist version="1.0">
  <dict>
      <key>com.apple.security.application-groups</key>
      <array>
          <string>${APP_GROUP_IDENTIFIER}</string>
      </array>
  </dict>
  </plist>`;

      fs.writeFileSync(
        path.join(extensionPath, `${SHARE_EXTENSION_NAME}.entitlements`),
        entitlements,
      );

      // Create ShareViewController.swift
      const shareViewController = `import UIKit
  import Social
  import MobileCoreServices
  
  class ShareViewController: SLComposeServiceViewController {
      override func isContentValid() -> Bool {
          return true
      }
  
      override func didSelectPost() {
          guard let extensionItem = extensionContext?.inputItems.first as? NSExtensionItem,
                let itemProvider = extensionItem.attachments?.first else {
              self.extensionContext?.completeRequest(returningItems: nil, completionHandler: nil)
              return
          }
  
          if itemProvider.hasItemConformingToTypeIdentifier(kUTTypeURL as String) {
              itemProvider.loadItem(forTypeIdentifier: kUTTypeURL as String, options: nil) { [weak self] (item, error) in
                  if let url = item as? URL {
                      self?.saveUrl(url.absoluteString)
                  }
              }
          } else if itemProvider.hasItemConformingToTypeIdentifier(kUTTypeText as String) {
              itemProvider.loadItem(forTypeIdentifier: kUTTypeText as String, options: nil) { [weak self] (item, error) in
                  if let text = item as? String {
                      self?.saveUrl(text)
                  }
              }
          }
      }
  
      private func saveUrl(_ urlString: String) {
          guard let userDefaults = UserDefaults(suiteName: "${APP_GROUP_IDENTIFIER}"),
                let token = userDefaults.string(forKey: "auth_token") else {
              return
          }
  
          guard let url = URL(string: "https://api.savewithfolio.com/v4/items") else { return }
  
          var request = URLRequest(url: url)
          request.httpMethod = "POST"
          request.setValue("Bearer \\(token)", forHTTPHeaderField: "Authorization")
          request.setValue("application/json", forHTTPHeaderField: "Content-Type")
  
          let payload = [
              "item": [
                  "url": urlString,
                  "archived": false,
                  "favorite": false
              ]
          ]
  
          do {
              request.httpBody = try JSONSerialization.data(withJSONObject: payload)
          } catch {
              return
          }
  
          URLSession.shared.dataTask(with: request) { [weak self] _, _, _ in
              self?.extensionContext?.completeRequest(returningItems: nil, completionHandler: nil)
          }.resume()
      }
  
      override func configurationItems() -> [Any]! {
          return []
      }
  }`;

      fs.writeFileSync(path.join(extensionPath, "ShareViewController.swift"), shareViewController);

      // Create MainInterface.storyboard
      const storyboard = `<?xml version="1.0" encoding="UTF-8"?>
  <document type="com.apple.InterfaceBuilder3.CocoaTouch.Storyboard.XIB" version="3.0" toolsVersion="21701" targetRuntime="iOS.CocoaTouch" propertyAccessControl="none" useAutolayout="YES" useTraitCollections="YES" useSafeAreas="YES" colorMatched="YES" initialViewController="j1y-V4-xli">
      <device id="retina6_1" orientation="portrait" appearance="light"/>
      <dependencies>
          <deployment identifier="iOS"/>
          <plugIn identifier="com.apple.InterfaceBuilder.IBCocoaTouchPlugin" version="21678"/>
          <capability name="Safe area layout guides" minToolsVersion="9.0"/>
          <capability name="documents saved in the Xcode 8 format" minToolsVersion="8.0"/>
      </dependencies>
      <scenes>
          <!--Share View Controller-->
          <scene sceneID="ceB-am-kn3">
              <objects>
                  <viewController id="j1y-V4-xli" customClass="ShareViewController" customModule="${SHARE_EXTENSION_NAME}" customModuleProvider="target" sceneMemberID="viewController">
                      <view key="view" opaque="NO" contentMode="scaleToFill" id="wbc-yd-nQP">
                          <rect key="frame" x="0.0" y="0.0" width="414" height="896"/>
                          <autoresizingMask key="autoresizingMask" widthSizable="YES" heightSizable="YES"/>
                          <viewLayoutGuide key="safeArea" id="1Xd-am-t49"/>
                          <color key="backgroundColor" systemColor="systemBackgroundColor"/>
                      </view>
                  </viewController>
                  <placeholder placeholderIdentifier="IBFirstResponder" id="CEy-Cv-SGf" userLabel="First Responder" sceneMemberID="firstResponder"/>
              </objects>
              <point key="canvasLocation" x="138" y="134"/>
          </scene>
      </scenes>
  </document>`;

      fs.writeFileSync(path.join(extensionPath, "MainInterface.storyboard"), storyboard);

      // Create Bridging Header
      const bridgingHeader = `//
  //  Use this file to import your target's public headers that you would like to expose to Swift.
  //`;

      fs.writeFileSync(
        path.join(extensionPath, `${SHARE_EXTENSION_NAME}-Bridging-Header.h`),
        bridgingHeader,
      );

      return config;
    },
  ]);

  return config;
}

module.exports = withIOSShareExtension;

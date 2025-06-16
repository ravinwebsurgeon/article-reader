const { withDangerousMod, withXcodeProject } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const APP_GROUP_IDENTIFIER = "group.co.lessisbetter.folio";

function withIOSSharedStorage(config) {
  // Add native module files first
  config = withDangerousMod(config, [
    "ios",
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const iosPath = path.join(projectRoot, "ios");
      // Get project name from app.json/app.config.js or use default
      const projectName = config.modRequest.projectName || config.name || "folio";
      const projectPath = path.join(iosPath, projectName);

      // Ensure the project directory exists
      if (!fs.existsSync(projectPath)) {
        console.log(`Project path ${projectPath} does not exist, skipping file creation`);
        return config;
      }

      console.log(`Creating SharedStorage files in: ${projectPath}`);

      // Create SharedStorage.swift
      const sharedStorageSwift = `import Foundation
import React
 
@objc(SharedStorage)
class SharedStorage: NSObject {
    private let appGroupIdentifier = "${APP_GROUP_IDENTIFIER}"
    @objc
    func setItem(_ key: String, value: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        guard let userDefaults = UserDefaults(suiteName: appGroupIdentifier) else {
            rejecter("SHARED_STORAGE_ERROR", "Failed to access shared storage", nil)
            return
        }
        userDefaults.set(value, forKey: key)
        userDefaults.synchronize()
        // Also store in standard UserDefaults for backwards compatibility
        UserDefaults.standard.set(value, forKey: key)
        UserDefaults.standard.synchronize()
        resolver(true)
    }
    @objc
    func getItem(_ key: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        guard let userDefaults = UserDefaults(suiteName: appGroupIdentifier) else {
            rejecter("SHARED_STORAGE_ERROR", "Failed to access shared storage", nil)
            return
        }
        let value = userDefaults.string(forKey: key)
        resolver(value)
    }
    @objc
    func removeItem(_ key: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        guard let userDefaults = UserDefaults(suiteName: appGroupIdentifier) else {
            rejecter("SHARED_STORAGE_ERROR", "Failed to access shared storage", nil)
            return
        }
        userDefaults.removeObject(forKey: key)
        userDefaults.synchronize()
        // Also remove from standard UserDefaults
        UserDefaults.standard.removeObject(forKey: key)
        UserDefaults.standard.synchronize()
        resolver(true)
    }
    @objc
    static func requiresMainQueueSetup() -> Bool {
        return false
    }
}`;
      try {
        fs.writeFileSync(path.join(projectPath, "SharedStorage.swift"), sharedStorageSwift);
        console.log("Created SharedStorage.swift");
      } catch (error) {
        console.error("Failed to create SharedStorage.swift:", error);
      }

      // Create SharedStorage.m (Objective-C bridge)
      const sharedStorageM = `#import <React/RCTBridgeModule.h>
 
@interface RCT_EXTERN_MODULE(SharedStorage, NSObject)
 
RCT_EXTERN_METHOD(setItem:(NSString *)key
                  value:(NSString *)value
                  resolver:(RCTPromiseResolveBlock)resolver
                  rejecter:(RCTPromiseRejectBlock)rejecter)
 
RCT_EXTERN_METHOD(getItem:(NSString *)key
                  resolver:(RCTPromiseResolveBlock)resolver
                  rejecter:(RCTPromiseRejectBlock)rejecter)
 
RCT_EXTERN_METHOD(removeItem:(NSString *)key
                  resolver:(RCTPromiseResolveBlock)resolver
                  rejecter:(RCTPromiseRejectBlock)rejecter)
 
@end`;
      try {
        fs.writeFileSync(path.join(projectPath, "SharedStorage.m"), sharedStorageM);
        console.log("Created SharedStorage.m");
      } catch (error) {
        console.error("Failed to create SharedStorage.m:", error);
      }

      return config;
    },
  ]);

  // Add files to Xcode project with better error handling
  config = withXcodeProject(config, (config) => {
    try {
      const project = config.modResults;
      if (!project) {
        console.log("No Xcode project found, skipping file addition to project");
        return config;
      }

      const projectName = config.modRequest.projectName || config.name || "folio";
      console.log(`Adding files to Xcode project: ${projectName}`);
      // Find the main app group
      const group = project.pbxGroupByName(projectName);
      if (group) {
        console.log(`Found project group: ${projectName}`);
        // Add Swift file
        const swiftFileRef = project.addSourceFile(
          `${projectName}/SharedStorage.swift`,
          group.uuid,
        );
        console.log("Added SharedStorage.swift to project");
        // Add Objective-C bridge file
        const objcFileRef = project.addSourceFile(`${projectName}/SharedStorage.m`, group.uuid);
        console.log("Added SharedStorage.m to project");
      } else {
        console.log(`Could not find project group: ${projectName}`);
        // Try to find any group that might work
        const groups = project.hash.project.objects.PBXGroup;
        console.log(
          "Available groups:",
          Object.keys(groups)
            .map((key) => groups[key].name)
            .filter(Boolean),
        );
      }
    } catch (error) {
      console.error("Error modifying Xcode project:", error);
    }

    return config;
  });

  return config;
}
module.exports = withIOSSharedStorage;

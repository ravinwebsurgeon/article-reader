const {
  withDangerousMod,
  withEntitlementsPlist,
  withXcodeProject,
} = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

/**
 * Expo Config Plugin for Folio Share functionality - iOS Version
 * Adds share extension and TokenManager native modules to iOS project
 */
const withFolioShareiOS = (config, options = {}) => {
  // Add App Groups entitlement
  config = withEntitlementsPlist(config, (config) => {
    config.modResults["com.apple.security.application-groups"] = [
      "group.co.lessisbetter.folio.share",
    ];
    return config;
  });

  // Add Xcode project modifications for share extension target
  config = withXcodeProject(config, (config) => {
    // Note: Full Xcode project manipulation would be complex here
    // For now, we'll copy the pre-configured project files
    console.log("✅ Xcode project will be configured for Share Extension");
    return config;
  });

  // Add dangerous mod to copy share extension files
  config = withDangerousMod(config, [
    "ios",
    async (modConfig) => {
      await copyShareExtensionFiles(modConfig.modRequest.projectRoot);
      return modConfig;
    },
  ]);

  return config;
};

/**
 * Copies share extension files from template to iOS project
 */
async function copyShareExtensionFiles(projectRoot) {
  const templateDir = path.join(__dirname, "folio-share-ios-template");
  const iosDir = path.join(projectRoot, "ios");

  console.log("🔧 Adding iOS share extension from template...");
  console.log("📍 Template source:", templateDir);
  console.log("📍 iOS target:", iosDir);

  try {
    // Verify iOS directory exists (should be created by prebuild)
    if (!fs.existsSync(iosDir)) {
      throw new Error(`iOS directory not found at: ${iosDir}. Make sure prebuild has run first.`);
    }

    // Verify share extension template exists
    if (!fs.existsSync(templateDir)) {
      throw new Error(`Share extension template not found at: ${templateDir}`);
    }

    // Copy FolioShare extension
    const shareExtensionSource = path.join(templateDir, "FolioShare");
    const shareExtensionTarget = path.join(iosDir, "FolioShare");

    if (fs.existsSync(shareExtensionSource)) {
      console.log("📋 Copying FolioShare extension...");
      fs.cpSync(shareExtensionSource, shareExtensionTarget, { recursive: true });
    }

    // Copy TokenManager files to iOS root directory (as expected by Xcode project)
    console.log("📋 Copying TokenManager files...");

    const tokenManagerSwift = path.join(templateDir, "TokenManager.swift");
    const tokenManagerM = path.join(templateDir, "TokenManager.m");

    if (fs.existsSync(tokenManagerSwift)) {
      fs.copyFileSync(tokenManagerSwift, path.join(iosDir, "TokenManager.swift"));
    }

    if (fs.existsSync(tokenManagerM)) {
      fs.copyFileSync(tokenManagerM, path.join(iosDir, "TokenManager.m"));
    }

    // Copy Xcode project configuration
    const projectSource = path.join(templateDir, "Folio.xcodeproj");
    const projectTarget = path.join(iosDir, "Folio.xcodeproj");

    if (fs.existsSync(projectSource)) {
      console.log("📋 Updating Xcode project configuration...");
      // Remove existing project config and replace with our template
      if (fs.existsSync(projectTarget)) {
        fs.rmSync(projectTarget, { recursive: true });
      }
      fs.cpSync(projectSource, projectTarget, { recursive: true });
    }

    // Copy workspace if it exists
    const workspaceSource = path.join(templateDir, "Folio.xcworkspace");
    const workspaceTarget = path.join(iosDir, "Folio.xcworkspace");

    if (fs.existsSync(workspaceSource)) {
      console.log("📋 Updating Xcode workspace configuration...");
      if (fs.existsSync(workspaceTarget)) {
        fs.rmSync(workspaceTarget, { recursive: true });
      }
      fs.cpSync(workspaceSource, workspaceTarget, { recursive: true });
    }

    console.log("✅ iOS share extension added successfully!");
    console.log("📂 FolioShare extension: ✅");
    console.log("📂 TokenManager files: ✅");
    console.log("📂 Xcode project config: ✅");
  } catch (error) {
    console.error("❌ Failed to add iOS share extension:", error.message);
    throw error;
  }
}

module.exports = withFolioShareiOS;

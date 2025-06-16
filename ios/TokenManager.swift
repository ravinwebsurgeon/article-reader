import Foundation
import React

@objc(TokenManager)
class TokenManager: NSObject {
  
  @objc
  func saveToken(_ token: String) {
    let userDefaults = UserDefaults(suiteName: "group.co.lessisbetter.folio.share")
    userDefaults?.set(token, forKey: "folio_share_token")
    userDefaults?.synchronize()
    print("✅ Token saved to App Group")
  }
  
  @objc(getToken:rejecter:)
  func getToken(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    let userDefaults = UserDefaults(suiteName: "group.co.lessisbetter.folio.share")
    if let token = userDefaults?.string(forKey: "folio_share_token") {
      resolve(token)
    } else {
      resolve(NSNull())
    }
  }
  
  @objc
  func removeToken() {
    let userDefaults = UserDefaults(suiteName: "group.co.lessisbetter.folio.share")
    userDefaults?.removeObject(forKey: "folio_share_token")
    userDefaults?.synchronize()
    print("✅ Token removed from App Group")
  }
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
}

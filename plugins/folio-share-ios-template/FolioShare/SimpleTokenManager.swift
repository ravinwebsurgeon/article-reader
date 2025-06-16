import Foundation

class SimpleTokenManager {
    private let tokenKey = "folio_share_token"
    private let appGroupIdentifier = "group.co.lessisbetter.folio.share"
    
    private var userDefaults: UserDefaults? {
        return UserDefaults(suiteName: appGroupIdentifier)
    }
    
    func getToken() -> String? {
        guard let defaults = userDefaults else {
            print("❌ Failed to access App Group UserDefaults")
            return nil
        }
        
        let token = defaults.string(forKey: tokenKey)
        print("🔍 Token check: \(token != nil ? "Found" : "Not found")")
        return token
    }
    
    func saveToken(_ token: String) {
        guard let defaults = userDefaults else {
            print("❌ Failed to access App Group UserDefaults for saving")
            return
        }
        
        defaults.set(token, forKey: tokenKey)
        defaults.synchronize()
        print("✅ Token saved to App Group")
    }
    
    func removeToken() {
        guard let defaults = userDefaults else {
            print("❌ Failed to access App Group UserDefaults for removal")
            return
        }
        
        defaults.removeObject(forKey: tokenKey)
        defaults.synchronize()
        print("🗑 Token removed from App Group")
    }
    
    func hasToken() -> Bool {
        return getToken() != nil
    }
    
    func debugInfo() {
        print("=== iOS TOKEN DEBUG INFO ===")
        print("App Group: \(appGroupIdentifier)")
        print("UserDefaults available: \(userDefaults != nil)")
        print("Token exists: \(hasToken())")
        print("============================")
    }
}

// Extension for main app to save token
extension SimpleTokenManager {
    /// Call this from your main app after successful login
    static func saveTokenFromMainApp(_ token: String) {
        let tokenManager = SimpleTokenManager()
        tokenManager.saveToken(token)
    }
    
    /// Call this from your main app during logout
    static func removeTokenFromMainApp() {
        let tokenManager = SimpleTokenManager()
        tokenManager.removeToken()
    }
}
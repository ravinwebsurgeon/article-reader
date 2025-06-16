package co.lessisbetter.folio

import android.content.Context
import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

class TokenManager(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private val TAG = "TokenManager"
    private val PREFS_NAME = "folio_shared"
    private val TOKEN_KEY = "auth_token"

    override fun getName(): String {
        return "TokenManager"
    }

    @ReactMethod
    fun saveToken(token: String) {
        try {
            val sharedPref = reactApplicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            with(sharedPref.edit()) {
                putString(TOKEN_KEY, token)
                apply()
            }
            Log.d(TAG, "✅ Token saved to SharedPreferences")
        } catch (e: Exception) {
            Log.e(TAG, "❌ Failed to save token", e)
        }
    }

    @ReactMethod
    fun getToken(promise: Promise) {
        try {
            val sharedPref = reactApplicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val token = sharedPref.getString(TOKEN_KEY, null)
            promise.resolve(token)
        } catch (e: Exception) {
            Log.e(TAG, "❌ Failed to get token", e)
            promise.resolve(null)
        }
    }

    @ReactMethod
    fun removeToken() {
        try {
            val sharedPref = reactApplicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            with(sharedPref.edit()) {
                remove(TOKEN_KEY)
                apply()
            }
            Log.d(TAG, "✅ Token removed from SharedPreferences")
        } catch (e: Exception) {
            Log.e(TAG, "❌ Failed to remove token", e)
        }
    }
}
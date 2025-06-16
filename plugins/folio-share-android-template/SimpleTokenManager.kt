package co.lessisbetter.folio

import android.content.Context
import android.util.Log

class SimpleTokenManager(private val context: Context) {
    private val TAG = "SimpleTokenManager"
    private val PREFS_NAME = "folio_shared"
    private val TOKEN_KEY = "auth_token"

    fun getToken(): String? {
        return try {
            val sharedPref = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val token = sharedPref.getString(TOKEN_KEY, null)
            Log.d(TAG, "Token read from SharedPreferences: ${if (token?.isNotEmpty() == true) token.take(10) + "..." else "null"}")
            token
        } catch (e: Exception) {
            Log.e(TAG, "Failed to read token from SharedPreferences", e)
            null
        }
    }

    fun hasToken(): Boolean {
        val token = getToken()
        val hasToken = !token.isNullOrEmpty()
        Log.d(TAG, "hasToken(): $hasToken")
        return hasToken
    }

    fun debugInfo() {
        val sharedPref = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        Log.d(TAG, "=== TOKEN DEBUG INFO ===")
        Log.d(TAG, "SharedPreferences name: $PREFS_NAME")
        Log.d(TAG, "Token key: $TOKEN_KEY")
        Log.d(TAG, "Has token: ${hasToken()}")
        Log.d(TAG, "All keys: ${sharedPref.all.keys}")
        Log.d(TAG, "========================")
    }
}
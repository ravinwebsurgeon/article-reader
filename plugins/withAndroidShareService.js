const { withAndroidManifest, withMainActivity } = require("@expo/config-plugins");

function withAndroidShareService(config) {
  // Add manifest configuration
  config = withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;

    // Add permissions
    if (!androidManifest.manifest["uses-permission"]) {
      androidManifest.manifest["uses-permission"] = [];
    }

    const permissions = ["android.permission.INTERNET", "android.permission.ACCESS_NETWORK_STATE"];

    permissions.forEach((permission) => {
      const exists = androidManifest.manifest["uses-permission"].some(
        (p) => p.$["android:name"] === permission,
      );
      if (!exists) {
        androidManifest.manifest["uses-permission"].push({
          $: { "android:name": permission },
        });
      }
    });

    // Add service for handling share intents in background
    if (!androidManifest.manifest.application[0].service) {
      androidManifest.manifest.application[0].service = [];
    }

    androidManifest.manifest.application[0].service.push({
      "$": {
        "android:name": ".ShareIntentService",
        "android:exported": "true",
        "android:enabled": "true",
      },
      "intent-filter": [
        {
          action: [{ $: { "android:name": "android.intent.action.SEND" } }],
          category: [{ $: { "android:name": "android.intent.category.DEFAULT" } }],
          data: [{ $: { "android:mimeType": "text/plain" } }],
        },
      ],
    });

    // Update main activity to also handle share intents (for when user wants to open app)
    const mainActivity = androidManifest.manifest.application[0].activity.find(
      (activity) => activity.$["android:name"] === ".MainActivity",
    );

    if (mainActivity) {
      if (!mainActivity["intent-filter"]) {
        mainActivity["intent-filter"] = [];
      }

      // Check if share intent filter already exists
      const hasShareIntent = mainActivity["intent-filter"].some(
        (filter) =>
          filter.action &&
          filter.action.some((action) => action.$["android:name"] === "android.intent.action.SEND"),
      );

      if (!hasShareIntent) {
        mainActivity["intent-filter"].push({
          action: [{ $: { "android:name": "android.intent.action.SEND" } }],
          category: [{ $: { "android:name": "android.intent.category.DEFAULT" } }],
          data: [{ $: { "android:mimeType": "text/plain" } }],
        });
      }
    }

    return config;
  });

  // Add the Kotlin service class to MainActivity
  config = withMainActivity(config, (config) => {
    let { contents } = config.modResults;

    // Check if our code is already added
    if (contents.includes("// FOLIO_SHARE_METHODS_ADDED")) {
      return config;
    }

    // Add imports for Intent and other required classes (Kotlin style)
    const imports = [
      "import android.content.Intent",
      "import android.content.SharedPreferences",
      "import android.widget.Toast",
      "import android.os.AsyncTask",
      "import java.io.IOException",
      "import java.net.URL",
      "import java.net.HttpURLConnection",
      "import java.io.OutputStream",
      "import java.io.BufferedReader",
      "import java.io.InputStreamReader",
      "import org.json.JSONObject",
      "import org.json.JSONException",
      "import java.io.File",
      "import android.database.sqlite.SQLiteDatabase",
    ].join("\n");

    // Add the service methods in Kotlin
    const serviceCode = `
  // FOLIO_SHARE_METHODS_ADDED
  override fun onNewIntent(intent: Intent?) {
      super.onNewIntent(intent)
      intent?.let { handleShareIntent(it) }
  }

  override fun onResume() {
      super.onResume()
      handleShareIntent(intent)
  }

  private fun handleShareIntent(intent: Intent) {
      if (Intent.ACTION_SEND == intent.action && "text/plain" == intent.type) {
          val sharedText = intent.getStringExtra(Intent.EXTRA_TEXT)
          sharedText?.let {
              val url = extractUrl(it)
              url?.let { validUrl ->
                  SaveUrlTask().execute(validUrl)
              }
          }
      }
  }

  private fun extractUrl(text: String): String? {
      val words = text.split("\\\\s+".toRegex())
      for (word in words) {
          if (word.startsWith("http://") || word.startsWith("https://")) {
              return word
          }
      }
      return null
  }

  private inner class SaveUrlTask : AsyncTask<String, Void, String>() {
      override fun doInBackground(vararg urls: String): String {
          return saveUrlToApi(urls[0])
      }

      override fun onPostExecute(result: String) {
          Toast.makeText(this@MainActivity, result, Toast.LENGTH_SHORT).show()
      }
  }

  private fun saveUrlToApi(url: String): String {
                android.util.Log.d("FolioShare", "Saving URL: " + url)
      
      val token = findAuthToken()
      if (token == null) {
          android.util.Log.w("FolioShare", "No auth token found")
          return "Please login to Folio first"
      }
      
      android.util.Log.d("FolioShare", "Found token, making API call")
      
      try {
          val item = JSONObject()
          item.put("url", url)
          item.put("archived", false)
          item.put("favorite", false)
          
          val payload = JSONObject()
          payload.put("item", item)

          val apiUrl = URL("https://api.savewithfolio.com/v4/items")
          val conn = apiUrl.openConnection() as HttpURLConnection
          conn.requestMethod = "POST"
          conn.setRequestProperty("Authorization", "Bearer " + token)
          conn.setRequestProperty("Content-Type", "application/json")
          conn.doOutput = true

          conn.outputStream.use { os ->
              val input = payload.toString().toByteArray(Charsets.UTF_8)
              os.write(input, 0, input.size)
          }

          val responseCode = conn.responseCode
          android.util.Log.d("FolioShare", "API response: " + responseCode)
          
          return when (responseCode) {
              201 -> "✅ Saved to Folio!"
              401 -> "Authentication failed. Please login again."
              else -> "Failed to save. Please try again."
          }
      } catch (e: Exception) {
          android.util.Log.e("FolioShare", "API error", e)
          return "Error saving to Folio"
      }
  }

  private fun findAuthToken(): String? {
      android.util.Log.d("FolioShare", "Searching for auth token...")
      
      // First, try to read from AsyncStorage SQLite database
      val tokenFromDb = readTokenFromAsyncStorageDB()
      if (tokenFromDb != null) {
          return tokenFromDb
      }
      
      // If not found in DB, try SharedPreferences as fallback
      return readTokenFromSharedPreferences()
  }
  
  private fun readTokenFromAsyncStorageDB(): String? {
      try {
          // AsyncStorage uses SQLite database
          val dbPaths = listOf(
              File(applicationInfo.dataDir, "databases/RKStorage"),
              File(applicationInfo.dataDir, "databases/AsyncStorage"),
              File(applicationInfo.dataDir, "databases/RCTAsyncLocalStorage_V1"),
              File(applicationInfo.dataDir, "databases/RCTAsyncLocalStorage")
          )
          
          for (dbPath in dbPaths) {
              if (dbPath.exists()) {
                  android.util.Log.d("FolioShare", "Found AsyncStorage DB at: " + dbPath.absolutePath)
                  try {
                      val db = SQLiteDatabase.openDatabase(dbPath.absolutePath, null, SQLiteDatabase.OPEN_READONLY)
                      
                      // Try to read the token directly
                      val tokenKeys = arrayOf("auth_token", "folio_auth_token", "token", "authToken")
                      for (key in tokenKeys) {
                          val cursor = db.rawQuery("SELECT value FROM catalystLocalStorage WHERE key = ?", arrayOf(key))
                          if (cursor.moveToFirst()) {
                              val token = cursor.getString(0)
                              cursor.close()
                              db.close()
                              android.util.Log.d("FolioShare", "Found token in AsyncStorage DB with key: " + key)
                              return token
                          }
                          cursor.close()
                      }
                      
                      // Try to find any key containing 'token' or 'auth'
                      val searchCursor = db.rawQuery("SELECT key, value FROM catalystLocalStorage WHERE key LIKE '%token%' OR key LIKE '%auth%'", null)
                      while (searchCursor.moveToNext()) {
                          val key = searchCursor.getString(0)
                          val value = searchCursor.getString(1)
                          android.util.Log.d("FolioShare", "Found potential token key in DB: " + key)
                          
                          // Check if value looks like a JWT token
                          if (value.startsWith("ey") && value.length > 50) {
                              searchCursor.close()
                              db.close()
                              android.util.Log.d("FolioShare", "Found JWT-like token in DB")
                              return value
                          }
                      }
                      searchCursor.close()
                      
                      db.close()
                  } catch (e: Exception) {
                      android.util.Log.e("FolioShare", "Error reading AsyncStorage DB", e)
                  }
              }
          }
      } catch (e: Exception) {
          android.util.Log.e("FolioShare", "Error accessing AsyncStorage DB", e)
      }
      
      return null
  }
  
  private fun readTokenFromSharedPreferences(): String? {
      // List all SharedPreferences files
      val prefsDir = File(applicationInfo.dataDir, "shared_prefs")
      if (prefsDir.exists() && prefsDir.isDirectory) {
          val prefFiles = prefsDir.listFiles { file -> file.name.endsWith(".xml") }
          android.util.Log.d("FolioShare", "Found " + (prefFiles?.size ?: 0) + " preference files")
          prefFiles?.forEach { file ->
              android.util.Log.d("FolioShare", "Pref file: " + file.name)
              
              // Extract the preference name (remove .xml extension)
              val prefName = file.name.removeSuffix(".xml")
              try {
                  val prefs = getSharedPreferences(prefName, MODE_PRIVATE)
                  val token = searchForTokenInPrefs(prefs, prefName)
                  if (token != null) {
                      return token
                  }
              } catch (e: Exception) {
                  android.util.Log.e("FolioShare", "Error reading prefs: " + prefName, e)
              }
          }
      }
      
      // Also try some common preference names
      val commonPrefNames = listOf(
          "react-native",
          "ReactNative",
          packageName + "_preferences"
      )
      
      for (prefName in commonPrefNames) {
          try {
              val prefs = getSharedPreferences(prefName, MODE_PRIVATE)
              val token = searchForTokenInPrefs(prefs, prefName)
              if (token != null) {
                  return token
              }
          } catch (e: Exception) {
              android.util.Log.e("FolioShare", "Error checking " + prefName, e)
          }
      }
      
      android.util.Log.w("FolioShare", "No token found in any location")
      return null
  }

  private fun searchForTokenInPrefs(prefs: SharedPreferences, prefsName: String): String? {
      val allEntries = prefs.all
      if (allEntries.isEmpty()) {
          return null
      }
      
      android.util.Log.d("FolioShare", prefsName + " has " + allEntries.size + " entries")
      
      // First check direct token keys
      val tokenKeys = listOf("auth_token", "folio_auth_token", "token", "authToken")
      for (key in tokenKeys) {
          val value = prefs.getString(key, null)
          if (!value.isNullOrEmpty()) {
              android.util.Log.d("FolioShare", "Found token in " + prefsName + " with key: " + key)
              return value
          }
      }
      
      // Check all entries for potential tokens
      for ((key, value) in allEntries) {
          android.util.Log.d("FolioShare", "Checking " + prefsName + " key: " + key)
          
          if (value is String && value.isNotEmpty()) {
              // Check if the value looks like a JWT token
              if (value.startsWith("ey") && value.length > 50) {
                  android.util.Log.d("FolioShare", "Found JWT-like token in " + prefsName + " key: " + key)
                  return value
              }
              
              // Check if the key contains token-related words
              if ((key.contains("token", ignoreCase = true) || key.contains("auth", ignoreCase = true)) && !value.startsWith("{")) {
                  android.util.Log.d("FolioShare", "Found potential token in " + prefsName + " key: " + key)
                  return value
              }
              
              // Try to parse JSON values
              if (value.startsWith("{") || value.startsWith("\\"")) {
                  try {
                      // Handle escaped JSON
                      var jsonStr = value
                      if (jsonStr.startsWith("\\"") && jsonStr.endsWith("\\"")) {
                          jsonStr = jsonStr.substring(1, jsonStr.length - 1)
                      }
                      jsonStr = jsonStr.replace("\\\\\\"", "\\"")
                      
                      val json = JSONObject(jsonStr)
                      if (json.has("token")) {
                          val token = json.getString("token")
                          if (token.isNotEmpty()) {
                              android.util.Log.d("FolioShare", "Found token in JSON value of " + prefsName + " key: " + key)
                              return token
                          }
                      }
                  } catch (e: Exception) {
                      // Not valid JSON, continue
                  }
              }
          }
      }
      
      // Special handling for persist:root (Redux persist)
      val persistRoot = prefs.getString("persist:root", null)
      if (!persistRoot.isNullOrEmpty()) {
          try {
              val rootState = JSONObject(persistRoot)
              if (rootState.has("auth")) {
                  var authString = rootState.getString("auth")
                  // Remove quotes if present
                  if (authString.startsWith("\\"") && authString.endsWith("\\"")) {
                      authString = authString.substring(1, authString.length - 1)
                  }
                  // Unescape JSON
                  authString = authString.replace("\\\\\\"", "\\"")
                  
                  val authObject = JSONObject(authString)
                  if (authObject.has("token")) {
                      val token = authObject.getString("token")
                      if (token.isNotEmpty()) {
                          android.util.Log.d("FolioShare", "Found token in persist:root of " + prefsName)
                          return token
                      }
                  }
              }
          } catch (e: Exception) {
              android.util.Log.e("FolioShare", "Error parsing persist:root in " + prefsName, e)
          }
      }
      
      return null
  }`;

    try {
      // Add imports using string replacement (safer than mergeContents)
      const importAnchor = "import com.facebook.react.ReactActivity";
      const importIndex = contents.indexOf(importAnchor);
      if (importIndex !== -1) {
        const afterImport = importIndex + importAnchor.length;
        contents = contents.slice(0, afterImport) + "\n" + imports + contents.slice(afterImport);
      }
    } catch (error) {
      console.warn("Failed to add imports:", error);
    }

    // Add service code before the last closing brace
    const lastBraceIndex = contents.lastIndexOf("}");
    if (lastBraceIndex !== -1) {
      contents =
        contents.slice(0, lastBraceIndex) + serviceCode + "\n" + contents.slice(lastBraceIndex);
    }

    config.modResults.contents = contents;
    return config;
  });

  return config;
}

module.exports = withAndroidShareService;

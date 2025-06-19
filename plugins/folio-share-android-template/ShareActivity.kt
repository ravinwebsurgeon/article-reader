package co.lessisbetter.folio

import android.animation.ValueAnimator
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.res.Configuration
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.ColorDrawable
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Log
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.view.animation.LinearInterpolator
import android.webkit.URLUtil
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.PopupWindow
import android.widget.TextView
import androidx.core.content.ContextCompat
import java.util.concurrent.TimeUnit
import kotlinx.coroutines.*
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject

enum class DialogState {
    LOADING,
    SUCCESS,
    ERROR
}

class ShareActivity : Activity() {

    private val TAG = "ShareActivity"
    private val API_BASE_URL = "https://api.savewithfolio.com/v4"
    private lateinit var httpClient: OkHttpClient
    private lateinit var tokenManager: SimpleTokenManager
    private var unifiedDialog: PopupWindow? = null
    private var dialogIconView: ImageView? = null
    private var dialogTextView: TextView? = null
    private var animationRect: View? = null

    // Timing constants
    private val DIALOG_SHOW_DELAY = 100L // 100ms delay for dialog appearance
    private val SAVING_UI_DELAY =
            DIALOG_SHOW_DELAY +
                    250L // 350ms total: dialog appears + 250ms visible before API request

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        httpClient =
                OkHttpClient.Builder()
                        .connectTimeout(10, TimeUnit.SECONDS)
                        .readTimeout(10, TimeUnit.SECONDS)
                        .writeTimeout(10, TimeUnit.SECONDS)
                        .build()

        tokenManager = SimpleTokenManager(this)

        // Debug token locations
        tokenManager.debugInfo()

        handleSharedContent()
    }

    private fun handleSharedContent() {
        val intent = intent
        val action = intent.action
        val type = intent.type

        Log.d(TAG, "Share intent: action=$action, type=$type")

        if (Intent.ACTION_SEND == action && type != null) {
            when {
                type.startsWith("text/") -> handleSharedText(intent)
                else -> showUnifiedDialog(DialogState.ERROR, "Unsupported content type")
            }
        } else {
            showUnifiedDialog(DialogState.ERROR, "No content to share")
        }
    }

    private fun handleSharedText(intent: Intent) {
        val sharedText = intent.getStringExtra(Intent.EXTRA_TEXT)
        val sharedSubject = intent.getStringExtra(Intent.EXTRA_SUBJECT)

        Log.d(TAG, "Shared text: $sharedText")
        Log.d(TAG, "Shared subject: $sharedSubject")

        if (sharedText.isNullOrEmpty()) {
            showUnifiedDialog(DialogState.ERROR, "No URL found")
            return
        }

        val url = extractUrl(sharedText)
        if (url.isNullOrEmpty()) {
            showUnifiedDialog(DialogState.ERROR, "No valid URL found")
            return
        }

        Log.d(TAG, "Extracted URL: $url")
        val savingMessage = tokenManager.getTranslation("folio_share_t_common_saving")
        showUnifiedDialog(DialogState.LOADING, savingMessage)

        // Delay API request to let user see the UI
        Handler(Looper.getMainLooper())
                .postDelayed({ saveUrlToDatabase(url, sharedSubject) }, SAVING_UI_DELAY)
    }

    private fun extractUrl(text: String): String? {
        if (URLUtil.isValidUrl(text)) {
            return text
        }

        val urlPattern = Regex("""(https?://[^\s]+)""", RegexOption.IGNORE_CASE)
        return urlPattern.find(text)?.value
    }

    private fun saveUrlToDatabase(url: String, title: String?) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val authToken = tokenManager.getToken()

                if (authToken.isNullOrEmpty()) {
                    Log.w(TAG, "No auth token found - user needs to login")
                    withContext(Dispatchers.Main) {
                        showUnifiedDialog(DialogState.ERROR, "Please login to Folio first")
                    }
                    return@launch
                }

                Log.d(TAG, "Auth token found, proceeding with API call")

                val requestBody = createRequestBody(url, title)
                val request = createApiRequest(requestBody, authToken)

                httpClient.newCall(request).execute().use { response ->
                    withContext(Dispatchers.Main) { handleApiResponse(response) }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    Log.e(TAG, "Error saving URL", e)
                    showUnifiedDialog(DialogState.ERROR, "Network error: ${e.message}")
                }
            }
        }
    }

    private fun createRequestBody(url: String, title: String?): RequestBody {
        val itemObject =
                JSONObject().apply {
                    put("url", url)
                    put("archived", false)
                    put("favorite", false)
                    put("progress", 0.0)
                    put("notes", title ?: "")
                }

        val payload = JSONObject().apply { put("item", itemObject) }

        val jsonString = payload.toString()
        Log.d(TAG, "Request body: $jsonString")

        val mediaType = "application/json; charset=utf-8".toMediaType()
        return jsonString.toRequestBody(mediaType)
    }

    private fun createApiRequest(requestBody: RequestBody, authToken: String): Request {
        return Request.Builder()
                .url("$API_BASE_URL/items")
                .post(requestBody)
                .addHeader("Authorization", "Bearer $authToken")
                .addHeader("Content-Type", "application/json")
                .addHeader("User-Agent", "Folio-Android-Share/1.0")
                .build()
    }

    private fun handleApiResponse(response: Response) {
        if (response.isSuccessful) {
            try {
                val responseBody = response.body?.string()
                Log.d(TAG, "API response body: $responseBody")

                val jsonResponse = JSONObject(responseBody ?: "{}")
                val success = jsonResponse.optBoolean("success", true)

                if (success) {
                val savedMessage = tokenManager.getTranslation("folio_share_t_common_saved")
                    showUnifiedDialog(DialogState.SUCCESS, savedMessage)
                } else {
                    val message = jsonResponse.optString("message", "Failed to save")
                    showUnifiedDialog(DialogState.ERROR, message)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error parsing response", e)
                val savedMessage = tokenManager.getTranslation("folio_share_t_common_saved")
                showUnifiedDialog(DialogState.SUCCESS, savedMessage)
            }
        } else {
            val errorMsg =
                    when (response.code) {
                        401 -> "Authentication expired. Please login to Folio again"
                        403 -> "Access denied. Check your account permissions"
                        429 -> "Rate limit exceeded. Please wait before trying again"
                        500, 502, 503 -> "Folio servers are temporarily unavailable"
                        else -> "Failed to save"
                    }
            Log.e(TAG, "API error: $errorMsg")
            showUnifiedDialog(DialogState.ERROR, errorMsg)
        }
    }

    private fun showUnifiedDialog(state: DialogState, message: String) {
        if (isFinishing || isDestroyed) return

        if (unifiedDialog?.isShowing == true) {
            // Dialog already exists, just update content
            updateDialogContent(state, message)

            when (state) {
                DialogState.SUCCESS -> {
                    triggerHapticFeedback()
                    Handler(Looper.getMainLooper())
                            .postDelayed(
                                    {
                                        unifiedDialog?.dismiss()
                                        finish()
                                    },
                                    2000
                            )
                }
                DialogState.ERROR -> {
                    stopLoadingAnimation()
                    // No auto-close - user can tap background to dismiss
                }
                else -> {
                    // LOADING: stay until next state
                }
            }
            return
        }

        Handler(Looper.getMainLooper())
                .postDelayed(
                        {
                            if (isFinishing || isDestroyed) return@postDelayed

                            // Background overlay
                            val popupView =
                                    FrameLayout(this).apply {
                                        layoutParams =
                                                FrameLayout.LayoutParams(
                                                        FrameLayout.LayoutParams.MATCH_PARENT,
                                                        FrameLayout.LayoutParams.MATCH_PARENT
                                                )
                                        setBackgroundColor(Color.parseColor("#80000000"))
                                    }

                            // Create your dialog content view
                            val dialogView = createUnifiedDialogView(state, message)

                            // Calculate 90% of screen width
                            val width90 = (resources.displayMetrics.widthPixels * 0.9).toInt()

                            // Centered params with fixed width
                            val dialogParams =
                                    FrameLayout.LayoutParams(
                                                    width90,
                                                    FrameLayout.LayoutParams.WRAP_CONTENT
                                            )
                                            .apply { gravity = Gravity.CENTER }

                            popupView.addView(dialogView, dialogParams)

                            unifiedDialog =
                                    PopupWindow(
                                                    popupView,
                                                    WindowManager.LayoutParams.MATCH_PARENT,
                                                    WindowManager.LayoutParams.MATCH_PARENT,
                                                    true
                                            )
                                            .apply {
                                                isOutsideTouchable = true
                                                setBackgroundDrawable(
                                                        ColorDrawable(Color.TRANSPARENT)
                                                )
                                            }

                            unifiedDialog?.showAtLocation(
                                    window.decorView.rootView,
                                    Gravity.CENTER,
                                    0,
                                    0
                            )

                            if (state == DialogState.LOADING) {
                                startLoadingAnimation()
                            }

                            when (state) {
                                DialogState.SUCCESS -> {
                                    triggerHapticFeedback()
                                    Handler(Looper.getMainLooper())
                                            .postDelayed(
                                                    {
                                                        unifiedDialog?.dismiss()
                                                        finish()
                                                    },
                                                    2000
                                            )
                                }
                                DialogState.ERROR -> {
                                    stopLoadingAnimation()
                                    // No auto-close - user can tap background to dismiss
                                }
                                else -> {
                                    // LOADING: stay until next state
                                }
                            }

                            popupView.setOnClickListener {
                                if (state != DialogState.LOADING) {
                                    unifiedDialog?.dismiss()
                                    finish()
                                }
                            }
                        },
                        DIALOG_SHOW_DELAY
                )
    }

    private fun createUnifiedDialogView(state: DialogState, message: String): View {
        // Detect dark mode
        val isDarkMode =
                (resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK) ==
                        Configuration.UI_MODE_NIGHT_YES

        // Choose light or dark colors
        val bgColor = if (isDarkMode) Color.BLACK else Color.WHITE
        val textColor = if (isDarkMode) Color.WHITE else Color.BLACK
        val accentColor =
                if (isDarkMode) ContextCompat.getColor(this, R.color.accent_dark)
                else ContextCompat.getColor(this, R.color.accent_light)

        // 90% of screen width
        val width90 = (resources.displayMetrics.widthPixels * 0.9).toInt()

        // Container
        val container =
                LinearLayout(this).apply {
                    orientation = LinearLayout.VERTICAL
                    setPadding(dpToPx(24), dpToPx(16), dpToPx(24), dpToPx(16))
                    setBackgroundColor(bgColor)
                    layoutParams =
                            LinearLayout.LayoutParams(
                                    width90,
                                    LinearLayout.LayoutParams.WRAP_CONTENT
                            )
                    gravity = Gravity.CENTER_HORIZONTAL
                    background =
                            GradientDrawable().apply {
                                cornerRadius = dpToPx(16).toFloat()
                                setColor(bgColor)
                            }
                }

        // Icon + animation overlay
        val iconContainer =
                FrameLayout(this).apply {
                    layoutParams =
                            LinearLayout.LayoutParams(dpToPx(64), dpToPx(64)).apply {
                                gravity = Gravity.CENTER_HORIZONTAL
                                bottomMargin = dpToPx(8)
                            }
                }

        dialogIconView =
                ImageView(this).apply {
                    layoutParams = FrameLayout.LayoutParams(dpToPx(64), dpToPx(64))
                    scaleType = ImageView.ScaleType.CENTER_INSIDE
                }
        iconContainer.addView(dialogIconView)

        animationRect =
                View(this).apply {
                    layoutParams =
                            FrameLayout.LayoutParams(dpToPx(64), 0).apply {
                                gravity = Gravity.BOTTOM
                            }
                    setBackgroundColor(accentColor)
                    visibility = View.GONE
                }
        // iconContainer.addView(animationRect)

        // Message text
        dialogTextView =
                TextView(this).apply {
                    text = message
                    setTextColor(textColor)
                    textSize = 22f
                    typeface = Typeface.create("sans-serif", Typeface.BOLD)
                    gravity = Gravity.CENTER
                    layoutParams =
                            LinearLayout.LayoutParams(
                                            LinearLayout.LayoutParams.MATCH_PARENT,
                                            LinearLayout.LayoutParams.WRAP_CONTENT
                                    )
                                    .apply { topMargin = dpToPx(4) }
                }

        // Assemble
        container.addView(iconContainer)
        container.addView(dialogTextView)

        // Populate icon & start animation if needed
        updateDialogContent(state, message)
        if (state == DialogState.LOADING) {
            startLoadingAnimation()
        }

        return container
    }

    private fun updateDialogContent(state: DialogState, message: String) {
        dialogTextView?.text = message

        when (state) {
            DialogState.LOADING -> {
                dialogIconView?.setImageDrawable(
                        ContextCompat.getDrawable(this, R.drawable.ic_folio_loading)
                )
                animationRect?.visibility = View.VISIBLE
                animationRect?.setBackgroundColor(Color.parseColor("#02807A"))
            }
            DialogState.SUCCESS -> {
                dialogIconView?.setImageDrawable(
                        ContextCompat.getDrawable(this, R.drawable.ic_folio_success)
                )
                animationRect?.visibility = View.GONE
            }
            DialogState.ERROR -> {
                dialogIconView?.setImageDrawable(
                        ContextCompat.getDrawable(this, R.drawable.ic_error)
                )
                animationRect?.visibility = View.GONE
            }
        }
    }

    private fun startLoadingAnimation() {
        animationRect?.let { rect ->
            val animator = ValueAnimator.ofInt(0, dpToPx(64))
            animator.duration = 2000
            animator.repeatCount = ValueAnimator.INFINITE
            animator.repeatMode = ValueAnimator.RESTART
            animator.interpolator = LinearInterpolator()

            animator.addUpdateListener { animation ->
                val height = animation.animatedValue as Int
                val layoutParams = rect.layoutParams as FrameLayout.LayoutParams
                layoutParams.height = height
                layoutParams.gravity = Gravity.BOTTOM
                rect.layoutParams = layoutParams
                rect.requestLayout()
            }

            animator.start()

            // Store animator to cancel it later if needed
            rect.tag = animator
        }
    }

    private fun stopLoadingAnimation() {
        animationRect?.let { rect ->
            val animator = rect.tag as? ValueAnimator
            animator?.cancel()
            rect.tag = null
        }
    }

    private fun triggerHapticFeedback() {
        val vibrator =
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    val vm = getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
                    vm.defaultVibrator
                } else {
                    @Suppress("DEPRECATION") getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
                }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createOneShot(50, VibrationEffect.DEFAULT_AMPLITUDE))
        } else {
            @Suppress("DEPRECATION") vibrator.vibrate(50)
        }
    }

    private fun dpToPx(dp: Int): Int {
        return (dp * resources.displayMetrics.density).toInt()
    }

    override fun onDestroy() {
        super.onDestroy()
        stopLoadingAnimation()
        unifiedDialog?.dismiss()
    }
}

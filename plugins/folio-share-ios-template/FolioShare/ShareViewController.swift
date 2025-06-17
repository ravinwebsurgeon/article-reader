import UIKit
import UniformTypeIdentifiers

class ShareViewController: UIViewController {

    // UI Elements
    let dialogView = UIView()
    let contentContainer = UIView()
    let iconView = UIImageView()
    let messageLabel = UILabel()

    override func viewDidLoad() {
        super.viewDidLoad()
        setupCustomUI()
        setStateSaving() // Set loading state immediately
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        handleSharedContent()
    }


    func setupCustomUI() {
        // Solid background that adapts to dark/light mode
        view.backgroundColor = UIColor.systemBackground

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
            dialogView.heightAnchor.constraint(equalToConstant: 160),
        ])

        // Content container - holds icon and text
        contentContainer.translatesAutoresizingMaskIntoConstraints = false
        dialogView.addSubview(contentContainer)
        
        // Icon View
        iconView.translatesAutoresizingMaskIntoConstraints = false
        iconView.contentMode = .center
        contentContainer.addSubview(iconView)
        
        // Message Label
        messageLabel.translatesAutoresizingMaskIntoConstraints = false
        messageLabel.font = UIFont.boldSystemFont(ofSize: 22)
        messageLabel.textAlignment = .center
        messageLabel.numberOfLines = 2
        messageLabel.textColor = .label
        contentContainer.addSubview(messageLabel)
        
        NSLayoutConstraint.activate([
            // Center the container in the dialog
            contentContainer.centerXAnchor.constraint(equalTo: dialogView.centerXAnchor),
            contentContainer.centerYAnchor.constraint(equalTo: dialogView.centerYAnchor),
            contentContainer.leadingAnchor.constraint(greaterThanOrEqualTo: dialogView.leadingAnchor, constant: 16),
            contentContainer.trailingAnchor.constraint(lessThanOrEqualTo: dialogView.trailingAnchor, constant: -16),
            
            // Icon within container
            iconView.topAnchor.constraint(equalTo: contentContainer.topAnchor),
            iconView.centerXAnchor.constraint(equalTo: contentContainer.centerXAnchor),
            iconView.widthAnchor.constraint(equalToConstant: 64),
            iconView.heightAnchor.constraint(equalToConstant: 64),
            
            // Text within container
            messageLabel.topAnchor.constraint(equalTo: iconView.bottomAnchor, constant: 18),
            messageLabel.leadingAnchor.constraint(equalTo: contentContainer.leadingAnchor),
            messageLabel.trailingAnchor.constraint(equalTo: contentContainer.trailingAnchor),
            messageLabel.bottomAnchor.constraint(equalTo: contentContainer.bottomAnchor),
        ])
    }

    func setStateSaving() {
        // Load and display the folio.loading image
        if let image = UIImage(named: "folio.loading") {
            iconView.image = image
        } else {
            // Fallback to a system loading indicator
            iconView.image = UIImage(systemName: "arrow.triangle.2.circlepath")?.withTintColor(
                .systemBlue, renderingMode: .alwaysOriginal)
        }
        iconView.isHidden = false
        messageLabel.text = "Saving..."
    }

    func setStateSaved() {
        iconView.isHidden = false
        
        // Try to load custom image, fallback to system icon
        if let image = UIImage(named: "folio.success") {
            iconView.image = image
        } else {
            iconView.image = UIImage(systemName: "checkmark.circle.fill")?.withTintColor(
                .systemGreen, renderingMode: .alwaysOriginal)
        }
        
        messageLabel.text = "Saved to Folio."
    }

    private func handleSharedContent() {
        Task {
            await processSharedContent()
        }
    }
    
    private func processSharedContent() async {
        guard let inputItems = extensionContext?.inputItems as? [NSExtensionItem] else {
            await MainActor.run { setStateSavedWithError("No content to share") }
            return
        }
        
        // Collect all providers
        var allProviders: [NSItemProvider] = []
        for extensionItem in inputItems {
            if let attachments = extensionItem.attachments {
                allProviders.append(contentsOf: attachments)
            }
        }
        
        // Our predicate guarantees public.url exists, so just find it
        for itemProvider in allProviders {
            if itemProvider.hasItemConformingToTypeIdentifier(UTType.url.identifier) {
                if let url = await loadURL(from: itemProvider) {
                    await MainActor.run {
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                            self.saveUrlToServer(url)
                        }
                    }
                    return
                }
            }
        }
        
        // If we get here, the predicate lied to us
        await MainActor.run { setStateSavedWithError("URL type found but failed to load") }
    }
    
    private func loadURL(from itemProvider: NSItemProvider) async -> String? {
        return await withCheckedContinuation { continuation in
            itemProvider.loadItem(forTypeIdentifier: UTType.url.identifier, options: nil) { data, error in
                if let url = data as? URL {
                    continuation.resume(returning: url.absoluteString)
                } else {
                    continuation.resume(returning: nil)
                }
            }
        }
    }
    
    private func loadText(from itemProvider: NSItemProvider) async -> String? {
        return await withCheckedContinuation { continuation in
            itemProvider.loadItem(forTypeIdentifier: UTType.plainText.identifier, options: nil) { data, error in
                continuation.resume(returning: data as? String)
            }
        }
    }

    private func extractURL(from text: String) -> String? {
        let trimmedText = text.trimmingCharacters(in: .whitespacesAndNewlines)
        if let url = URL(string: trimmedText), url.scheme != nil {
            return trimmedText
        }
        
        // Use NSDataDetector to find URLs in the text
        let detector = try? NSDataDetector(types: NSTextCheckingResult.CheckingType.link.rawValue)
        let matches = detector?.matches(
            in: text, options: [], range: NSRange(location: 0, length: text.utf16.count))
        return matches?.first?.url?.absoluteString
    }

    private func saveUrlToServer(_ urlString: String) {
        let token = getTokenFromAppGroup()  // Replace with your method
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
                "notes": "",
            ]
        ]
        request.httpBody = try? JSONSerialization.data(withJSONObject: requestBody, options: [])

        let task = URLSession.shared.dataTask(with: request) { data, response, error in
            DispatchQueue.main.async {
                if let error = error {
                    print("Error: \(error.localizedDescription)")
                    self.setStateSavedWithError("Failed: \(error.localizedDescription)")
                } else if let httpResp = response as? HTTPURLResponse, httpResp.statusCode >= 400 {
                    print("Error: \(httpResp.statusCode)")
                    self.setStateSavedWithError("Failed (\(httpResp.statusCode))")
                } else {
                    self.setStateSaved()
                    DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
                        self.extensionContext?.completeRequest(
                            returningItems: [], completionHandler: nil)
                    }
                }
            }
        }
        task.resume()
    }

    func setStateSavedWithError(_ message: String) {
        iconView.isHidden = false
        iconView.contentMode = .scaleAspectFit // Scale error icon to fit
        iconView.image = UIImage(systemName: "xmark.circle.fill")?.withTintColor(
            .systemRed, renderingMode: .alwaysOriginal)
        messageLabel.text = message
        // No auto-close - user must swipe to dismiss
    }

    // Shared token if needed
    private func getTokenFromAppGroup() -> String? {
        let userDefaults = UserDefaults(suiteName: "group.co.lessisbetter.folio.share")  // <- your App Group ID
        let token = userDefaults?.string(forKey: "folio_share_token")
        print("🔑 Token from App Group: \(token ?? "nil")")

        return token
    }
}

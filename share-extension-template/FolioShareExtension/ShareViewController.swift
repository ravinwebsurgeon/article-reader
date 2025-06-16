import UIKit
import UniformTypeIdentifiers

class ShareViewController: UIViewController {

    // UI Elements
    let dialogView = UIView()
    let iconView = UIImageView()
    let messageLabel = UILabel()
    let spinner = UIActivityIndicatorView(style: .large)

    override func viewDidLoad() {
        super.viewDidLoad()
        setupCustomUI()
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        handleSharedContent()
    }

    func setupCustomUI() {
        // Dimmed background
        view.backgroundColor = UIColor.white.withAlphaComponent(1)

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
            dialogView.heightAnchor.constraint(equalToConstant: 160)
        ])

        // Spinner
        spinner.translatesAutoresizingMaskIntoConstraints = false
        dialogView.addSubview(spinner)
        NSLayoutConstraint.activate([
            spinner.topAnchor.constraint(equalTo: dialogView.topAnchor, constant: 24),
            spinner.centerXAnchor.constraint(equalTo: dialogView.centerXAnchor)
        ])

        // Icon View (initially hidden)
        iconView.translatesAutoresizingMaskIntoConstraints = false
        iconView.isHidden = true
        dialogView.addSubview(iconView)
        NSLayoutConstraint.activate([
            iconView.centerXAnchor.constraint(equalTo: dialogView.centerXAnchor),
            iconView.topAnchor.constraint(equalTo: dialogView.topAnchor, constant: 24),
            iconView.widthAnchor.constraint(equalToConstant: 44),
            iconView.heightAnchor.constraint(equalToConstant: 44)
        ])

        // Message Label
        messageLabel.translatesAutoresizingMaskIntoConstraints = false
        messageLabel.font = UIFont.boldSystemFont(ofSize: 18)
        messageLabel.textAlignment = .center
        messageLabel.numberOfLines = 2
        dialogView.addSubview(messageLabel)
        NSLayoutConstraint.activate([
            messageLabel.topAnchor.constraint(equalTo: spinner.bottomAnchor, constant: 18),
            messageLabel.leadingAnchor.constraint(equalTo: dialogView.leadingAnchor, constant: 16),
            messageLabel.trailingAnchor.constraint(equalTo: dialogView.trailingAnchor, constant: -16),
            messageLabel.bottomAnchor.constraint(equalTo: dialogView.bottomAnchor, constant: -24)
        ])
    }

    func setStateSaving() {
        spinner.isHidden = false
        spinner.startAnimating()
        iconView.isHidden = true
        messageLabel.text = "Saving..."
    }

    func setStateSaved() {
        spinner.stopAnimating()
        spinner.isHidden = true
        iconView.isHidden = false
        iconView.image = UIImage(systemName: "checkmark.circle.fill")?.withTintColor(.systemGreen, renderingMode: .alwaysOriginal)
        messageLabel.text = "Saved to Folio!"
    }

    private func handleSharedContent() {
        setStateSaving()

        guard let extensionItem = extensionContext?.inputItems.first as? NSExtensionItem,
              let itemProvider = extensionItem.attachments?.first else {
            setStateSavedWithError("No content to share")
            return
        }

        // Look for a URL in attachments
        if itemProvider.hasItemConformingToTypeIdentifier(UTType.url.identifier) {
            itemProvider.loadItem(forTypeIdentifier: UTType.url.identifier, options: nil) { (data, error) in
                if let url = data as? URL {
                    self.saveUrlToServer(url.absoluteString)
                } else {
                    self.setStateSavedWithError("Failed to get URL")
                }
            }
            return
        } else if itemProvider.hasItemConformingToTypeIdentifier(UTType.plainText.identifier) {
            itemProvider.loadItem(forTypeIdentifier: UTType.plainText.identifier, options: nil) { (data, error) in
                if let text = data as? String, let url = self.extractURL(from: text) {
                    self.saveUrlToServer(url)
                } else {
                    self.setStateSavedWithError("No valid URL found")
                }
            }
            return
        }

        setStateSavedWithError("Unsupported content type")
    }

    private func extractURL(from text: String) -> String? {
        if let url = URL(string: text), url.scheme != nil {
            return text
        }
        let detector = try? NSDataDetector(types: NSTextCheckingResult.CheckingType.link.rawValue)
        let matches = detector?.matches(in: text, options: [], range: NSRange(location: 0, length: text.utf16.count))
        return matches?.first?.url?.absoluteString
    }

    private func saveUrlToServer(_ urlString: String) {
        let token = getTokenFromAppGroup() // Replace with your method
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
        "notes": ""  
    ]
]
request.httpBody = try? JSONSerialization.data(withJSONObject: requestBody, options: [])


        let task = URLSession.shared.dataTask(with: request) { data, response, error in
            DispatchQueue.main.async {
                if let error = error {
                    self.setStateSavedWithError("Failed: (error.localizedDescription)")
                } else if let httpResp = response as? HTTPURLResponse, httpResp.statusCode >= 400 {
                    self.setStateSavedWithError("Failed ((httpResp.statusCode))")
                } else {
                    self.setStateSaved()
                    DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                        self.extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
                    }
                }
            }
        }
        task.resume()
    }

    func setStateSavedWithError(_ message: String) {
        spinner.stopAnimating()
        spinner.isHidden = true
        iconView.isHidden = false
        iconView.image = UIImage(systemName: "xmark.circle.fill")?.withTintColor(.systemRed, renderingMode: .alwaysOriginal)
        messageLabel.text = message
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
            self.extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
        }
    }

    // Shared token if needed
    private func getTokenFromAppGroup() -> String? {
        let userDefaults = UserDefaults(suiteName: "group.co.lessisbetter.folio.shared") // <- your App Group ID
        let token = userDefaults?.string(forKey: "folio_share_token")
        print("🔑 Token from App Group: \(token ?? "nil")")

        return token
    }
}

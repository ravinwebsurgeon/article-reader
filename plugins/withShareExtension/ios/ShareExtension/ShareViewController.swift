import UIKit
import Social
import MobileCoreServices
import UniformTypeIdentifiers

class ShareViewController: UIViewController {
    
    private let appGroupId = "group.co.lessisbetter.folio"
    private var statusLabel: UILabel!
    private var iconImageView: UIImageView!
    private var containerView: UIView!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        processSharedContent()
    }
    
    private func setupUI() {
        // Set background with blur effect
        let blurEffect = UIBlurEffect(style: .systemMaterial)
        let blurView = UIVisualEffectView(effect: blurEffect)
        blurView.frame = view.bounds
        blurView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.addSubview(blurView)
        
        // Container view
        containerView = UIView()
        containerView.backgroundColor = UIColor.systemBackground
        containerView.layer.cornerRadius = 16
        containerView.layer.shadowColor = UIColor.black.cgColor
        containerView.layer.shadowOpacity = 0.1
        containerView.layer.shadowOffset = CGSize(width: 0, height: 2)
        containerView.layer.shadowRadius = 8
        containerView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(containerView)
        
        // Icon
        iconImageView = UIImageView()
        iconImageView.contentMode = .scaleAspectFit
        iconImageView.tintColor = UIColor.systemBlue
        iconImageView.image = UIImage(systemName: "square.and.arrow.down")
        iconImageView.translatesAutoresizingMaskIntoConstraints = false
        containerView.addSubview(iconImageView)
        
        // Status label
        statusLabel = UILabel()
        statusLabel.text = "Saving..."
        statusLabel.textAlignment = .center
        statusLabel.font = UIFont.systemFont(ofSize: 16, weight: .medium)
        statusLabel.textColor = UIColor.label
        statusLabel.translatesAutoresizingMaskIntoConstraints = false
        containerView.addSubview(statusLabel)
        
        // Constraints
        NSLayoutConstraint.activate([
            // Container
            containerView.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            containerView.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            containerView.widthAnchor.constraint(equalToConstant: 280),
            containerView.heightAnchor.constraint(equalToConstant: 140),
            
            // Icon
            iconImageView.centerXAnchor.constraint(equalTo: containerView.centerXAnchor),
            iconImageView.topAnchor.constraint(equalTo: containerView.topAnchor, constant: 30),
            iconImageView.widthAnchor.constraint(equalToConstant: 40),
            iconImageView.heightAnchor.constraint(equalToConstant: 40),
            
            // Label
            statusLabel.centerXAnchor.constraint(equalTo: containerView.centerXAnchor),
            statusLabel.topAnchor.constraint(equalTo: iconImageView.bottomAnchor, constant: 16),
            statusLabel.leadingAnchor.constraint(equalTo: containerView.leadingAnchor, constant: 20),
            statusLabel.trailingAnchor.constraint(equalTo: containerView.trailingAnchor, constant: -20)
        ])
    }
    
    private func processSharedContent() {
        guard let extensionItem = extensionContext?.inputItems.first as? NSExtensionItem,
              let attachments = extensionItem.attachments else {
            showError("No content to share")
            return
        }
        
        // Get auth key from shared storage
        guard let authKey = getAuthKeyFromSharedStorage() else {
            showError("Please log in to Folio first")
            return
        }
        
        // Process attachments
        for attachment in attachments {
            if attachment.hasItemConformingToTypeIdentifier(UTType.url.identifier) {
                attachment.loadItem(forTypeIdentifier: UTType.url.identifier, options: nil) { [weak self] (item, error) in
                    if let url = item as? URL {
                        self?.saveToServer(url: url, authKey: authKey)
                    }
                }
            } else if attachment.hasItemConformingToTypeIdentifier(UTType.text.identifier) {
                attachment.loadItem(forTypeIdentifier: UTType.text.identifier, options: nil) { [weak self] (item, error) in
                    if let text = item as? String {
                        self?.saveToServer(text: text, authKey: authKey)
                    }
                }
            }
        }
    }
    
    private func getAuthKeyFromSharedStorage() -> String? {
        let sharedDefaults = UserDefaults(suiteName: appGroupId)
        return sharedDefaults?.string(forKey: "auth_key")
    }
    
    private func saveToServer(url: URL? = nil, text: String? = nil, authKey: String) {
        var requestBody: [String: Any] = [:]
        
        if let url = url {
            requestBody["url"] = url.absoluteString
            requestBody["type"] = "link"
        } else if let text = text {
            requestBody["content"] = text
            requestBody["type"] = "text"
        }
        
        requestBody["source"] = "share_extension"
        requestBody["timestamp"] = ISO8601DateFormatter().string(from: Date())
        
        // Create request
        guard let apiUrl = URL(string: "https://api.folio.app/items") else { return }
        var request = URLRequest(url: apiUrl)
        request.httpMethod = "POST"
        request.setValue("Bearer \(authKey)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: requestBody)
        } catch {
            showError("Failed to prepare data")
            return
        }
        
        // Send request
        let task = URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
            DispatchQueue.main.async {
                if let error = error {
                    self?.showError("Network error: \(error.localizedDescription)")
                    return
                }
                
                if let httpResponse = response as? HTTPURLResponse,
                   httpResponse.statusCode == 200 || httpResponse.statusCode == 201 {
                    self?.showSuccess()
                } else {
                    self?.showError("Failed to save")
                }
            }
        }
        task.resume()
    }
    
    private func showSuccess() {
        // Haptic feedback
        let generator = UINotificationFeedbackGenerator()
        generator.prepare()
        generator.notificationOccurred(.success)
        
        // Update UI
        UIView.animate(withDuration: 0.3) { [weak self] in
            self?.iconImageView.image = UIImage(systemName: "checkmark.square.fill")
            self?.iconImageView.tintColor = UIColor.systemGreen
            self?.statusLabel.text = "Saved to Folio."
        }
        
        // Auto close after 3 seconds
        DispatchQueue.main.asyncAfter(deadline: .now() + 3.0) { [weak self] in
            self?.extensionContext?.completeRequest(returningItems: nil, completionHandler: nil)
        }
    }
    
    private func showError(_ message: String) {
        UIView.animate(withDuration: 0.3) { [weak self] in
            self?.iconImageView.image = UIImage(systemName: "xmark.square.fill")
            self?.iconImageView.tintColor = UIColor.systemRed
            self?.statusLabel.text = message
        }
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 3.0) { [weak self] in
            self?.extensionContext?.completeRequest(returningItems: nil, completionHandler: nil)
        }
    }
}
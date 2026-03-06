import SwiftUI

// MARK: - Coffee request message composer

struct CoffeeRequestView: View {
    let profile: Profile
    @Environment(\.dismiss) private var dismiss

    @State private var message       = ""
    @State private var isLoading     = false
    @State private var errorMessage: String?
    @State private var showSuccess   = false

    private let maxChars = 500
    private var remaining: Int { maxChars - message.count }
    private var canSend: Bool { message.trimmingCharacters(in: .whitespacesAndNewlines).count >= 10 && !isLoading }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // Recipient header
                    HStack(spacing: 14) {
                        ProfilePhoto(url: profile.imageURL, name: profile.name, size: 52)
                        VStack(alignment: .leading, spacing: 4) {
                            Text("To \(profile.name)")
                                .font(.headline)
                            Text("\(profile.school) · \(profile.yearLabel)")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                    }
                    .padding(16)
                    .background {
                        if #available(iOS 26.0, *) {
                            RoundedRectangle(cornerRadius: 16, style: .continuous)
                                .fill(.clear)
                                .glassEffect(.regular, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                        } else {
                            RoundedRectangle(cornerRadius: 16, style: .continuous)
                                .fill(.regularMaterial)
                        }
                    }

                    // Message editor
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Your message")
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(.secondary)

                        TextEditor(text: $message)
                            .frame(minHeight: 160)
                            .padding(12)
                            .background(Color(.systemGroupedBackground))
                            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                            .onChange(of: message) { _, new in
                                if new.count > maxChars {
                                    message = String(new.prefix(maxChars))
                                }
                            }

                        HStack {
                            if let err = errorMessage {
                                Text(err)
                                    .font(.caption)
                                    .foregroundStyle(.red)
                            }
                            Spacer()
                            Text("\(remaining)")
                                .font(.caption.monospacedDigit())
                                .foregroundStyle(remaining < 50 ? .orange : .secondary)
                        }
                    }

                    // Tip
                    Label("Keep it genuine — mention something specific from their profile.", systemImage: "lightbulb")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .padding(12)
                        .background(Color.columbiaBlue.opacity(0.06))
                        .clipShape(RoundedRectangle(cornerRadius: 10))

                    // Send button
                    PrimaryButton(
                        title: "Send Coffee Request",
                        icon: "cup.and.saucer.fill",
                        isLoading: isLoading
                    ) { await send() }
                    .disabled(!canSend)
                }
                .padding(20)
            }
            .navigationTitle("Coffee Request")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
            .alert("Request sent!", isPresented: $showSuccess) {
                Button("Done") { dismiss() }
            } message: {
                Text("\(profile.name) will get an email and a push notification. If they're interested, they'll reply to you directly.")
            }
        }
    }

    // MARK: - Send

    private func send() async {
        isLoading    = true
        errorMessage = nil
        do {
            try await MeetingService.shared.sendCoffeeRequest(to: profile.id, message: message)
            showSuccess = true
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
}

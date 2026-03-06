import SwiftUI

// MARK: - Coffee Request Detail
// Shown when user taps a push notification. Displays the sender's full
// profile + their message, with an "Open in Mail" CTA that triggers iOS's
// native mail app picker (Mail, Gmail, Outlook, Spark, etc.).

struct CoffeeRequestDetailView: View {
    let meeting: Meeting
    @Environment(\.dismiss) private var dismiss
    @State private var senderProfile: Profile?
    @State private var isLoadingProfile = false
    @State private var showFullProfile  = false

    private var sender: Profile? { meeting.senderProfile ?? senderProfile }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    if let sender {
                        senderHeader(sender)
                        messageCard
                        mailButton(senderEmail: "\(sender.uni)@\(sender.university == "Columbia University" ? "columbia.edu" : "barnard.edu")")
                        viewProfileButton(sender)
                    } else if isLoadingProfile {
                        ProgressView("Loading…")
                            .padding(.top, 80)
                    }
                }
                .padding(.horizontal, 16)
                .padding(.top, 8)
                .padding(.bottom, 40)
            }
            .navigationTitle("Coffee Request")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button { dismiss() } label: {
                        Image(systemName: "xmark.circle.fill")
                            .symbolRenderingMode(.hierarchical)
                            .font(.title3)
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .sheet(isPresented: $showFullProfile) {
                if let sender { ProfileDetailView(profile: sender) }
            }
            .task { await loadSenderIfNeeded() }
        }
    }

    // MARK: - Sender header card

    private func senderHeader(_ sender: Profile) -> some View {
        GlassCard {
            VStack(spacing: 16) {
                ProfilePhoto(url: sender.imageURL, name: sender.name, size: 88, cornerRadius: 20)
                    .frame(maxWidth: .infinity, alignment: .center)

                VStack(spacing: 6) {
                    Text(sender.name)
                        .font(.title2.weight(.bold))
                        .multilineTextAlignment(.center)

                    if let pronouns = sender.pronouns, !pronouns.isEmpty {
                        Text(pronouns)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                }

                BadgeRow(school: sender.school, yearLabel: sender.yearLabel)

                if !sender.major.isEmpty {
                    Text(sender.major.joined(separator: " · "))
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                }
            }
            .frame(maxWidth: .infinity)
        }
    }

    // MARK: - Their message

    private var messageCard: some View {
        GlassCard {
            VStack(alignment: .leading, spacing: 12) {
                Label("Their message", systemImage: "message.fill")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.secondary)

                Text(meeting.message)
                    .font(.body)

                Text(meeting.createdAt.formatted(.relative(presentation: .named)))
                    .font(.caption)
                    .foregroundStyle(.tertiary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    // MARK: - Open in Mail CTA
    // `mailto:` triggers iOS's native app picker — Mail, Gmail, Outlook, Spark, etc.

    private func mailButton(senderEmail: String) -> some View {
        let subject = "Re: Coffee Chat on Coffee@CU"
        let urlString = "mailto:\(senderEmail)?subject=\(subject.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "")"

        return Button {
            guard let url = URL(string: urlString) else { return }
            UIApplication.shared.open(url)
        } label: {
            HStack(spacing: 12) {
                Image(systemName: "envelope.fill")
                    .font(.title3)
                VStack(alignment: .leading, spacing: 2) {
                    Text("Open in Mail")
                        .font(.headline)
                    Text(senderEmail)
                        .font(.caption)
                        .opacity(0.75)
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.caption.weight(.semibold))
                    .opacity(0.5)
            }
            .padding(18)
            .foregroundStyle(.white)
            .background(Color.columbiaBlue)
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        }
    }

    // MARK: - View full profile button

    private func viewProfileButton(_ sender: Profile) -> some View {
        GlassButton(title: "View full profile", icon: "person.fill") {
            showFullProfile = true
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: - Load sender profile if not embedded

    private func loadSenderIfNeeded() async {
        guard meeting.senderProfile == nil, senderProfile == nil else { return }
        isLoadingProfile = true
        senderProfile = try? await ProfileService.shared.fetchProfile(id: meeting.senderId)
        isLoadingProfile = false
    }
}

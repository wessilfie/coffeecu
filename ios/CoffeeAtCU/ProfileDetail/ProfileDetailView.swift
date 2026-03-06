import SwiftUI

// MARK: - Full profile detail sheet
// Mirrors the web ProfileDrawer with Liquid Glass section cards.

struct ProfileDetailView: View {
    let profile: Profile
    @Environment(\.dismiss) private var dismiss
    @State private var showCoffeeRequest = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    headerCard
                    if !profile.responses.isEmpty { qaCard }
                    if !profile.clubs.isEmpty { clubsCard }
                    if !profile.socialLinks.isEmpty { socialsCard }
                    requestButton
                        .padding(.horizontal, 0)
                        .padding(.bottom, 32)
                }
                .padding(.horizontal, 16)
                .padding(.top, 8)
            }
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
            .sheet(isPresented: $showCoffeeRequest) {
                CoffeeRequestView(profile: profile)
            }
        }
    }

    // MARK: - Header

    private var headerCard: some View {
        GlassCard {
            VStack(spacing: 16) {
                // Large photo
                ProfilePhoto(url: profile.imageURL, name: profile.name, size: 96, cornerRadius: 20)
                    .frame(maxWidth: .infinity, alignment: .center)

                VStack(spacing: 6) {
                    HStack(spacing: 8) {
                        Text(profile.name)
                            .font(.title2.weight(.bold))
                        if let pronouns = profile.pronouns, !pronouns.isEmpty {
                            Text("(\(pronouns))")
                                .font(.callout)
                                .foregroundStyle(.secondary)
                        }
                    }
                    Text(profile.uni)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                BadgeRow(school: profile.school, yearLabel: profile.yearLabel)

                if !profile.major.isEmpty {
                    Text(profile.major.joined(separator: " · "))
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                }

                if let degree = profile.degree, !degree.isEmpty {
                    Text(degree)
                        .font(.caption)
                        .foregroundStyle(.tertiary)
                }
            }
            .frame(maxWidth: .infinity)
        }
    }

    // MARK: - Q&A

    private var qaCard: some View {
        GlassCard {
            VStack(alignment: .leading, spacing: 16) {
                Label("About", systemImage: "quote.bubble")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.secondary)

                ForEach(Array(profile.responses.enumerated()), id: \.offset) { _, qa in
                    VStack(alignment: .leading, spacing: 6) {
                        Text(qa.prompt)
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(Color.columbiaBlue)
                        Text(qa.response)
                            .font(.subheadline)
                    }
                    if qa.prompt != profile.responses.last?.prompt {
                        Divider().opacity(0.4)
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    // MARK: - Clubs

    private var clubsCard: some View {
        GlassCard {
            VStack(alignment: .leading, spacing: 12) {
                Label("Clubs & groups", systemImage: "person.3")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.secondary)

                FlowLayout(spacing: 8) {
                    ForEach(profile.clubs, id: \.self) { club in
                        Text(club)
                            .font(.caption.weight(.medium))
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(Color.columbiaBlue.opacity(0.1))
                            .foregroundStyle(Color.columbiaBlue)
                            .clipShape(Capsule())
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    // MARK: - Socials

    private var socialsCard: some View {
        GlassCard {
            VStack(alignment: .leading, spacing: 12) {
                Label("Find me on", systemImage: "link")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.secondary)

                SocialLinks(links: profile.socialLinks)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    // MARK: - CTA

    private var requestButton: some View {
        PrimaryButton(
            title: "Request a Coffee Chat",
            icon: "cup.and.saucer.fill"
        ) { showCoffeeRequest = true }
    }
}

// MARK: - Simple flow layout for club chips

struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let width = proposal.width ?? 0
        var height: CGFloat = 0
        var rowWidth: CGFloat = 0
        var rowHeight: CGFloat = 0

        for view in subviews {
            let size = view.sizeThatFits(.unspecified)
            if rowWidth + size.width > width && rowWidth > 0 {
                height += rowHeight + spacing
                rowWidth = 0
                rowHeight = 0
            }
            rowWidth  += size.width + spacing
            rowHeight  = max(rowHeight, size.height)
        }
        height += rowHeight
        return CGSize(width: width, height: height)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var x = bounds.minX
        var y = bounds.minY
        var rowHeight: CGFloat = 0

        for view in subviews {
            let size = view.sizeThatFits(.unspecified)
            if x + size.width > bounds.maxX && x > bounds.minX {
                y += rowHeight + spacing
                x  = bounds.minX
                rowHeight = 0
            }
            view.place(at: CGPoint(x: x, y: y), proposal: ProposedViewSize(size))
            x         += size.width + spacing
            rowHeight  = max(rowHeight, size.height)
        }
    }
}

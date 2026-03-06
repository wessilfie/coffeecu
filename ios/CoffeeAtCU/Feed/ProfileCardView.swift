import SwiftUI

// MARK: - Profile card tile (shown in the browse grid)
// Liquid Glass surface with photo, name, school/year badges, first Q&A.

struct ProfileCardView: View {
    let profile: Profile
    var onTap: () -> Void = {}

    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: 12) {
                // Photo + name header
                HStack(spacing: 12) {
                    ProfilePhoto(url: profile.imageURL, name: profile.name, size: 48)

                    VStack(alignment: .leading, spacing: 3) {
                        Text(profile.name)
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(.primary)
                            .lineLimit(1)

                        if !profile.pronouns.isNilOrEmpty {
                            Text(profile.pronouns!)
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                    }
                }

                // School + year badges
                BadgeRow(school: profile.school, yearLabel: profile.yearLabel)

                // Majors
                if !profile.major.isEmpty {
                    Text(profile.major.joined(separator: " · "))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }

                // First Q&A response
                if let qa = profile.responses.first {
                    Divider().opacity(0.4)
                    VStack(alignment: .leading, spacing: 4) {
                        Text(qa.prompt)
                            .font(.caption2.weight(.medium))
                            .foregroundStyle(.secondary)
                        Text(qa.response)
                            .font(.caption)
                            .foregroundStyle(.primary)
                            .lineLimit(3)
                    }
                }

                // Club count pill
                if !profile.clubs.isEmpty {
                    Text("+ \(profile.clubs.count) club\(profile.clubs.count == 1 ? "" : "s")")
                        .font(.caption2)
                        .foregroundStyle(Color.columbiaBlue)
                }
            }
            .padding(16)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background {
                if #available(iOS 26.0, *) {
                    RoundedRectangle(cornerRadius: 20, style: .continuous)
                        .fill(.clear)
                        .glassEffect(.regular, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
                } else {
                    RoundedRectangle(cornerRadius: 20, style: .continuous)
                        .fill(.regularMaterial)
                }
            }
        }
        .buttonStyle(.plain)
    }
}

private extension Optional where Wrapped == String {
    var isNilOrEmpty: Bool { self == nil || self! .isEmpty }
}

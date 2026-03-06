import SwiftUI

// MARK: - Social link button row

struct SocialLinks: View {
    let links: [(label: String, systemImage: String, url: URL)]

    var body: some View {
        if !links.isEmpty {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 10) {
                    ForEach(links, id: \.label) { link in
                        Link(destination: link.url) {
                            HStack(spacing: 6) {
                                Image(systemName: link.systemImage)
                                    .font(.caption.weight(.medium))
                                Text(link.label)
                                    .font(.caption.weight(.medium))
                            }
                            .padding(.horizontal, 12)
                            .padding(.vertical, 8)
                            .foregroundStyle(Color.columbiaBlue)
                            .background {
                                if #available(iOS 26.0, *) {
                                    Capsule()
                                        .fill(.clear)
                                        .glassEffect(.regular, in: Capsule())
                                } else {
                                    Capsule().fill(.regularMaterial)
                                }
                            }
                        }
                    }
                }
                .padding(.horizontal, 2)
            }
        }
    }
}

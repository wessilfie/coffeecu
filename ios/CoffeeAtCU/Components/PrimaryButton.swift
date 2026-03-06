import SwiftUI

// MARK: - Primary Button (Columbia Blue, Liquid Glass)

struct PrimaryButton: View {
    let title: String
    var icon: String? = nil
    var isLoading = false
    var isDestructive = false
    let action: () async -> Void

    var body: some View {
        Button {
            Task { await action() }
        } label: {
            HStack(spacing: 8) {
                if isLoading {
                    ProgressView()
                        .tint(.white)
                        .scaleEffect(0.85)
                } else if let icon {
                    Image(systemName: icon)
                }
                Text(title)
                    .fontWeight(.semibold)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .foregroundStyle(.white)
            .background(
                isDestructive
                    ? Color.red
                    : Color.columbiaBlue
            )
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        }
        .disabled(isLoading)
    }
}

// MARK: - Ghost / Glass Button (secondary)

struct GlassButton: View {
    let title: String
    var icon: String? = nil
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                if let icon { Image(systemName: icon) }
                Text(title).fontWeight(.medium)
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 12)
            .foregroundStyle(.primary)
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

// MARK: - Color extensions

extension Color {
    /// Columbia's official blue: #003DA5
    static let columbiaBlue = Color(red: 0.0, green: 0.239, blue: 0.647)
    /// Columbia lion gold accent: #F2A900
    static let columbiaGold = Color(red: 0.949, green: 0.663, blue: 0.0)
    /// Limestone warm off-white: #F5F0E8
    static let limestone = Color(red: 0.961, green: 0.941, blue: 0.910)
}

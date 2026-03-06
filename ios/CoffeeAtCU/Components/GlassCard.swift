import SwiftUI

// MARK: - GlassCard
// Wraps any content in a Liquid Glass surface.
// Uses iOS 26 .glassEffect() — falls back to .regularMaterial on older OS.

struct GlassCard<Content: View>: View {
    var cornerRadius: CGFloat = 20
    var padding: EdgeInsets   = EdgeInsets(top: 16, leading: 16, bottom: 16, trailing: 16)
    @ViewBuilder var content: () -> Content

    var body: some View {
        content()
            .padding(padding)
            .background {
                if #available(iOS 26.0, *) {
                    RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                        .fill(.clear)
                        .glassEffect(.regular, in: RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
                } else {
                    RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                        .fill(.regularMaterial)
                }
            }
    }
}

// MARK: - Convenience modifier

extension View {
    func glassCard(cornerRadius: CGFloat = 20) -> some View {
        GlassCard(cornerRadius: cornerRadius) { self }
            .padding(.horizontal, 0)
    }
}

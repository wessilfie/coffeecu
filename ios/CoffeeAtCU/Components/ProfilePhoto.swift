import SwiftUI

// MARK: - Profile photo with async loading + initials fallback

struct ProfilePhoto: View {
    let url: URL?
    let name: String
    var size: CGFloat = 56
    var cornerRadius: CGFloat? = nil  // nil → circle

    private var initials: String {
        name.split(separator: " ")
            .prefix(2)
            .compactMap { $0.first.map { String($0) } }
            .joined()
    }

    var body: some View {
        Group {
            if let url {
                AsyncImage(url: url) { phase in
                    switch phase {
                    case .success(let img):
                        img.resizable().scaledToFill()
                    case .failure:
                        placeholder
                    case .empty:
                        Color.columbiaBlue.opacity(0.15)
                            .overlay { ProgressView().tint(.columbiaBlue) }
                    @unknown default:
                        placeholder
                    }
                }
            } else {
                placeholder
            }
        }
        .frame(width: size, height: size)
        .clipShape(shape)
    }

    private var placeholder: some View {
        Color.columbiaBlue.opacity(0.12)
            .overlay {
                Text(initials)
                    .font(.system(size: size * 0.36, weight: .semibold))
                    .foregroundStyle(Color.columbiaBlue)
            }
    }

    @ViewBuilder
    private var shape: some Shape {
        if let r = cornerRadius {
            RoundedRectangle(cornerRadius: r, style: .continuous)
        } else {
            Circle()
        }
    }
}

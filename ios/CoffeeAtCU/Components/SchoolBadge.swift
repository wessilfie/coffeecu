import SwiftUI

// MARK: - School / Year badge chip

struct SchoolBadge: View {
    let text: String
    var color: Color = .columbiaBlue

    var body: some View {
        Text(text)
            .font(.caption2.weight(.semibold))
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .foregroundStyle(color)
            .background(color.opacity(0.12))
            .clipShape(Capsule())
    }
}

// MARK: - School colour map (mirrors web app's badge colours)

extension Color {
    static func schoolColor(_ school: String) -> Color {
        switch school {
        case "CC":   return .columbiaBlue
        case "SEAS": return Color(red: 0.15, green: 0.5, blue: 0.15)
        case "GS":   return Color(red: 0.6,  green: 0.3, blue: 0.0)
        case "BC":   return Color(red: 0.55, green: 0.0, blue: 0.27)
        case "BUS":  return Color(red: 0.4,  green: 0.2, blue: 0.6)
        case "LAW":  return Color(red: 0.7,  green: 0.15, blue: 0.1)
        case "GSAS": return Color(red: 0.2,  green: 0.45, blue: 0.55)
        case "SIPA": return Color(red: 0.0,  green: 0.4,  blue: 0.55)
        default:     return .secondary
        }
    }
}

// MARK: - Badge row helper used in profile cards

struct BadgeRow: View {
    let school: String
    let yearLabel: String

    var body: some View {
        HStack(spacing: 6) {
            SchoolBadge(text: school, color: .schoolColor(school))
            SchoolBadge(text: yearLabel)
        }
    }
}

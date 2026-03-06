import Foundation

// MARK: - Profile

struct Profile: Identifiable, Decodable, Equatable {
    let id: UUID
    let name: String
    let uni: String
    let university: String
    let school: String
    let year: Int
    let degree: String?
    let major: [String]
    let clubs: [String]
    let pronouns: String?
    let responses: [QAResponse]
    let twitter: String?
    let facebook: String?
    let linkedin: String?
    let instagram: String?
    let youtube: String?
    let tiktok: String?
    let website: String?
    let imageUrl: String?
    let isPublic: Bool
    let isVisible: Bool
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, name, uni, university, school, year, degree, major, clubs
        case pronouns, responses, twitter, facebook, linkedin, instagram
        case youtube, tiktok, website
        case imageUrl    = "image_url"
        case isPublic    = "is_public"
        case isVisible   = "is_visible"
        case createdAt   = "created_at"
    }

    var imageURL: URL? {
        guard let s = imageUrl else { return nil }
        return URL(string: s)
    }

    var yearLabel: String {
        let current = Calendar.current.component(.year, from: Date())
        let month   = Calendar.current.component(.month, from: Date())
        let refYear = month >= 6 ? current : current - 1
        let diff    = year - refYear
        switch diff {
        case ...0:  return "Alumni"
        case 1:     return "Senior"
        case 2:     return "Junior"
        case 3:     return "Sophomore"
        default:    return "First-Year"
        }
    }

    var socialLinks: [(label: String, systemImage: String, url: URL)] {
        var links: [(String, String, URL)] = []
        func add(_ raw: String?, label: String, icon: String) {
            guard let raw, let url = URL(string: raw) else { return }
            links.append((label, icon, url))
        }
        add(linkedin,  label: "LinkedIn",  icon: "link")
        add(twitter,   label: "X / Twitter", icon: "at")
        add(instagram, label: "Instagram", icon: "camera")
        add(tiktok,    label: "TikTok",    icon: "music.note")
        add(facebook,  label: "Facebook",  icon: "person.2")
        add(youtube,   label: "YouTube",   icon: "play.rectangle")
        add(website,   label: "Website",   icon: "globe")
        return links
    }
}

// MARK: - QA Response

struct QAResponse: Codable, Equatable {
    let prompt: String
    let response: String
}

// MARK: - Filter State

struct FilterState: Equatable {
    var school: String  = ""
    var year: Int?      = nil
    var major: String   = ""
    var club: String    = ""
    var query: String   = ""

    var isActive: Bool {
        !school.isEmpty || year != nil || !major.isEmpty || !club.isEmpty
    }

    var isEmpty: Bool { !isActive && query.isEmpty }
}

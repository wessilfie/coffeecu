import Foundation
import Supabase

@MainActor
final class ProfileService {
    static let shared = ProfileService()
    private init() {}

    // MARK: - Browse profiles

    func fetchProfiles(filter: FilterState) async throws -> [Profile] {
        var query = supabase
            .from("public_profiles")
            .select("*")
            .eq("is_visible", value: true)
            .eq("is_public",  value: true)

        if !filter.school.isEmpty {
            query = query.eq("school", value: filter.school)
        }
        if let year = filter.year {
            query = query.eq("year", value: year)
        }
        if !filter.query.isEmpty {
            // Full-text search using existing fts column
            query = query.textSearch("fts", query: filter.query)
        }

        let profiles: [Profile] = try await query
            .order("created_at", ascending: false)
            .limit(200)
            .execute()
            .value

        // Shuffle for discovery (mirrors web app random sort)
        return profiles.shuffled()
    }

    // MARK: - Fetch single profile by ID

    func fetchProfile(id: UUID) async throws -> Profile {
        let profiles: [Profile] = try await supabase
            .from("public_profiles")
            .select("*")
            .eq("id", value: id.uuidString)
            .limit(1)
            .execute()
            .value

        guard let profile = profiles.first else {
            throw ProfileError.notFound
        }
        return profile
    }

    // MARK: - Fetch own profile (includes non-public fields)

    func fetchMyProfile(userId: UUID) async throws -> Profile? {
        let profiles: [Profile] = try await supabase
            .from("profiles")
            .select("*")
            .eq("id", value: userId.uuidString)
            .limit(1)
            .execute()
            .value
        return profiles.first
    }

    // MARK: - Save / update own profile

    func saveProfile(_ data: [String: AnyJSON]) async throws {
        guard let userId = await supabase.auth.currentUser?.id else { return }
        var payload = data
        payload["id"] = .string(userId.uuidString)

        try await supabase
            .from("profiles")
            .upsert(payload)
            .execute()
    }

    // MARK: - Upload profile photo

    func uploadPhoto(_ data: Data, mimeType: String) async throws -> String {
        guard let userId = await supabase.auth.currentUser?.id else {
            throw ProfileError.unauthenticated
        }
        let path = "\(userId.uuidString)/avatar.jpg"

        try await supabase.storage
            .from("profile-photos")
            .upload(path, data: data, options: FileOptions(contentType: mimeType, upsert: true))

        let urlResponse = try await supabase.storage
            .from("profile-photos")
            .createSignedURL(path: path, expiresIn: 60 * 60 * 24 * 365)

        return urlResponse.absoluteString
    }
}

enum ProfileError: LocalizedError {
    case notFound
    case unauthenticated

    var errorDescription: String? {
        switch self {
        case .notFound:       return "Profile not found."
        case .unauthenticated: return "You must be signed in."
        }
    }
}

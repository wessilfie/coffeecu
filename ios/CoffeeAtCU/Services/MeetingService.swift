import Foundation

// MARK: - Coffee request (send)
// Calls the existing Next.js API route which handles rate limiting,
// dedup, blacklist, and suspension checks atomically in PostgreSQL.

@MainActor
final class MeetingService {
    static let shared = MeetingService()
    private init() {}

    // MARK: - Send a coffee request

    func sendCoffeeRequest(to receiverId: UUID, message: String) async throws {
        guard let session = try? await supabase.auth.session else {
            throw MeetingError.unauthenticated
        }

        let url = URL(string: "\(Config.appURL)/api/coffee-request")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")

        let body = CoffeeRequestBody(receiverId: receiverId.uuidString, message: message)
        request.httpBody = try JSONEncoder().encode(body)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let http = response as? HTTPURLResponse else {
            throw MeetingError.networkError
        }

        switch http.statusCode {
        case 200, 201:
            return
        case 429:
            throw MeetingError.rateLimited
        case 409:
            throw MeetingError.alreadySent
        default:
            let msg = (try? JSONDecoder().decode([String: String].self, from: data))?["error"]
            throw MeetingError.serverError(msg ?? "Something went wrong.")
        }
    }

    // MARK: - Fetch received requests (inbox)

    func fetchReceivedRequests() async throws -> [Meeting] {
        guard let userId = try? await supabase.auth.currentUser?.id else { return [] }

        let meetings: [Meeting] = try await supabase
            .from("meetings")
            .select("*, sender:sender_id(*)")
            .eq("receiver_id", value: userId.uuidString)
            .order("created_at", ascending: false)
            .execute()
            .value

        return meetings
    }

    // MARK: - Fetch a single meeting by ID

    func fetchMeeting(id: UUID) async throws -> Meeting {
        let meetings: [Meeting] = try await supabase
            .from("meetings")
            .select("*, sender:sender_id(*)")
            .eq("id", value: id.uuidString)
            .limit(1)
            .execute()
            .value

        guard let meeting = meetings.first else {
            throw MeetingError.notFound
        }
        return meeting
    }
}

// MARK: - Meeting errors

enum MeetingError: LocalizedError {
    case unauthenticated
    case rateLimited
    case alreadySent
    case notFound
    case networkError
    case serverError(String)

    var errorDescription: String? {
        switch self {
        case .unauthenticated:      return "Sign in to send coffee requests."
        case .rateLimited:          return "You've sent \(Config.dailyRequestLimit) requests today. Try again tomorrow."
        case .alreadySent:          return "You've already sent a request to this person."
        case .notFound:             return "Request not found."
        case .networkError:         return "Network error. Please check your connection."
        case .serverError(let msg): return msg
        }
    }
}

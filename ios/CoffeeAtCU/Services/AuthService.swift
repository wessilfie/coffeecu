import Foundation
import Supabase

@MainActor
@Observable
final class AuthService {
    static let shared = AuthService()

    var currentUser: User?
    var isAuthenticated: Bool { currentUser != nil }
    var isLoading = true

    private init() {
        Task { await startListening() }
    }

    // MARK: - Auth state listener

    private func startListening() async {
        isLoading = true
        for await (event, session) in await supabase.auth.authStateChanges {
            switch event {
            case .initialSession, .signedIn, .tokenRefreshed:
                currentUser = session?.user
            case .signedOut, .userDeleted:
                currentUser = nil
            default:
                break
            }
            isLoading = false
        }
    }

    // MARK: - Sign up

    func signUp(email: String, password: String) async throws {
        guard isColumbia(email: email) else {
            throw AuthError.invalidDomain
        }
        try await supabase.auth.signUp(email: email, password: password)
    }

    // MARK: - Sign in

    func signIn(email: String, password: String) async throws {
        guard isColumbia(email: email) else {
            throw AuthError.invalidDomain
        }
        try await supabase.auth.signIn(email: email, password: password)
    }

    // MARK: - Sign out

    func signOut() async throws {
        try await supabase.auth.signOut()
    }

    // MARK: - Reset password

    func resetPassword(email: String) async throws {
        try await supabase.auth.resetPasswordForEmail(email)
    }

    // MARK: - Domain validation

    private func isColumbia(email: String) -> Bool {
        Config.allowedDomains.contains(where: { email.lowercased().hasSuffix("@\($0)") })
    }
}

// MARK: - Auth errors

enum AuthError: LocalizedError {
    case invalidDomain

    var errorDescription: String? {
        switch self {
        case .invalidDomain:
            return "Use your @columbia.edu or @barnard.edu email address."
        }
    }
}

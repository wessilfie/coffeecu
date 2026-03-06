import Foundation

@MainActor
@Observable
final class AuthViewModel {
    enum Mode { case signIn, signUp }

    var mode: Mode      = .signIn
    var email           = ""
    var password        = ""
    var confirmPassword = ""
    var isLoading       = false
    var errorMessage: String?
    var showVerificationBanner = false

    private let auth = AuthService.shared

    var canSubmit: Bool {
        !email.isEmpty && password.count >= 8 &&
        (mode == .signIn || password == confirmPassword)
    }

    // MARK: - Submit

    func submit() async {
        guard canSubmit else { return }
        errorMessage = nil
        isLoading    = true
        defer { isLoading = false }

        do {
            switch mode {
            case .signIn:
                try await auth.signIn(email: email, password: password)
            case .signUp:
                try await auth.signUp(email: email, password: password)
                showVerificationBanner = true
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    // MARK: - Reset password

    func resetPassword() async {
        guard !email.isEmpty else {
            errorMessage = "Enter your Columbia email first."
            return
        }
        isLoading = true
        defer { isLoading = false }
        do {
            try await auth.resetPassword(email: email)
            errorMessage = "Password reset email sent."
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func toggleMode() {
        mode            = mode == .signIn ? .signUp : .signIn
        errorMessage    = nil
        password        = ""
        confirmPassword = ""
    }
}

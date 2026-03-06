import SwiftUI

// MARK: - Auth screen
// Columbia blue gradient + Liquid Glass card, email/password only.

struct AuthView: View {
    @State private var vm = AuthViewModel()
    @FocusState private var focus: Field?

    enum Field { case email, password, confirm }

    var body: some View {
        ZStack {
            // Background — Columbia blue gradient with limestone warmth
            LinearGradient(
                colors: [Color.columbiaBlue, Color(red: 0, green: 0.08, blue: 0.28)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            ScrollView {
                VStack(spacing: 0) {
                    Spacer().frame(height: 64)

                    // Wordmark
                    VStack(spacing: 6) {
                        Text("Coffee")
                            .font(.system(size: 42, weight: .bold, design: .serif))
                            .foregroundStyle(.white)
                        + Text("@CU")
                            .font(.system(size: 42, weight: .bold, design: .serif))
                            .foregroundStyle(Color.columbiaGold)

                        Text("Columbia's community coffee board")
                            .font(.subheadline)
                            .foregroundStyle(.white.opacity(0.75))
                    }
                    .padding(.bottom, 48)

                    // Glass card
                    VStack(spacing: 20) {
                        // Mode toggle
                        HStack(spacing: 0) {
                            modeTab("Sign In",  mode: .signIn)
                            modeTab("Sign Up",  mode: .signUp)
                        }
                        .background(.white.opacity(0.15))
                        .clipShape(RoundedRectangle(cornerRadius: 10))

                        // Fields
                        VStack(spacing: 14) {
                            field("columbia.edu email", text: $vm.email, type: .emailAddress)
                                .focused($focus, equals: .email)

                            field("Password", text: $vm.password, secure: true)
                                .focused($focus, equals: .password)

                            if vm.mode == .signUp {
                                field("Confirm password", text: $vm.confirmPassword, secure: true)
                                    .focused($focus, equals: .confirm)
                                    .transition(.move(edge: .top).combined(with: .opacity))
                            }
                        }
                        .animation(.spring(duration: 0.3), value: vm.mode)

                        // Error
                        if let err = vm.errorMessage {
                            Text(err)
                                .font(.caption)
                                .foregroundStyle(.red)
                                .multilineTextAlignment(.center)
                                .transition(.opacity)
                        }

                        // Submit
                        PrimaryButton(
                            title: vm.mode == .signIn ? "Sign In" : "Create Account",
                            isLoading: vm.isLoading
                        ) { await vm.submit() }

                        // Forgot password
                        if vm.mode == .signIn {
                            Button("Forgot password?") { Task { await vm.resetPassword() } }
                                .font(.caption)
                                .foregroundStyle(.white.opacity(0.7))
                        }
                    }
                    .padding(24)
                    .background {
                        if #available(iOS 26.0, *) {
                            RoundedRectangle(cornerRadius: 28, style: .continuous)
                                .fill(.clear)
                                .glassEffect(.regular, in: RoundedRectangle(cornerRadius: 28, style: .continuous))
                        } else {
                            RoundedRectangle(cornerRadius: 28, style: .continuous)
                                .fill(.ultraThinMaterial)
                        }
                    }
                    .padding(.horizontal, 24)

                    // Verification banner
                    if vm.showVerificationBanner {
                        verificationBanner
                            .padding(.top, 16)
                            .padding(.horizontal, 24)
                            .transition(.move(edge: .bottom).combined(with: .opacity))
                    }

                    Spacer().frame(height: 48)
                }
            }
        }
        .animation(.spring(duration: 0.35), value: vm.showVerificationBanner)
    }

    // MARK: - Sub-views

    @ViewBuilder
    private func modeTab(_ label: String, mode: AuthViewModel.Mode) -> some View {
        Button(label) { vm.toggleMode() }
            .font(.subheadline.weight(.semibold))
            .foregroundStyle(vm.mode == mode ? .white : .white.opacity(0.5))
            .frame(maxWidth: .infinity)
            .padding(.vertical, 8)
            .background(vm.mode == mode ? Color.columbiaBlue : .clear)
            .clipShape(RoundedRectangle(cornerRadius: 10))
            .animation(.easeInOut(duration: 0.2), value: vm.mode)
    }

    private func field(
        _ placeholder: String,
        text: Binding<String>,
        type: UITextContentType? = nil,
        secure: Bool = false
    ) -> some View {
        Group {
            if secure {
                SecureField(placeholder, text: text)
            } else {
                TextField(placeholder, text: text)
                    .textInputAutocapitalization(.never)
                    .keyboardType(.emailAddress)
            }
        }
        .padding(14)
        .background(.white.opacity(0.1))
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        .foregroundStyle(.white)
        .tint(.white)
    }

    private var verificationBanner: some View {
        HStack(spacing: 12) {
            Image(systemName: "envelope.badge.fill")
                .foregroundStyle(Color.columbiaGold)
            VStack(alignment: .leading, spacing: 2) {
                Text("Check your inbox").font(.subheadline.weight(.semibold))
                Text("Click the link in your email to verify your account.")
                    .font(.caption).opacity(0.8)
            }
        }
        .padding(16)
        .foregroundStyle(.white)
        .background {
            if #available(iOS 26.0, *) {
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .fill(.clear)
                    .glassEffect(.regular, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
            } else {
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .fill(.ultraThinMaterial)
            }
        }
    }
}

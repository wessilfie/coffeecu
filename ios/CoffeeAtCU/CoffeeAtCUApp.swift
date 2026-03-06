import SwiftUI

@main
struct CoffeeAtCUApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    @State private var auth  = AuthService.shared
    @State private var notif = NotificationService.shared

    var body: some Scene {
        WindowGroup {
            Group {
                if auth.isLoading {
                    // Splash — Columbia blue while session is restored
                    ZStack {
                        Color.columbiaBlue.ignoresSafeArea()
                        VStack(spacing: 12) {
                            ProgressView().tint(.white)
                            Text("Coffee@CU")
                                .font(.system(.title2, design: .serif, weight: .bold))
                                .foregroundStyle(.white)
                        }
                    }
                } else if auth.isAuthenticated {
                    MainTabView()
                        .environment(notif)
                        .task {
                            // Request push permission once authenticated
                            await notif.requestPermissionAndRegister()
                        }
                } else {
                    AuthView()
                }
            }
            .animation(.easeInOut(duration: 0.3), value: auth.isAuthenticated)
            .animation(.easeInOut(duration: 0.3), value: auth.isLoading)
        }
    }
}

// MARK: - Main tab view

struct MainTabView: View {
    @Environment(NotificationService.self) private var notif
    @State private var notificationsVM = NotificationsViewModel()

    var body: some View {
        TabView {
            Tab("Browse", systemImage: "cup.and.saucer.fill") {
                FeedView()
            }

            Tab("Requests", systemImage: "bell.fill") {
                NotificationInboxView()
            }
            .badge(notificationsVM.unreadCount)

            Tab("Profile", systemImage: "person.fill") {
                MyProfileView()
            }
        }
        // iOS 26 TabView gets Liquid Glass tab bar automatically
        .task { await notificationsVM.load() }
        // When a push arrives, bump the badge by reloading
        .onChange(of: notif.pendingMeetingId) { _, _ in
            Task { await notificationsVM.load() }
        }
    }
}

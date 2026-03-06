import Foundation
import UserNotifications
import UIKit

// MARK: - Push notification registration & routing

@MainActor
@Observable
final class NotificationService: NSObject {
    static let shared = NotificationService()

    /// Set by AppDelegate when the user taps a push notification.
    /// The app navigates to CoffeeRequestDetailView when this is set.
    var pendingMeetingId: UUID?

    private override init() {
        super.init()
    }

    // MARK: - Request permission & register

    func requestPermissionAndRegister() async {
        let center = UNUserNotificationCenter.current()
        center.delegate = self

        do {
            let granted = try await center.requestAuthorization(options: [.alert, .badge, .sound])
            if granted {
                await MainActor.run {
                    UIApplication.shared.registerForRemoteNotifications()
                }
            }
        } catch {
            print("[Notifications] Permission error: \(error)")
        }
    }

    // MARK: - Upload device token to Supabase

    func uploadDeviceToken(_ tokenData: Data) async {
        let token = tokenData.map { String(format: "%02.2hhx", $0) }.joined()

        guard let userId = try? await supabase.auth.currentUser?.id else { return }

        let payload = DeviceTokenPayload(
            userId: userId,
            token: token,
            platform: "ios",
            updatedAt: Date()
        )

        do {
            try await supabase
                .from("device_tokens")
                .upsert(payload, onConflict: "user_id")
                .execute()
        } catch {
            print("[Notifications] Token upload failed: \(error)")
        }
    }

    // MARK: - Remove token on sign-out

    func removeDeviceToken() async {
        guard let userId = try? await supabase.auth.currentUser?.id else { return }
        do {
            try await supabase
                .from("device_tokens")
                .delete()
                .eq("user_id", value: userId.uuidString)
                .execute()
        } catch {
            print("[Notifications] Token removal failed: \(error)")
        }
    }

    // MARK: - Handle notification payload

    func handleNotification(userInfo: [AnyHashable: Any]) {
        if let idString = userInfo["meeting_id"] as? String,
           let meetingId = UUID(uuidString: idString) {
            pendingMeetingId = meetingId
        }
    }

    // MARK: - Clear badge

    func clearBadge() {
        UNUserNotificationCenter.current().setBadgeCount(0)
    }
}

// MARK: - UNUserNotificationCenterDelegate

extension NotificationService: UNUserNotificationCenterDelegate {
    // Show banner even when app is in foreground
    nonisolated func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification
    ) async -> UNNotificationPresentationOptions {
        [.banner, .sound, .badge]
    }

    // Handle tap on notification
    nonisolated func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse
    ) async {
        let userInfo = response.notification.request.content.userInfo
        await MainActor.run {
            NotificationService.shared.handleNotification(userInfo: userInfo)
        }
    }
}

import Foundation

@MainActor
@Observable
final class NotificationsViewModel {
    var meetings: [Meeting]  = []
    var isLoading            = false
    var error: String?
    var selectedMeeting: Meeting?

    private let service = MeetingService.shared

    var unreadCount: Int { meetings.filter { !$0.isRead }.count }

    func load() async {
        isLoading = true
        error     = nil
        do {
            meetings = try await service.fetchReceivedRequests()
        } catch {
            self.error = error.localizedDescription
        }
        isLoading = false
    }

    func markRead(_ meeting: Meeting) {
        if let idx = meetings.firstIndex(where: { $0.id == meeting.id }) {
            meetings[idx].isRead = true
        }
    }

    /// Called when app opens from a push notification tap
    func openMeeting(id: UUID) async {
        // If already loaded, pick from list
        if let existing = meetings.first(where: { $0.id == id }) {
            selectedMeeting = existing
            return
        }
        // Otherwise fetch it
        do {
            let meeting = try await service.fetchMeeting(id: id)
            meetings.insert(meeting, at: 0)
            selectedMeeting = meeting
        } catch {
            self.error = error.localizedDescription
        }
    }
}

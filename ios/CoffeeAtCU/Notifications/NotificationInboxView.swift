import SwiftUI

// MARK: - Notification inbox — list of received coffee requests

struct NotificationInboxView: View {
    @State private var vm = NotificationsViewModel()
    @Environment(NotificationService.self) private var notifService

    var body: some View {
        NavigationStack {
            Group {
                if vm.isLoading && vm.meetings.isEmpty {
                    ProgressView("Loading requests…")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if vm.meetings.isEmpty {
                    ContentUnavailableView(
                        "No requests yet",
                        systemImage: "cup.and.saucer",
                        description: Text("When someone sends you a coffee request, it'll appear here.")
                    )
                } else {
                    list
                }
            }
            .navigationTitle("Requests")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                if vm.unreadCount > 0 {
                    ToolbarItem(placement: .topBarTrailing) {
                        Text("\(vm.unreadCount) new")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(Color.columbiaBlue)
                    }
                }
            }
            .refreshable { await vm.load() }
            .task { await vm.load() }
            // Handle deep link from push notification tap
            .onChange(of: notifService.pendingMeetingId) { _, id in
                guard let id else { return }
                Task {
                    await vm.openMeeting(id: id)
                    notifService.pendingMeetingId = nil
                    notifService.clearBadge()
                }
            }
            .sheet(item: $vm.selectedMeeting) { meeting in
                CoffeeRequestDetailView(meeting: meeting)
                    .onAppear { vm.markRead(meeting) }
            }
        }
    }

    // MARK: - List

    private var list: some View {
        List {
            ForEach(vm.meetings) { meeting in
                MeetingRow(meeting: meeting)
                    .listRowBackground(Color.clear)
                    .listRowSeparator(.hidden)
                    .listRowInsets(EdgeInsets(top: 6, leading: 16, bottom: 6, trailing: 16))
                    .onTapGesture {
                        vm.selectedMeeting = meeting
                        vm.markRead(meeting)
                        notifService.clearBadge()
                    }
            }
        }
        .listStyle(.plain)
        .scrollContentBackground(.hidden)
    }
}

// MARK: - Meeting row cell

private struct MeetingRow: View {
    let meeting: Meeting

    private var sender: Profile? { meeting.senderProfile }
    private var name:   String   { sender?.name ?? "Someone" }
    private var school: String   { sender?.school ?? "" }
    private var photoURL: URL?   { sender?.imageURL }

    var body: some View {
        HStack(spacing: 14) {
            // Unread dot
            Circle()
                .fill(meeting.isRead ? .clear : Color.columbiaBlue)
                .frame(width: 8, height: 8)

            ProfilePhoto(url: photoURL, name: name, size: 44)

            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(name).font(.subheadline.weight(.semibold))
                    if !school.isEmpty {
                        SchoolBadge(text: school, color: .schoolColor(school))
                    }
                    Spacer()
                    Text(meeting.createdAt.formatted(.relative(presentation: .named)))
                        .font(.caption2)
                        .foregroundStyle(.tertiary)
                }
                Text(meeting.message)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
            }
        }
        .padding(14)
        .background {
            if #available(iOS 26.0, *) {
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .fill(.clear)
                    .glassEffect(.regular, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
            } else {
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .fill(.regularMaterial)
            }
        }
    }
}

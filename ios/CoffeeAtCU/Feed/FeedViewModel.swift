import Foundation

@MainActor
@Observable
final class FeedViewModel {
    var profiles: [Profile]   = []
    var isLoading             = false
    var error: String?
    var filter                = FilterState()
    var showFilters           = false
    var selectedProfile: Profile?

    private let service = ProfileService.shared

    func load() async {
        isLoading = true
        error     = nil
        do {
            profiles  = try await service.fetchProfiles(filter: filter)
        } catch {
            self.error = error.localizedDescription
        }
        isLoading = false
    }

    func applyFilter(_ f: FilterState) async {
        filter = f
        await load()
    }

    func clearFilters() async {
        filter = FilterState()
        await load()
    }
}

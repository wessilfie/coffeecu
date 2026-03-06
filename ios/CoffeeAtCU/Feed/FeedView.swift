import SwiftUI

// MARK: - Main browse feed — two-column Liquid Glass card grid

struct FeedView: View {
    @State private var vm = FeedViewModel()
    private let columns = [
        GridItem(.flexible(), spacing: 12),
        GridItem(.flexible(), spacing: 12)
    ]

    var body: some View {
        NavigationStack {
            ScrollView {
                LazyVGrid(columns: columns, spacing: 12) {
                    ForEach(vm.profiles) { profile in
                        ProfileCardView(profile: profile) {
                            vm.selectedProfile = profile
                        }
                    }
                }
                .padding(.horizontal, 16)
                .padding(.top, 8)

                if vm.isLoading {
                    ProgressView()
                        .padding(.top, 48)
                }

                if let err = vm.error {
                    ContentUnavailableView(
                        "Couldn't load profiles",
                        systemImage: "wifi.slash",
                        description: Text(err)
                    )
                    .padding(.top, 48)
                }

                if !vm.isLoading && vm.profiles.isEmpty && vm.error == nil {
                    ContentUnavailableView(
                        "No profiles found",
                        systemImage: "cup.and.saucer",
                        description: Text(vm.filter.isActive ? "Try adjusting your filters." : "Check back soon!")
                    )
                    .padding(.top, 48)
                }
            }
            .navigationTitle("Coffee@CU")
            .navigationBarTitleDisplayMode(.large)
            .searchable(text: $vm.filter.query, prompt: "Search name, major, clubs…")
            .onSubmit(of: .search) { Task { await vm.load() } }
            .onChange(of: vm.filter.query) { _, new in
                if new.isEmpty { Task { await vm.load() } }
            }
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        vm.showFilters = true
                    } label: {
                        Label("Filter", systemImage: vm.filter.isActive ? "line.3.horizontal.decrease.circle.fill" : "line.3.horizontal.decrease.circle")
                            .symbolRenderingMode(.hierarchical)
                            .foregroundStyle(vm.filter.isActive ? Color.columbiaBlue : .primary)
                    }
                }
            }
            .sheet(isPresented: $vm.showFilters) {
                FilterSheetView(filter: $vm.filter) { newFilter in
                    await vm.applyFilter(newFilter)
                }
            }
            .sheet(item: $vm.selectedProfile) { profile in
                ProfileDetailView(profile: profile)
            }
            .refreshable { await vm.load() }
            .task { await vm.load() }
        }
    }
}

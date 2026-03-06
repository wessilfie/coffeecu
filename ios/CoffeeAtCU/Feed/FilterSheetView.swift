import SwiftUI

// MARK: - Filter bottom sheet

struct FilterSheetView: View {
    @Binding var filter: FilterState
    var onApply: (FilterState) async -> Void
    @Environment(\.dismiss) private var dismiss

    @State private var draft: FilterState

    init(filter: Binding<FilterState>, onApply: @escaping (FilterState) async -> Void) {
        self._filter  = filter
        self.onApply  = onApply
        self._draft   = State(initialValue: filter.wrappedValue)
    }

    private let schools = [
        "CC", "SEAS", "GS", "BC", "GSAS", "BUS", "LAW",
        "SIPA", "GSAPP", "SOA", "SW", "PH", "JRN", "SPS", "DM", "NRS", "VPS", "TC", "CS"
    ]

    private let currentYear = Calendar.current.component(.year, from: Date())
    private var graduationYears: [Int] {
        (currentYear...currentYear + 5).reversed().map { $0 }
    }

    var body: some View {
        NavigationStack {
            Form {
                // School picker
                Section("School") {
                    Picker("School", selection: $draft.school) {
                        Text("Any school").tag("")
                        ForEach(schools, id: \.self) { Text($0).tag($0) }
                    }
                    .pickerStyle(.menu)
                }

                // Graduation year
                Section("Graduation year") {
                    Picker("Year", selection: $draft.year) {
                        Text("Any year").tag(Optional<Int>.none)
                        ForEach(graduationYears, id: \.self) { y in
                            Text(String(y)).tag(Optional(y))
                        }
                    }
                    .pickerStyle(.menu)
                }

                // Major text field
                Section("Major") {
                    TextField("e.g. Computer Science", text: $draft.major)
                        .textInputAutocapitalization(.words)
                }

                // Club text field
                Section("Club / group") {
                    TextField("e.g. Columbia Chess", text: $draft.club)
                        .textInputAutocapitalization(.words)
                }
            }
            .navigationTitle("Filter")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Clear") {
                        draft = FilterState()
                    }
                    .foregroundStyle(.red)
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Apply") {
                        Task {
                            await onApply(draft)
                            dismiss()
                        }
                    }
                    .fontWeight(.semibold)
                }
            }
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
        .presentationBackground(.regularMaterial)
    }
}

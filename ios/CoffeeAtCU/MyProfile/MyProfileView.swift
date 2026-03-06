import SwiftUI
import PhotosUI

// MARK: - My Profile — view & edit own profile

struct MyProfileView: View {
    @State private var vm = MyProfileViewModel()
    @State private var isEditing = false

    private let schools = ["CC","SEAS","GS","BC","GSAS","BUS","LAW","SIPA","GSAPP","SOA","SW","PH","JRN","SPS","DM","NRS","VPS","TC","CS"]

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    if vm.isLoading {
                        ProgressView().padding(.top, 80)
                    } else if let profile = vm.profile {
                        photoSection(profile)
                        infoSection(profile)
                        if isEditing { editSection }
                        signOutButton
                    } else {
                        ContentUnavailableView(
                            "No profile yet",
                            systemImage: "person.crop.circle.badge.plus",
                            description: Text("Complete your profile to appear in the community feed.")
                        )
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
            }
            .navigationTitle("My Profile")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button(isEditing ? "Done" : "Edit") {
                        if isEditing { Task { await vm.save() } }
                        withAnimation { isEditing.toggle() }
                    }
                    .fontWeight(.semibold)
                }
            }
            .alert("Saved", isPresented: .constant(vm.successMessage != nil)) {
                Button("OK") { vm.successMessage = nil }
            } message: {
                Text(vm.successMessage ?? "")
            }
            .alert("Error", isPresented: .constant(vm.error != nil)) {
                Button("OK") { vm.error = nil }
            } message: {
                Text(vm.error ?? "")
            }
            .task { await vm.load() }
            .onChange(of: vm.selectedPhotoItem) { _, _ in Task { await vm.uploadPhoto() } }
        }
    }

    // MARK: - Photo

    private func photoSection(_ profile: Profile) -> some View {
        GlassCard {
            VStack(spacing: 14) {
                ZStack(alignment: .bottomTrailing) {
                    ProfilePhoto(url: profile.imageURL, name: profile.name, size: 96, cornerRadius: 20)

                    if isEditing {
                        PhotosPicker(selection: $vm.selectedPhotoItem, matching: .images) {
                            Image(systemName: "camera.fill")
                                .font(.caption.weight(.bold))
                                .padding(8)
                                .background(Color.columbiaBlue)
                                .foregroundStyle(.white)
                                .clipShape(Circle())
                        }
                        .offset(x: 6, y: 6)
                    }
                }

                VStack(spacing: 4) {
                    Text(profile.name)
                        .font(.title3.weight(.bold))
                    Text(profile.uni)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                BadgeRow(school: profile.school, yearLabel: profile.yearLabel)
            }
            .frame(maxWidth: .infinity)
        }
    }

    // MARK: - Info (read-only)

    private func infoSection(_ profile: Profile) -> some View {
        GlassCard {
            VStack(alignment: .leading, spacing: 14) {
                if !profile.major.isEmpty {
                    labeledRow("Major", value: profile.major.joined(separator: " · "))
                }
                if let degree = profile.degree, !degree.isEmpty {
                    labeledRow("Degree", value: degree)
                }
                if !profile.clubs.isEmpty {
                    labeledRow("Clubs", value: "\(profile.clubs.count) groups")
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private func labeledRow(_ label: String, value: String) -> some View {
        HStack {
            Text(label).foregroundStyle(.secondary).font(.subheadline)
            Spacer()
            Text(value).font(.subheadline.weight(.medium))
        }
    }

    // MARK: - Edit form

    private var editSection: some View {
        GlassCard {
            VStack(alignment: .leading, spacing: 18) {
                Text("Edit profile")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.secondary)

                editField("Name", binding: $vm.name)
                editField("Pronouns", binding: $vm.pronouns)

                VStack(alignment: .leading, spacing: 6) {
                    Text("School").font(.caption).foregroundStyle(.secondary)
                    Picker("School", selection: $vm.school) {
                        ForEach(schools, id: \.self) { Text($0).tag($0) }
                    }
                    .pickerStyle(.menu)
                }

                Divider().opacity(0.4)
                Text("Socials").font(.caption).foregroundStyle(.secondary)

                editField("LinkedIn URL", binding: $vm.linkedin)
                    .keyboardType(.URL)
                editField("Instagram URL", binding: $vm.instagram)
                    .keyboardType(.URL)
                editField("X / Twitter URL", binding: $vm.twitter)
                    .keyboardType(.URL)
                editField("Website", binding: $vm.website)
                    .keyboardType(.URL)

                PrimaryButton(title: "Save changes", isLoading: vm.isSaving) {
                    await vm.save()
                    withAnimation { isEditing = false }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .transition(.move(edge: .top).combined(with: .opacity))
    }

    private func editField(_ label: String, binding: Binding<String>) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label).font(.caption).foregroundStyle(.secondary)
            TextField(label, text: binding)
                .padding(12)
                .background(Color(.systemGroupedBackground))
                .clipShape(RoundedRectangle(cornerRadius: 10))
                .autocorrectionDisabled()
                .textInputAutocapitalization(.never)
        }
    }

    // MARK: - Sign out

    private var signOutButton: some View {
        PrimaryButton(title: "Sign Out", isDestructive: true) {
            await vm.signOut()
        }
        .padding(.top, 8)
    }
}

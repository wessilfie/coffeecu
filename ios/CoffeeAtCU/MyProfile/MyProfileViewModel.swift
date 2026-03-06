import Foundation
import PhotosUI
import SwiftUI

@MainActor
@Observable
final class MyProfileViewModel {
    var profile: Profile?
    var isLoading  = false
    var isSaving   = false
    var error: String?
    var successMessage: String?

    // Editable fields
    var name        = ""
    var pronouns    = ""
    var school      = ""
    var major: [String] = []
    var clubs: [String] = []
    var linkedin    = ""
    var instagram   = ""
    var twitter     = ""
    var website     = ""

    // Photo
    var selectedPhotoItem: PhotosPickerItem?
    var newPhotoData: Data?
    var isUploadingPhoto = false

    private let profileService = ProfileService.shared

    func load() async {
        guard let userId = try? await supabase.auth.currentUser?.id else { return }
        isLoading = true
        defer { isLoading = false }
        do {
            profile   = try await profileService.fetchMyProfile(userId: userId)
            populateFields()
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func populateFields() {
        guard let p = profile else { return }
        name      = p.name
        pronouns  = p.pronouns ?? ""
        school    = p.school
        major     = p.major
        clubs     = p.clubs
        linkedin  = p.linkedin ?? ""
        instagram = p.instagram ?? ""
        twitter   = p.twitter ?? ""
        website   = p.website ?? ""
    }

    func uploadPhoto() async {
        guard let item = selectedPhotoItem else { return }
        isUploadingPhoto = true
        defer { isUploadingPhoto = false }

        do {
            guard let data = try await item.loadTransferable(type: Data.self) else { return }
            newPhotoData = data
            let url = try await profileService.uploadPhoto(data, mimeType: "image/jpeg")
            successMessage = "Photo updated!"
            // Re-load profile to get new image_url
            await load()
            _ = url
        } catch {
            self.error = error.localizedDescription
        }
    }

    func save() async {
        isSaving = true
        error    = nil
        defer { isSaving = false }
        do {
            var payload: [String: AnyJSON] = [
                "name":     .string(name.trimmingCharacters(in: .whitespaces)),
                "school":   .string(school),
                "major":    .array(major.map { .string($0) }),
                "clubs":    .array(clubs.map { .string($0) }),
            ]
            if !pronouns.isEmpty  { payload["pronouns"]  = .string(pronouns)  }
            if !linkedin.isEmpty  { payload["linkedin"]   = .string(linkedin)  }
            if !instagram.isEmpty { payload["instagram"]  = .string(instagram) }
            if !twitter.isEmpty   { payload["twitter"]    = .string(twitter)   }
            if !website.isEmpty   { payload["website"]    = .string(website)   }

            try await profileService.saveProfile(payload)
            successMessage = "Profile saved!"
        } catch {
            self.error = error.localizedDescription
        }
    }

    func signOut() async {
        await NotificationService.shared.removeDeviceToken()
        try? await AuthService.shared.signOut()
    }
}

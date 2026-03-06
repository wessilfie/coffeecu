import Foundation

enum Config {
    // MARK: - Supabase
    /// Replace with your project's values from supabase.com → Settings → API
    static let supabaseURL = "https://YOUR_PROJECT.supabase.co"
    static let supabaseAnonKey = "YOUR_ANON_KEY"

    // MARK: - App
    static let appURL = "https://coffeeatcu.app"
    static let dailyRequestLimit = 3
    static let allowedDomains = ["columbia.edu", "barnard.edu"]

    // MARK: - Deep links
    static let urlScheme = "coffeeatcu"
}

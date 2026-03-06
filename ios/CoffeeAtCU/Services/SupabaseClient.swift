import Supabase
import Foundation

// MARK: - Shared Supabase client

let supabase = SupabaseClient(
    supabaseURL: URL(string: Config.supabaseURL)!,
    supabaseKey: Config.supabaseAnonKey
)

// MARK: - JSON decoder used for all Supabase responses

extension JSONDecoder {
    static let supabase: JSONDecoder = {
        let d = JSONDecoder()
        d.keyDecodingStrategy   = .convertFromSnakeCase
        d.dateDecodingStrategy  = .iso8601
        return d
    }()
}

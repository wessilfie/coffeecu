import Foundation

// MARK: - Meeting (received coffee request)

struct Meeting: Identifiable, Decodable {
    let id: UUID
    let senderId: UUID
    let receiverId: UUID
    let message: String
    let createdAt: Date
    var senderProfile: Profile?   // populated after a join or secondary fetch
    var isRead: Bool = false

    enum CodingKeys: String, CodingKey {
        case id, message
        case senderId   = "sender_id"
        case receiverId = "receiver_id"
        case createdAt  = "created_at"
    }
}

// MARK: - Send request body (mirrors /api/coffee-request)

struct CoffeeRequestBody: Encodable {
    let receiverId: String
    let message: String

    enum CodingKeys: String, CodingKey {
        case receiverId = "receiverId"
        case message
    }
}

// MARK: - Device token (for APNs)

struct DeviceTokenPayload: Encodable {
    let userId: UUID
    let token: String
    let platform: String
    let updatedAt: Date

    enum CodingKeys: String, CodingKey {
        case userId    = "user_id"
        case token
        case platform
        case updatedAt = "updated_at"
    }
}

using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace AIChat_ServerSide.Models;

public class AppUser
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    public string Username { get; set; } = string.Empty;

    public string NormalizedUsername { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string NormalizedEmail { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;

    public string? PasswordResetTokenHash { get; set; }

    public DateTime? PasswordResetTokenExpiresAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

// using MongoDB.Bson;
// using MongoDB.Bson.Serialization.Attributes;

// namespace AIChat_ServerSide.Models;

// public class AppUser
// {
//     [BsonId]
//     [BsonRepresentation(BsonType.ObjectId)]
//     public string? Id { get; set; }

//     public string Username { get; set; } = string.Empty;

//     public string NormalizedUsername { get; set; } = string.Empty;

//     public string PasswordHash { get; set; } = string.Empty;

//     public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
// }
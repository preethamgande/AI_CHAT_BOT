using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace AIChat_ServerSide.Models;

public class ChatSession
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    public string Username { get; set; } = string.Empty;
    public string Title { get; set; } = "New Chat";

    public List<ChatMessage> Messages { get; set; } = new();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
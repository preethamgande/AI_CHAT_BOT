namespace AIChat_ServerSide.Models;

public class ChatMessage
{
    public string Role { get; set; } = string.Empty; // user / ai
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
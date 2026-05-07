using AIChat_ServerSide.Models;
using MongoDB.Driver;

namespace AIChat_ServerSide.Services;

public class AuthService
{
    private readonly MongoDbService _db;

    public AuthService(MongoDbService db)
    {
        _db = db;
    }

    public async Task<AuthResult> RegisterAsync(string username, string password)
    {
        username = username.Trim();
        var normalizedUsername = username.ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(username) ||
            string.IsNullOrWhiteSpace(password))
        {
            return new AuthResult(false, "Username and password are required.");
        }

        if (password.Length < 6)
        {
            return new AuthResult(false, "Password must be at least 6 characters.");
        }

        var existingUser = await _db.Users
            .Find(u => u.NormalizedUsername == normalizedUsername)
            .FirstOrDefaultAsync();

        if (existingUser != null)
        {
            return new AuthResult(false, "User already exists.");
        }

        var user = new AppUser
        {
            Username = username,
            NormalizedUsername = normalizedUsername,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            CreatedAt = DateTime.UtcNow
        };

        try
        {
            await _db.Users.InsertOneAsync(user);
        }
        catch (MongoWriteException ex) when (
            ex.WriteError.Category == ServerErrorCategory.DuplicateKey)
        {
            return new AuthResult(false, "User already exists.");
        }

        return new AuthResult(true);
    }

    public async Task<bool> ValidateAsync(string username, string password)
    {
        username = username.Trim();
        var normalizedUsername = username.ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(username) ||
            string.IsNullOrWhiteSpace(password))
        {
            return false;
        }

        var user = await _db.Users
            .Find(u => u.NormalizedUsername == normalizedUsername)
            .FirstOrDefaultAsync();

        if (user == null)
        {
            return false;
        }

        return BCrypt.Net.BCrypt.Verify(password, user.PasswordHash);
    }
}

public record AuthResult(bool Success, string? Error = null);

// using System.Collections.Concurrent;

// public class AuthService
// {
//     private readonly ConcurrentDictionary<string, string> _users =
//         new(StringComparer.OrdinalIgnoreCase);

//     public bool Register(string username, string password)
//     {
//         if (string.IsNullOrWhiteSpace(username) ||
//             string.IsNullOrWhiteSpace(password) ||
//             password.Length < 6)
//         {
//             return false;
//         }

//         var hashed = BCrypt.Net.BCrypt.HashPassword(password);
//         return _users.TryAdd(username, hashed);
//     }

//     public bool Validate(string username, string password)
//     {
//         if (!_users.TryGetValue(username, out var hash))
//             return false;

//         return BCrypt.Net.BCrypt.Verify(password, hash);
//     }
// }
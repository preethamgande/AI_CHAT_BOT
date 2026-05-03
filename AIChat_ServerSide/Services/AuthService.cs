using System.Collections.Concurrent;

public class AuthService
{
    private readonly ConcurrentDictionary<string, string> _users =
        new(StringComparer.OrdinalIgnoreCase);

    public bool Register(string username, string password)
    {
        if (string.IsNullOrWhiteSpace(username) ||
            string.IsNullOrWhiteSpace(password) ||
            password.Length < 6)
        {
            return false;
        }

        var hashed = BCrypt.Net.BCrypt.HashPassword(password);
        return _users.TryAdd(username, hashed);
    }

    public bool Validate(string username, string password)
    {
        if (!_users.TryGetValue(username, out var hash))
            return false;

        return BCrypt.Net.BCrypt.Verify(password, hash);
    }
}
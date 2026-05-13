using AIChat_ServerSide.Models;
using AIChat_ServerSide.Services;
using Microsoft.AspNetCore.Authentication;
using MongoDB.Driver;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
public static class AuthEndpoints
{
    private static string GenerateResetToken()
{
    return Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
}

private static string HashResetToken(string token)
{
    var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
    return Convert.ToHexString(bytes);
}
    public static void MapAuthEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/auth");

        group.MapPost("/register", async (
            UserRegistrationRequest req,
            AuthService auth
        ) =>
        {
            if (string.IsNullOrWhiteSpace(req?.Username) ||
                string.IsNullOrWhiteSpace(req?.Password) || 
                string.IsNullOrWhiteSpace(req?.Email)) 
            {
                return Results.BadRequest("Username, Email and password are required.");
            }

            var result = await auth.RegisterAsync(req.Username, req.Email, req.Password);

            if (!result.Success)
            {
                if (result.Error == "User already exists.")
                {
                    return Results.Conflict(result.Error);
                }

                return Results.BadRequest(result.Error);
            }

            return Results.Ok("Registered successfully.");
        });

        group.MapPost("/login", async (
            UserLoginRequest req,
            AuthService auth,
            HttpContext ctx
        ) =>
        {
    try
    {
        if (string.IsNullOrWhiteSpace(req?.Username) ||
            string.IsNullOrWhiteSpace(req?.Password))
        {
            return Results.BadRequest("Invalid input");
        }

        var isValid = await auth.ValidateAsync(req.Username, req.Password);

        if (!isValid)
        {
            return Results.Unauthorized();
        }

        var username = req.Username.Trim();

        var claims = new List<Claim>
        {
            new(ClaimTypes.Name, username)
        };

        var identity = new ClaimsIdentity(claims, "Cookies");
        var principal = new ClaimsPrincipal(identity);

        await ctx.SignInAsync("Cookies", principal);

        return Results.Ok(new
        {
            username
        });
    }
    catch (Exception ex)
    {
        Console.WriteLine("LOGIN ERROR:");
        Console.WriteLine(ex.Message);
        Console.WriteLine(ex.StackTrace);

        return Results.Problem("Login failed due to server error.");
    }
});

        group.MapPost("/forgot-password", async (
    ForgotPasswordRequest req,
    MongoDbService db
) =>
{
    if (string.IsNullOrWhiteSpace(req?.Email))
    {
        return Results.BadRequest("Email is required.");
    }

    var normalizedEmail = req.Email.Trim().ToUpperInvariant();

    var user = await db.Users
        .Find(u => u.NormalizedEmail == normalizedEmail)
        .FirstOrDefaultAsync();

    if (user == null)
    {
        return Results.Ok(new
        {
            message = "If this email exists, a password reset link has been generated."
        });
    }

    var rawToken = GenerateResetToken();
    var tokenHash = HashResetToken(rawToken);

    var update = Builders<AppUser>.Update
        .Set(u => u.PasswordResetTokenHash, tokenHash)
        .Set(u => u.PasswordResetTokenExpiresAt, DateTime.UtcNow.AddMinutes(15));

    await db.Users.UpdateOneAsync(
        u => u.Id == user.Id,
        update
    );

    var frontendUrl = Environment.GetEnvironmentVariable("FRONTEND_URL")
                      ?? "http://localhost:5173";

    var resetLink =
        $"{frontendUrl}/reset-password?email={Uri.EscapeDataString(user.Email)}&token={Uri.EscapeDataString(rawToken)}";

    return Results.Ok(new
    {
        message = "Password reset link generated.",
        resetLink
    });
});

group.MapPost("/reset-password", async (
    ResetPasswordRequest req,
    MongoDbService db
) =>
{
    if (string.IsNullOrWhiteSpace(req?.Email) ||
        string.IsNullOrWhiteSpace(req?.Token) ||
        string.IsNullOrWhiteSpace(req?.NewPassword) ||
        string.IsNullOrWhiteSpace(req?.ConfirmPassword))
    {
        return Results.BadRequest("All fields are required.");
    }

    if (req.NewPassword != req.ConfirmPassword)
    {
        return Results.BadRequest("Passwords do not match.");
    }

    if (req.NewPassword.Length < 6)
    {
        return Results.BadRequest("Password must be at least 6 characters.");
    }

    var normalizedEmail = req.Email.Trim().ToUpperInvariant();
    var tokenHash = HashResetToken(req.Token);

    var user = await db.Users
        .Find(u => u.NormalizedEmail == normalizedEmail)
        .FirstOrDefaultAsync();

    if (user == null)
    {
        return Results.BadRequest("Invalid reset request.");
    }

    if (string.IsNullOrWhiteSpace(user.PasswordResetTokenHash) ||
        user.PasswordResetTokenHash != tokenHash)
    {
        return Results.BadRequest("Invalid or expired reset token.");
    }

    if (user.PasswordResetTokenExpiresAt == null ||
        user.PasswordResetTokenExpiresAt < DateTime.UtcNow)
    {
        return Results.BadRequest("Invalid or expired reset token.");
    }

    var newPasswordHash = BCrypt.Net.BCrypt.HashPassword(req.NewPassword);

    var update = Builders<AppUser>.Update
        .Set(u => u.PasswordHash, newPasswordHash)
        .Set(u => u.PasswordResetTokenHash, null)
        .Set(u => u.PasswordResetTokenExpiresAt, null);

    await db.Users.UpdateOneAsync(
        u => u.Id == user.Id,
        update
    );

    return Results.Ok(new
    {
        message = "Password has been reset successfully."
    });
});

        group.MapGet("/me", (HttpContext ctx) =>
        {
            if (ctx.User.Identity?.IsAuthenticated != true)
            {
                return Results.Unauthorized();
            }

            return Results.Ok(new
            {
                username = ctx.User.Identity.Name
            });
        }).RequireAuthorization();

        group.MapPost("/logout", async (HttpContext ctx) =>
        {
            await ctx.SignOutAsync("Cookies");
            return Results.Ok();
        }).RequireAuthorization();
    }
}
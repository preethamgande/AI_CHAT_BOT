using AIChat_ServerSide.Services;
using Microsoft.AspNetCore.Authentication;
using System.Security.Claims;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/auth");

        group.MapPost("/register", async (
            UserRegistrationRequest req,
            AuthService auth
        ) =>
        {
            if (string.IsNullOrWhiteSpace(req?.Username) ||
                string.IsNullOrWhiteSpace(req?.Password))
            {
                return Results.BadRequest("Username and password are required.");
            }

            var result = await auth.RegisterAsync(req.Username, req.Password);

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
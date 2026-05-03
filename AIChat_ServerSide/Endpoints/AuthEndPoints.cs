using Microsoft.AspNetCore.Authentication;
using System.Security.Claims;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/auth");

        // group.MapPost("/register", (UserRegistrationRequest req, AuthService auth) =>
        // {
        //     if (string.IsNullOrWhiteSpace(req?.Username) ||
        //         string.IsNullOrWhiteSpace(req?.Password))
        //     {
        //         return Results.BadRequest("Invalid input");
        //     }

        //     if (!auth.Register(req.Username, req.Password))
        //         return Results.BadRequest("User already exists");

        //     return Results.Ok();
        // });

        group.MapPost("/register", (UserRegistrationRequest req, AuthService auth) =>
        {
            if (string.IsNullOrWhiteSpace(req?.Username) ||
                string.IsNullOrWhiteSpace(req?.Password))
            {
                return Results.BadRequest("Username and password are required.");
            }

            // ✅ Add password length validation
            if (req.Password.Length < 6)
            {
                return Results.BadRequest("Password must be at least 6 characters.");
            }

            if (!auth.Register(req.Username, req.Password))
                return Results.BadRequest("User already exists");

            return Results.Ok("Registered successfully.");
        });


        group.MapPost("/login", async (UserLoginRequest req, AuthService auth, HttpContext ctx) =>
        {
            if (string.IsNullOrWhiteSpace(req?.Username) ||
                string.IsNullOrWhiteSpace(req?.Password))
            {
                return Results.BadRequest("Invalid input");
            }

            if (!auth.Validate(req.Username, req.Password))
                return Results.Unauthorized();

            var claims = new List<Claim>
            {
                new(ClaimTypes.Name, req.Username)
            };

            var identity = new ClaimsIdentity(claims, "Cookies");

            await ctx.SignInAsync("Cookies", new ClaimsPrincipal(identity));

            return Results.Ok();
        });

        // ✅ Check current logged-in user
        group.MapGet("/me", (HttpContext ctx) =>
        {
            if (ctx.User.Identity?.IsAuthenticated != true)
                return Results.Unauthorized();

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
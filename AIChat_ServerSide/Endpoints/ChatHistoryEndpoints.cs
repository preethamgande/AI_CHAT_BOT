using AIChat_ServerSide.Models;
using AIChat_ServerSide.Services;
using MongoDB.Driver;

namespace AIChat_ServerSide.Endpoints;

public static class ChatHistoryEndpoints
{
    public static void MapChatHistoryEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/chats").RequireAuthorization();

        group.MapGet("", async (HttpContext ctx, MongoDbService db) =>
        {
            var username = ctx.User.Identity?.Name;

            var chats = await db.Chats
                .Find(c => c.Username == username)
                .SortByDescending(c => c.UpdatedAt)
                .Project(c => new
                {
                    id = c.Id,
                    title = c.Title,
                    updatedAt = c.UpdatedAt
                })
                .ToListAsync();

            return Results.Ok(chats);
        });

        group.MapPost("", async (HttpContext ctx, MongoDbService db) =>
        {
            var username = ctx.User.Identity?.Name;

            var chat = new ChatSession
            {
                Username = username ?? string.Empty,
                Title = "New Chat"
            };

            await db.Chats.InsertOneAsync(chat);

            return Results.Ok(chat);
        });

        group.MapGet("/{id}", async (string id, HttpContext ctx, MongoDbService db) =>
        {
            var username = ctx.User.Identity?.Name;

            var chat = await db.Chats
                .Find(c => c.Id == id && c.Username == username)
                .FirstOrDefaultAsync();

            return chat is null ? Results.NotFound() : Results.Ok(chat);
        });

        group.MapDelete("/{id}", async (string id, HttpContext ctx, MongoDbService db) =>
        {
            var username = ctx.User.Identity?.Name;

            var result = await db.Chats.DeleteOneAsync(c =>
                c.Id == id && c.Username == username);

            return result.DeletedCount == 0 ? Results.NotFound() : Results.Ok();
        });
    }
}
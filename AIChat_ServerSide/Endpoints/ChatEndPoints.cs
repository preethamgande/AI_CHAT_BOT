using AIChat_ServerSide.Services;

public static class ChatEndPoints
{
    public static void MapChatEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/chat")
                       .RequireAuthorization();

        group.MapPost("/", async (ChatRequest req, AIServiceInterface ai) =>
        {
            if (req == null || string.IsNullOrWhiteSpace(req?.Message))
                return Results.BadRequest("Message is required");

            var reply = await ai.GetResponse(req.Message);

            return Results.Ok(new { reply });
        });
    }
}


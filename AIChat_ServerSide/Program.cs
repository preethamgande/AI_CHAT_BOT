using DotNetEnv;
using AIChat_ServerSide.Services;
using AIChat_ServerSide.Endpoints;
using AIChat_ServerSide.Models;
using MongoDB.Driver;

var builder = WebApplication.CreateBuilder(args);

// Render provides PORT. Locally, fallback to 5050.
var port = Environment.GetEnvironmentVariable("PORT") ?? "5050";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

// Load .env only for local development
var envPath = Path.GetFullPath(
    Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".env")
);

if (File.Exists(envPath))
{
    Env.Load(envPath);
    Console.WriteLine($"ENV PATH: {envPath}");
}
else
{
    Console.WriteLine("No local .env file found. Using platform environment variables.");
}

Console.WriteLine($"MISTRAL KEY FOUND: {Environment.GetEnvironmentVariable("MISTRAL_API_KEY") != null}");
Console.WriteLine($"MONGO FOUND: {Environment.GetEnvironmentVariable("MONGO_CONNECTION_STRING") != null}");

var frontendUrl = Environment.GetEnvironmentVariable("FRONTEND_URL")
                  ?? builder.Configuration["FrontendUrl"]
                  ?? "http://localhost:5173";

frontendUrl = frontendUrl.Trim().TrimEnd('/');

Console.WriteLine($"FRONTEND_URL: {frontendUrl}");

builder.Services.AddCors(options =>
{
    options.AddPolicy("frontend", policy =>
    {
        var allowedOrigins = new[]
        {
            "http://localhost:5173",
            "http://localhost:5174",
            "https://ai-chat-bot-delta-eight.vercel.app",
            frontendUrl
        }
        .Where(x => !string.IsNullOrWhiteSpace(x))
        .Distinct()
        .ToArray();

        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Authentication
builder.Services.AddAuthentication("Cookies")
    .AddCookie("Cookies", options =>
    {
        options.Cookie.Name = "AIChatAuth";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.None;
        options.Cookie.SecurePolicy = CookieSecurePolicy.Always;

        options.Events.OnRedirectToLogin = context =>
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        };

        options.Events.OnRedirectToAccessDenied = context =>
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return Task.CompletedTask;
        };
    });

builder.Services.AddAuthorization();

// Services
builder.Services.AddSingleton<AIServiceInterface, MistralService>();
builder.Services.AddSingleton<AuthService>();
builder.Services.AddSingleton<MongoDbService>();

var app = builder.Build();

// Middleware
app.UseCors("frontend");
app.UseAuthentication();
app.UseAuthorization();

// Root health check for Render
app.MapGet("/", () => "AIChat backend is running");

// Existing health check
app.MapGet("/test", () => "Backend is working");

app.MapGet("/mongo-test", async (MongoDbService db) =>
{
    var count = await db.Chats.CountDocumentsAsync(_ => true);
    return Results.Ok(new
    {
        connected = true,
        chats = count
    });
});

// Auth endpoints
app.MapAuthEndpoints();

// Chat history endpoints
app.MapChatHistoryEndpoints();

// Normal chat endpoint
app.MapGet("/chat", async (string message, AIServiceInterface aiService) =>
{
    var response = await aiService.GetResponse(message);
    return Results.Ok(response);
}).RequireAuthorization();

// SSE endpoint with MongoDB save
app.MapGet("/chat/stream", async (
    HttpContext ctx,
    string message,
    string chatId,
    AIServiceInterface aiService,
    MongoDbService db
) =>
{
    var username = ctx.User.Identity?.Name;

    if (string.IsNullOrWhiteSpace(username))
    {
        ctx.Response.StatusCode = StatusCodes.Status401Unauthorized;
        return;
    }

    if (string.IsNullOrWhiteSpace(chatId))
    {
        ctx.Response.StatusCode = StatusCodes.Status400BadRequest;
        await ctx.Response.WriteAsync("chatId is required");
        return;
    }

    ctx.Response.Headers.Append("Content-Type", "text/event-stream");
    ctx.Response.Headers.Append("Cache-Control", "no-cache");

    var userMessage = new ChatMessage
    {
        Role = "user",
        Content = message
    };

    await db.Chats.UpdateOneAsync(
        c => c.Id == chatId && c.Username == username,
        Builders<ChatSession>.Update
            .Push(c => c.Messages, userMessage)
            .Set(c => c.UpdatedAt, DateTime.UtcNow)
            .Set(c => c.Title, message.Length > 40 ? message[..40] + "..." : message)
    );

    var aiResponse = "";

    // await foreach (var chunk in aiService.StreamResponse(message))
    // {
    //     aiResponse += chunk;

    //     await ctx.Response.WriteAsync($"data: {chunk}\n\n");
    //     await ctx.Response.Body.FlushAsync();
    // }

    await foreach (var chunk in aiService.StreamResponse(message))
{
    aiResponse += chunk;

    var safeChunk = chunk
        .Replace("\r", "")
        .Replace("\n", "\\n");

    await ctx.Response.WriteAsync($"data: {safeChunk}\n\n");
    await ctx.Response.Body.FlushAsync();
}

    var aiMessage = new ChatMessage
    {
        Role = "ai",
        Content = aiResponse
    };

    await db.Chats.UpdateOneAsync(
        c => c.Id == chatId && c.Username == username,
        Builders<ChatSession>.Update
            .Push(c => c.Messages, aiMessage)
            .Set(c => c.UpdatedAt, DateTime.UtcNow)
    );

    await ctx.Response.WriteAsync("data: [DONE]\n\n");
}).RequireAuthorization();

app.Run();

// // using DotNetEnv;
// // using AIChat_ServerSide.Services;
// // using AIChat_ServerSide.Endpoints;
// // using AIChat_ServerSide.Models;
// // using MongoDB.Driver;

// // var envPath = Path.GetFullPath(
// //     Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".env")
// // );

// // Env.Load(envPath);

// // Console.WriteLine($"ENV PATH: {envPath}");
// // Console.WriteLine($"MISTRAL KEY FOUND: {Environment.GetEnvironmentVariable("MISTRAL_API_KEY") != null}");

// // var builder = WebApplication.CreateBuilder(args);

// // // CORS
// // builder.Services.AddCors(options =>
// // {
// //     options.AddPolicy("frontend", policy =>
// //     {
// //         policy.WithOrigins("http://localhost:5173", "http://localhost:5174")
// //               .AllowAnyHeader()
// //               .AllowAnyMethod()
// //               .AllowCredentials();
// //     });
// // });

// // // Authentication
// // builder.Services.AddAuthentication("Cookies")
// //     .AddCookie("Cookies", options =>
// //     {
// //         options.Cookie.Name = "AIChatAuth";
// //         options.Cookie.HttpOnly = true;
// //         options.Cookie.SameSite = SameSiteMode.Lax;
// //         options.Cookie.SecurePolicy = CookieSecurePolicy.None;

// //         // ✅ Prevent redirect to /Account/Login
// //         options.Events.OnRedirectToLogin = context =>
// //         {
// //             context.Response.StatusCode = StatusCodes.Status401Unauthorized;
// //             return Task.CompletedTask;
// //         };

// //         options.Events.OnRedirectToAccessDenied = context =>
// //         {
// //             context.Response.StatusCode = StatusCodes.Status403Forbidden;
// //             return Task.CompletedTask;
// //         };
// //     });
// // builder.Services.AddAuthorization();

// // // Services
// // builder.Services.AddSingleton<AIServiceInterface, MistralService>();
// // builder.Services.AddSingleton<AuthService>();
// // builder.Services.AddSingleton<MongoDbService>();

// // var app = builder.Build();

// // // Middleware order matters
// // app.UseCors("frontend");
// // app.UseAuthentication();
// // app.UseAuthorization();

// // // Health check
// // app.MapGet("/test", () => "Backend is working");

// // // Auth endpoints
// // app.MapAuthEndpoints();

// // // Chat endpoint
// // app.MapGet("/chat", async (string message, AIServiceInterface aiService) =>
// // {
// //     var response = await aiService.GetResponse(message);
// //     return Results.Ok(response);
// // }).RequireAuthorization();

// // // SSE endpoint
// // // // app.MapGet("/chat/stream", async (HttpContext ctx, string message, AIServiceInterface aiService) =>
// // // {
// // //     ctx.Response.Headers.Append("Content-Type", "text/event-stream");
// // //     ctx.Response.Headers.Append("Cache-Control", "no-cache");

// // //     await foreach (var chunk in aiService.StreamResponse(message))
// // //     {
// // //         await ctx.Response.WriteAsync($"data: {chunk}\n\n");
// // //         await ctx.Response.Body.FlushAsync();
// // //     }

// // //     await ctx.Response.WriteAsync("data: [DONE]\n\n");
// // // }).RequireAuthorization();

// // app.MapGet("/chat/stream", async (
// //     HttpContext ctx,
// //     string message,
// //     string chatId,
// //     AIServiceInterface aiService,
// //     MongoDbService db
// // ) =>
// // {
// //     var username = ctx.User.Identity?.Name;

// //     ctx.Response.Headers.Append("Content-Type", "text/event-stream");
// //     ctx.Response.Headers.Append("Cache-Control", "no-cache");

// //     var userMessage = new ChatMessage
// //     {
// //         Role = "user",
// //         Content = message
// //     };

// //     await db.Chats.UpdateOneAsync(
// //         c => c.Id == chatId && c.Username == username,
// //         Builders<ChatSession>.Update
// //             .Push(c => c.Messages, userMessage)
// //             .Set(c => c.UpdatedAt, DateTime.UtcNow)
// //             .Set(c => c.Title, message.Length > 40 ? message[..40] + "..." : message)
// //     );

// //     var aiResponse = "";

// //     await foreach (var chunk in aiService.StreamResponse(message))
// //     {
// //         aiResponse += chunk;

// //         await ctx.Response.WriteAsync($"data: {chunk}\n\n");
// //         await ctx.Response.Body.FlushAsync();
// //     }

// //     var aiMessage = new ChatMessage
// //     {
// //         Role = "ai",
// //         Content = aiResponse
// //     };

// //     await db.Chats.UpdateOneAsync(
// //         c => c.Id == chatId && c.Username == username,
// //         Builders<ChatSession>.Update
// //             .Push(c => c.Messages, aiMessage)
// //             .Set(c => c.UpdatedAt, DateTime.UtcNow)
// //     );

// //     await ctx.Response.WriteAsync("data: [DONE]\n\n");
// // }).RequireAuthorization();
// // app.Run();

// using DotNetEnv;
// using AIChat_ServerSide.Services;
// using AIChat_ServerSide.Endpoints;
// using AIChat_ServerSide.Models;
// using MongoDB.Driver;

// var envPath = Path.GetFullPath(
//     Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".env")
// );

// Env.Load(envPath);

// Console.WriteLine($"ENV PATH: {envPath}");
// Console.WriteLine($"MISTRAL KEY FOUND: {Environment.GetEnvironmentVariable("MISTRAL_API_KEY") != null}");
// Console.WriteLine($"MONGO FOUND: {Environment.GetEnvironmentVariable("MONGO_CONNECTION_STRING") != null}");

// var builder = WebApplication.CreateBuilder(args);

// // CORS
// builder.Services.AddCors(options =>
// {
//     options.AddPolicy("frontend", policy =>
//     {
//         policy.WithOrigins(
//                 "http://localhost:5173",
//                 "http://localhost:5174"
//             // "https://AIChat_ClientSide.vercel.app"
//             )
//             .AllowAnyHeader()
//             .AllowAnyMethod()
//             .AllowCredentials();
//     });
// });

// // Authentication
// builder.Services.AddAuthentication("Cookies")
//     .AddCookie("Cookies", options =>
//     {
//         options.Cookie.Name = "AIChatAuth";
//         options.Cookie.HttpOnly = true;
//         options.Cookie.SameSite = SameSiteMode.None;
//         options.Cookie.SecurePolicy = CookieSecurePolicy.Always;

//         options.Events.OnRedirectToLogin = context =>
//         {
//             context.Response.StatusCode = StatusCodes.Status401Unauthorized;
//             return Task.CompletedTask;
//         };

//         options.Events.OnRedirectToAccessDenied = context =>
//         {
//             context.Response.StatusCode = StatusCodes.Status403Forbidden;
//             return Task.CompletedTask;
//         };
//     });

// builder.Services.AddAuthorization();

// // Services
// builder.Services.AddSingleton<AIServiceInterface, MistralService>();
// builder.Services.AddSingleton<AuthService>();
// builder.Services.AddSingleton<MongoDbService>();

// var app = builder.Build();

// // Middleware
// app.UseCors("frontend");
// app.UseAuthentication();
// app.UseAuthorization();

// // Health check
// app.MapGet("/test", () => "Backend is working");

// app.MapGet("/mongo-test", async (MongoDbService db) =>
// {
//     var count = await db.Chats.CountDocumentsAsync(_ => true);
//     return Results.Ok(new
//     {
//         connected = true,
//         chats = count
//     });
// });

// // Auth endpoints
// app.MapAuthEndpoints();

// // ✅ Chat history endpoints
// app.MapChatHistoryEndpoints();

// // Normal chat endpoint
// app.MapGet("/chat", async (string message, AIServiceInterface aiService) =>
// {
//     var response = await aiService.GetResponse(message);
//     return Results.Ok(response);
// }).RequireAuthorization();

// // SSE endpoint with MongoDB save
// app.MapGet("/chat/stream", async (
//     HttpContext ctx,
//     string message,
//     string chatId,
//     AIServiceInterface aiService,
//     MongoDbService db
// ) =>
// {
//     var username = ctx.User.Identity?.Name;

//     if (string.IsNullOrWhiteSpace(username))
//     {
//         ctx.Response.StatusCode = StatusCodes.Status401Unauthorized;
//         return;
//     }

//     if (string.IsNullOrWhiteSpace(chatId))
//     {
//         ctx.Response.StatusCode = StatusCodes.Status400BadRequest;
//         await ctx.Response.WriteAsync("chatId is required");
//         return;
//     }

//     ctx.Response.Headers.Append("Content-Type", "text/event-stream");
//     ctx.Response.Headers.Append("Cache-Control", "no-cache");

//     var userMessage = new ChatMessage
//     {
//         Role = "user",
//         Content = message
//     };

//     await db.Chats.UpdateOneAsync(
//         c => c.Id == chatId && c.Username == username,
//         Builders<ChatSession>.Update
//             .Push(c => c.Messages, userMessage)
//             .Set(c => c.UpdatedAt, DateTime.UtcNow)
//             .Set(c => c.Title, message.Length > 40 ? message[..40] + "..." : message)
//     );

//     var aiResponse = "";

//     await foreach (var chunk in aiService.StreamResponse(message))
//     {
//         aiResponse += chunk;

//         await ctx.Response.WriteAsync($"data: {chunk}\n\n");
//         await ctx.Response.Body.FlushAsync();
//     }

//     var aiMessage = new ChatMessage
//     {
//         Role = "ai",
//         Content = aiResponse
//     };

//     await db.Chats.UpdateOneAsync(
//         c => c.Id == chatId && c.Username == username,
//         Builders<ChatSession>.Update
//             .Push(c => c.Messages, aiMessage)
//             .Set(c => c.UpdatedAt, DateTime.UtcNow)
//     );

//     await ctx.Response.WriteAsync("data: [DONE]\n\n");
// }).RequireAuthorization();

// app.Run();
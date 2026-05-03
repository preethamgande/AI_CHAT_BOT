using AIChat_ServerSide.Models;
using MongoDB.Driver;

namespace AIChat_ServerSide.Services;

public class MongoDbService
{
    public IMongoCollection<ChatSession> Chats { get; }

    public MongoDbService()
    {
        var connectionString = Environment.GetEnvironmentVariable("MONGO_CONNECTION_STRING")
            ?? throw new Exception("MONGO_CONNECTION_STRING not found");

        var databaseName = Environment.GetEnvironmentVariable("MONGO_DATABASE_NAME")
            ?? "AIChatDb";

        var client = new MongoClient(connectionString);
        var database = client.GetDatabase(databaseName);

        Chats = database.GetCollection<ChatSession>("chats");
    }
}
namespace AIChat_ServerSide.Services
{
    public interface AIServiceInterface
    {
        Task<string> GetResponse(string input);
        IAsyncEnumerable<string> StreamResponse(string input);
    }
}
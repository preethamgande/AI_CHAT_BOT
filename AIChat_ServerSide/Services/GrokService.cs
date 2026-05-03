using System.Text;
using System.Text.Json;

namespace AIChat_ServerSide.Services
{
    public class GrokService : AIServiceInterface
    {
        private readonly HttpClient _http;
        private readonly string _apiKey;

        public GrokService()
        {
            _http = new HttpClient();
            _apiKey = Environment.GetEnvironmentVariable("GROK_API_KEY")
                      ?? throw new Exception("GROK_API_KEY not found");

            _http.DefaultRequestHeaders.Add("Authorization", $"Bearer {_apiKey}");
        }

        public async Task<string> GetResponse(string input)
        {
            var url = "https://api.grok.com/v1/chat/completions";

            var body = new
            {
                model = "gpt-4.1-mini",
                messages = new[]
                {
                    new { role = "user", content = input }
                }
            };

            var response = await _http.PostAsync(
                url,
                new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json")
            );

            var json = await response.Content.ReadAsStringAsync();

            using var doc = JsonDocument.Parse(json);

            return doc.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString() ?? "No response";
        }

        public async IAsyncEnumerable<string> StreamResponse(string input)
        {
            var full = await GetResponse(input);

            foreach (var word in full.Split(' '))
            {
                yield return word + " ";
                await Task.Delay(30);
            }
        }
    }
}

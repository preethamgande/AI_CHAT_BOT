using System.Text;
using System.Text.Json;

namespace AIChat_ServerSide.Services
{
    public class GeminiService : AIServiceInterface
    {
        private readonly HttpClient _http;
        private readonly string _apiKey;

        public GeminiService()
        {
            _http = new HttpClient();
            _apiKey = Environment.GetEnvironmentVariable("GEMINI_API_KEY")
                      ?? throw new Exception("GEMINI_API_KEY not found");
        }

        public async Task<string> GetResponse(string input)
        {
            var url =
                $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={_apiKey}";

            var body = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new[]
                        {
                            new { text = input }
                        }
                    }
                }
            };

            var response = await _http.PostAsync(
                url,
                new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json")
            );

            var json = await response.Content.ReadAsStringAsync();
            Console.WriteLine("RAW GEMINI RESPONSE:");
            Console.WriteLine(json);

            using var doc = JsonDocument.Parse(json);

            if (doc.RootElement.TryGetProperty("candidates", out var candidates))
            {
                return candidates[0]
                    .GetProperty("content")
                    .GetProperty("parts")[0]
                    .GetProperty("text")
                    .GetString() ?? "No response";
            }

            return $"Error from API: {json}";
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

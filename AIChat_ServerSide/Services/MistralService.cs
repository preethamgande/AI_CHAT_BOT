using System.Net;
using System.Text;
using System.Text.Json;

namespace AIChat_ServerSide.Services
{
    public class MistralService : AIServiceInterface
    {
        private readonly HttpClient _http;
        private readonly string _apiKey;
        private readonly string _url = "https://api.mistral.ai/v1/chat/completions";

        public MistralService()
        {
            _http = new HttpClient();

            _apiKey = Environment.GetEnvironmentVariable("MISTRAL_API_KEY")
                      ?? throw new Exception("MISTRAL_API_KEY not found");

            _http.DefaultRequestHeaders.Add("Authorization", $"Bearer {_apiKey}");
        }

        public async Task<string> GetResponse(string input)
        {
            var body = new
            {
                model = "mistral-small-latest",
                messages = new[]
                {
                    new
                    {
                        role = "user",
                        content = input
                    }
                },
                max_tokens = 500,
                temperature = 0.7
            };

            var jsonBody = JsonSerializer.Serialize(body);

            using var response = await SendWithRetryAsync(jsonBody);

            var json = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                Console.WriteLine("MISTRAL ERROR:");
                Console.WriteLine(json);

                return $"Mistral API error ({(int)response.StatusCode}): Please try again.";
            }

            using var doc = JsonDocument.Parse(json);

            return doc.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString() ?? "No response from Mistral";
        }

        public async IAsyncEnumerable<string> StreamResponse(string input)
        {
            var body = new
            {
                model = "mistral-small-latest",
                messages = new[]
                {
                    new
                    {
                        role = "user",
                        content = input
                    }
                },
                max_tokens = 500,
                temperature = 0.7,
                stream = true
            };

            var jsonBody = JsonSerializer.Serialize(body);

            using var response = await SendWithRetryAsync(
                jsonBody,
                HttpCompletionOption.ResponseHeadersRead
            );

            if (!response.IsSuccessStatusCode)
            {
                var errorJson = await response.Content.ReadAsStringAsync();

                Console.WriteLine("MISTRAL STREAM ERROR:");
                Console.WriteLine(errorJson);

                yield return $"Mistral API error ({(int)response.StatusCode}): Please try again.";
                yield break;
            }

            await using var stream = await response.Content.ReadAsStreamAsync();
            using var reader = new StreamReader(stream);

            string? line;
            while ((line = await reader.ReadLineAsync()) != null)
            {
                if (string.IsNullOrWhiteSpace(line))
                {
                    continue;
                }

                if (!line.StartsWith("data:"))
                {
                    continue;
                }

                var data = line["data:".Length..].Trim();

                if (data == "[DONE]")
                {
                    yield break;
                }

                string? content = ExtractStreamContent(data);

                if (!string.IsNullOrEmpty(content))
                {
                    yield return content;
                }
            }
        }

        private async Task<HttpResponseMessage> SendWithRetryAsync(
            string jsonBody,
            HttpCompletionOption completionOption = HttpCompletionOption.ResponseContentRead
        )
        {
            const int maxRetries = 2;

            for (var attempt = 0; attempt <= maxRetries; attempt++)
            {
                var request = new HttpRequestMessage(HttpMethod.Post, _url)
                {
                    Content = new StringContent(jsonBody, Encoding.UTF8, "application/json")
                };

                var response = await _http.SendAsync(request, completionOption);

                if (response.StatusCode != HttpStatusCode.TooManyRequests)
                {
                    return response;
                }

                if (attempt == maxRetries)
                {
                    return response;
                }

                response.Dispose();

                var delayMs = attempt switch
                {
                    0 => 2000,
                    1 => 5000,
                    _ => 10000
                };

                Console.WriteLine($"Mistral rate limited. Retrying in {delayMs}ms...");
                await Task.Delay(delayMs);
            }

            throw new Exception("Unexpected retry failure.");
        }

        private static string? ExtractStreamContent(string data)
        {
            try
            {
                using var doc = JsonDocument.Parse(data);

                var root = doc.RootElement;

                if (!root.TryGetProperty("choices", out var choices))
                {
                    return null;
                }

                if (choices.GetArrayLength() == 0)
                {
                    return null;
                }

                var firstChoice = choices[0];

                if (!firstChoice.TryGetProperty("delta", out var delta))
                {
                    return null;
                }

                if (!delta.TryGetProperty("content", out var contentElement))
                {
                    return null;
                }

                return contentElement.GetString();
            }
            catch
            {
                return null;
            }
        }
    }
}

// using System.Text;
// using System.Text.Json;

// namespace AIChat_ServerSide.Services
// {
//     public class MistralService : AIServiceInterface
//     {
//         private readonly HttpClient _http;
//         private readonly string _apiKey;

//         public MistralService()
//         {
//             _http = new HttpClient();

//             _apiKey = Environment.GetEnvironmentVariable("MISTRAL_API_KEY")
//                       ?? throw new Exception("MISTRAL_API_KEY not found");

//             _http.DefaultRequestHeaders.Add("Authorization", $"Bearer {_apiKey}");
//         }

//         public async Task<string> GetResponse(string input)
//         {
//             var url = "https://api.mistral.ai/v1/chat/completions";

//             var body = new
//             {
//                 model = "mistral-small-latest",
//                 messages = new[]
//                 {
//                     new
//                     {
//                         role = "user",
//                         content = input
//                     }
//                 }
//             };

//             var response = await _http.PostAsync(
//                 url,
//                 new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json")
//             );

//             var json = await response.Content.ReadAsStringAsync();

//             if (!response.IsSuccessStatusCode)
//             {
//                 Console.WriteLine("MISTRAL ERROR:");
//                 Console.WriteLine(json);

//                 return $"Mistral API error ({(int)response.StatusCode}): Please try again.";
//             }

//             using var doc = JsonDocument.Parse(json);

//             return doc.RootElement
//                 .GetProperty("choices")[0]
//                 .GetProperty("message")
//                 .GetProperty("content")
//                 .GetString() ?? "No response from Mistral";
//         }

//         public async IAsyncEnumerable<string> StreamResponse(string input)
//         {
//             var full = await GetResponse(input);

//             foreach (var word in full.Split(' '))
//             {
//                 yield return word + " ";
//                 await Task.Delay(30);
//             }
//         }
//     }
// }
using System.Globalization;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using PaymentService.Application.Interfaces;
using Shared.Models;

namespace PaymentService.Infrastructure.ExternalClients;

public sealed class RazorpayClient : IRazorpayClient
{
    private const string Currency = "INR";
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly string _keyId;
    private readonly string _keySecret;

    public RazorpayClient(IHttpClientFactory httpClientFactory, IConfiguration configuration)
    {
        _httpClientFactory = httpClientFactory;
        _keyId = configuration["Razorpay:KeyId"] ?? throw new InvalidOperationException("Razorpay:KeyId is not configured.");
        _keySecret = configuration["Razorpay:KeySecret"] ?? throw new InvalidOperationException("Razorpay:KeySecret is not configured.");
    }

    public async Task<RazorpayOrderResponse> CreateOrderAsync(CreateRazorpayOrderRequest request, CancellationToken cancellationToken = default)
    {
        var amountInSubunits = checked((int)Math.Round(request.Amount * 100m, MidpointRounding.AwayFromZero));
        var receipt = CreateReceipt(request.ShipmentId);
        var payload = new
        {
            amount = amountInSubunits,
            currency = Currency,
            receipt,
            notes = new Dictionary<string, string>
            {
                ["shipmentId"] = request.ShipmentId.ToString(),
                ["amount"] = request.Amount.ToString("0.00", CultureInfo.InvariantCulture)
            }
        };

        using var message = new HttpRequestMessage(HttpMethod.Post, "https://api.razorpay.com/v1/orders")
        {
            Content = JsonContent.Create(payload)
        };
        message.Headers.Authorization = new AuthenticationHeaderValue(
            "Basic",
            Convert.ToBase64String(Encoding.ASCII.GetBytes($"{_keyId}:{_keySecret}")));

        var client = _httpClientFactory.CreateClient();
        using var response = await client.SendAsync(message, cancellationToken);
        var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"Razorpay order creation failed: {responseBody}");
        }

        using var json = JsonDocument.Parse(responseBody);
        var orderId = json.RootElement.GetProperty("id").GetString();
        if (string.IsNullOrWhiteSpace(orderId))
        {
            throw new InvalidOperationException("Razorpay order response did not include an order id.");
        }

        return new RazorpayOrderResponse(orderId, _keyId, request.Amount, amountInSubunits, Currency, receipt);
    }

    public bool VerifyPaymentSignature(string orderId, string paymentId, string signature)
    {
        var payload = $"{orderId}|{paymentId}";
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(_keySecret));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
        var generatedSignature = Convert.ToHexString(hash).ToLowerInvariant();
        if (generatedSignature.Length != signature.Length)
        {
            return false;
        }

        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(generatedSignature),
            Encoding.UTF8.GetBytes(signature.ToLowerInvariant()));
    }

    private static string CreateReceipt(Guid shipmentId)
    {
        var suffix = shipmentId.ToString("N")[..16];
        return $"ss-{suffix}";
    }
}

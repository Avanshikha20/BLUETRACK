using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.Extensions.Configuration;
using PaymentService.Application.Interfaces;
using Shared.Models;

namespace PaymentService.Infrastructure.ExternalClients;

public class ExternalServicesClient : IExternalServicesClient
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly string _shipmentServiceUrl;

    public ExternalServicesClient(IHttpClientFactory httpClientFactory, IConfiguration config)
    {
        _httpClientFactory = httpClientFactory;
        _shipmentServiceUrl = config["Services:Shipment"] ?? "http://localhost:5002";
    }

    public async Task<bool> UpdateShipmentStatusAsync(Guid shipmentId, string status, string token, CancellationToken cancellationToken = default)
    {
        var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var statusResponse = await client.PutAsJsonAsync(
            $"{_shipmentServiceUrl}/shipments/{shipmentId}/status",
            new { Status = status },
            cancellationToken);

        return statusResponse.IsSuccessStatusCode;
    }

    public async Task<ShipmentDto?> GetShipmentDetailsAsync(Guid shipmentId, string token, CancellationToken cancellationToken = default)
    {
        var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.GetAsync($"{_shipmentServiceUrl}/shipments/{shipmentId}", cancellationToken);
        if (!response.IsSuccessStatusCode) return null;

        return await response.Content.ReadFromJsonAsync<ShipmentDto>(cancellationToken: cancellationToken);
    }
}

using System.Net.Http.Headers;
using System.Net.Http.Json;
using AdminService.Application.DTOs;
using AdminService.Application.Interfaces;
using Microsoft.Extensions.Configuration;

namespace AdminService.Infrastructure.ExternalClients;

public class ExternalServicesClient : IExternalServicesClient
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly string _shipmentBase;
    private readonly string _paymentBase;
    private readonly string _identityBase;

    public ExternalServicesClient(IHttpClientFactory httpClientFactory, IConfiguration config)
    {
        _httpClientFactory = httpClientFactory;
        _shipmentBase = config["Services:Shipment"] ?? "http://localhost:5002";
        _paymentBase = config["Services:Payment"] ?? "http://localhost:5003";
        _identityBase = config["Services:Identity"] ?? "http://localhost:5001";
    }

    private HttpClient CreateClient(string token)
    {
        var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    public async Task<List<ShipmentSummary>?> GetAllShipmentsAsync(string token, CancellationToken cancellationToken = default)
    {
        var client = CreateClient(token);
        var response = await client.GetAsync($"{_shipmentBase}/shipments/all", cancellationToken);
        if (response.IsSuccessStatusCode)
        {
            return await response.Content.ReadFromJsonAsync<List<ShipmentSummary>>(cancellationToken: cancellationToken);
        }
        return null;
    }

    public async Task<RevenueResponse?> GetRevenueAsync(string token, CancellationToken cancellationToken = default)
    {
        var client = CreateClient(token);
        var response = await client.GetAsync($"{_paymentBase}/metrics/revenue", cancellationToken);
        if (response.IsSuccessStatusCode)
        {
            return await response.Content.ReadFromJsonAsync<RevenueResponse>(cancellationToken: cancellationToken);
        }
        return null;
    }

    public async Task ForceUpdateShipmentStatusAsync(Guid shipmentId, string status, string token, CancellationToken cancellationToken = default)
    {
        var client = CreateClient(token);
        await client.PutAsJsonAsync($"{_shipmentBase}/shipments/{shipmentId}/status", new { Status = status }, cancellationToken);
    }

    public async Task<string?> GetAllUsersAsync(string token, CancellationToken cancellationToken = default)
    {
        var client = CreateClient(token);
        var response = await client.GetAsync($"{_identityBase}/users", cancellationToken);
        if (response.IsSuccessStatusCode)
        {
            return await response.Content.ReadAsStringAsync(cancellationToken);
        }
        return null; // Handle non-success as needed
    }
}

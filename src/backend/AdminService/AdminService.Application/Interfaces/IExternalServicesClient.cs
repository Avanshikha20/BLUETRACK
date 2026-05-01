using AdminService.Application.DTOs;

namespace AdminService.Application.Interfaces;

public interface IExternalServicesClient
{
    Task<List<ShipmentSummary>?> GetAllShipmentsAsync(string token, CancellationToken cancellationToken = default);
    Task<RevenueResponse?> GetRevenueAsync(string token, CancellationToken cancellationToken = default);
    Task ForceUpdateShipmentStatusAsync(Guid shipmentId, string status, string token, CancellationToken cancellationToken = default);
    Task<string?> GetAllUsersAsync(string token, CancellationToken cancellationToken = default);
}

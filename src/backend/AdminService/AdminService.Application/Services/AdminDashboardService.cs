using AdminService.Application.DTOs;
using AdminService.Core.Entities;
using AdminService.Application.Interfaces;

namespace AdminService.Application.Services;

public interface IAdminDashboardService
{
    Task<DashboardMetricsResponse> GetDashboardMetricsAsync(string token, CancellationToken cancellationToken = default);
    Task ResolveExceptionAsync(ResolveExceptionRequest request, string token, CancellationToken cancellationToken = default);
    Task<string?> GetUsersAsync(string token, CancellationToken cancellationToken = default);
    Task<ReportDataResponse> GetReportsAsync(string token, CancellationToken cancellationToken = default);
}

public class AdminDashboardService : IAdminDashboardService
{
    private readonly IAdminRepository _adminRepository;
    private readonly IExternalServicesClient _externalClient;

    public AdminDashboardService(IAdminRepository adminRepository, IExternalServicesClient externalClient)
    {
        _adminRepository = adminRepository;
        _externalClient = externalClient;
    }

    public async Task<DashboardMetricsResponse> GetDashboardMetricsAsync(string token, CancellationToken cancellationToken = default)
    {
        var shipmentsTask = _externalClient.GetAllShipmentsAsync(token, cancellationToken);
        var revenueTask = _externalClient.GetRevenueAsync(token, cancellationToken);
        var activeExceptionsTask = _adminRepository.GetActiveExceptionsCountAsync(cancellationToken);

        await Task.WhenAll(shipmentsTask, revenueTask, activeExceptionsTask);

        var shipmentList = await shipmentsTask;
        var revenueDoc = await revenueTask;
        var activeExceptions = await activeExceptionsTask;

        int totalShipments = shipmentList?.Count ?? 0;
        int inTransit = shipmentList?.Count(s => s.Status == "InTransit") ?? 0;
        int delivered = shipmentList?.Count(s => s.Status == "Delivered") ?? 0;
        int delayed = shipmentList?.Count(s => s.Status == "Delayed") ?? 0;
        decimal totalRevenue = revenueDoc?.TotalRevenue ?? 0;

        return new DashboardMetricsResponse
        {
            TotalShipments = totalShipments,
            Revenue = totalRevenue,
            ActiveExceptions = activeExceptions,
            InTransit = inTransit,
            Delivered = delivered,
            Delayed = delayed
        };
    }

    public async Task ResolveExceptionAsync(ResolveExceptionRequest request, string token, CancellationToken cancellationToken = default)
    {
        var exception = new AdminException
        {
            Id = Guid.NewGuid(),
            ShipmentId = request.ShipmentId,
            Notes = request.Notes,
            IsResolved = true,
            ResolvedAtUtc = DateTime.UtcNow
        };

        await _adminRepository.AddExceptionAsync(exception, cancellationToken);
        await _externalClient.ForceUpdateShipmentStatusAsync(request.ShipmentId, request.ForceStatus, token, cancellationToken);
    }

    public async Task<string?> GetUsersAsync(string token, CancellationToken cancellationToken = default)
    {
        return await _externalClient.GetAllUsersAsync(token, cancellationToken);
    }

    public async Task<ReportDataResponse> GetReportsAsync(string token, CancellationToken cancellationToken = default)
    {
        var shipments = await _externalClient.GetAllShipmentsAsync(token, cancellationToken);
        var safeShipments = shipments ?? new List<ShipmentSummary>();

        int total = safeShipments.Count;
        int delayed = safeShipments.Count(s => s.Status == "Delayed" || s.Status == "Exception");
        int onTime = total - delayed;
        double compliance = total == 0 ? 100 : Math.Round((double)onTime / total * 100, 2);

        return new ReportDataResponse
        {
            SLA = new SLAStats { TotalShipments = total, OnTime = onTime, Delayed = delayed, CompliancePercentage = compliance },
            Shipments = safeShipments
        };
    }
}

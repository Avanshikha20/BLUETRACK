using AdminService.Application.DTOs;
using AdminService.Application.Interfaces;
using AdminService.Application.Services;
using AdminService.Core.Entities;

namespace AdminService.Tests;

public class SmokeTests
{
    [Test]
    public async Task GetDashboardMetricsAsync_ComputesExpectedCounts()
    {
        var repository = new FakeAdminRepository { ActiveExceptions = 2 };
        var external = new FakeExternalServicesClient
        {
            Shipments =
            [
                new ShipmentSummary { Id = Guid.NewGuid(), Status = "InTransit" },
                new ShipmentSummary { Id = Guid.NewGuid(), Status = "Delivered" },
                new ShipmentSummary { Id = Guid.NewGuid(), Status = "Delayed" },
                new ShipmentSummary { Id = Guid.NewGuid(), Status = "Delivered" },
            ],
            Revenue = new RevenueResponse { TotalRevenue = 450.5m }
        };

        var sut = new AdminDashboardService(repository, external);

        var result = await sut.GetDashboardMetricsAsync("token");

        Assert.That(result.TotalShipments, Is.EqualTo(4));
        Assert.That(result.InTransit, Is.EqualTo(1));
        Assert.That(result.Delivered, Is.EqualTo(2));
        Assert.That(result.Delayed, Is.EqualTo(1));
        Assert.That(result.ActiveExceptions, Is.EqualTo(2));
        Assert.That(result.Revenue, Is.EqualTo(450.5m));
    }

    [Test]
    public async Task ResolveExceptionAsync_PersistsExceptionAndUpdatesShipment()
    {
        var repository = new FakeAdminRepository();
        var external = new FakeExternalServicesClient();
        var sut = new AdminDashboardService(repository, external);

        var shipmentId = Guid.NewGuid();
        var request = new ResolveExceptionRequest(shipmentId, "Booked", "manual review");

        await sut.ResolveExceptionAsync(request, "jwt-token");

        Assert.That(repository.AddedException, Is.Not.Null);
        Assert.That(repository.AddedException!.ShipmentId, Is.EqualTo(shipmentId));
        Assert.That(repository.AddedException.IsResolved, Is.True);
        Assert.That(repository.AddedException.Notes, Is.EqualTo("manual review"));

        Assert.That(external.ForceUpdatedShipmentId, Is.EqualTo(shipmentId));
        Assert.That(external.ForcedStatus, Is.EqualTo("Booked"));
        Assert.That(external.ForcedToken, Is.EqualTo("jwt-token"));
    }

    private sealed class FakeAdminRepository : IAdminRepository
    {
        public int ActiveExceptions { get; set; }
        public AdminException? AddedException { get; private set; }

        public Task<int> GetActiveExceptionsCountAsync(CancellationToken cancellationToken = default)
            => Task.FromResult(ActiveExceptions);

        public Task AddExceptionAsync(AdminException exception, CancellationToken cancellationToken = default)
        {
            AddedException = exception;
            return Task.CompletedTask;
        }
    }

    private sealed class FakeExternalServicesClient : IExternalServicesClient
    {
        public List<ShipmentSummary>? Shipments { get; set; }
        public RevenueResponse? Revenue { get; set; }
        public Guid? ForceUpdatedShipmentId { get; private set; }
        public string? ForcedStatus { get; private set; }
        public string? ForcedToken { get; private set; }

        public Task<List<ShipmentSummary>?> GetAllShipmentsAsync(string token, CancellationToken cancellationToken = default)
            => Task.FromResult(Shipments);

        public Task<RevenueResponse?> GetRevenueAsync(string token, CancellationToken cancellationToken = default)
            => Task.FromResult(Revenue);

        public Task ForceUpdateShipmentStatusAsync(Guid shipmentId, string status, string token, CancellationToken cancellationToken = default)
        {
            ForceUpdatedShipmentId = shipmentId;
            ForcedStatus = status;
            ForcedToken = token;
            return Task.CompletedTask;
        }

        public Task<string?> GetAllUsersAsync(string token, CancellationToken cancellationToken = default)
            => Task.FromResult<string?>("[]");
    }
}

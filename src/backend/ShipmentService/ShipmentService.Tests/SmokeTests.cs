using Shared.Infrastructure.Exceptions;
using Shared.Models;
using ShipmentService.Application.Interfaces;
using ShipmentService.Application.Services;
using ShipmentService.Core.Entities;

namespace ShipmentService.Tests;

public class SmokeTests
{
    [Test]
    public async Task CreateShipmentAsync_CreatesDraftShipmentAndPersists()
    {
        var repository = new FakeShipmentRepository();
        var sut = new ShipmentApplicationService(repository);

        var request = new CreateShipmentRequest(
            new SenderDto("Alice", "Delhi", "11111"),
            new ReceiverDto("Bob", "Mumbai", "22222"),
            new PackageDto(2.5m, 10m, 5m, 4m, "Books"));

        var result = await sut.CreateShipmentAsync(request, "owner-1");

        Assert.That(result.OwnerId, Is.EqualTo("owner-1"));
        Assert.That(result.Status, Is.EqualTo("Draft"));
        Assert.That(result.Sender.Name, Is.EqualTo("Alice"));
        Assert.That(repository.SavedShipment, Is.Not.Null);
    }

    [Test]
    public void UpdateShipmentStatusAsync_ThrowsValidationExceptionForEmptyStatus()
    {
        var sut = new ShipmentApplicationService(new FakeShipmentRepository());

        Assert.ThrowsAsync<ValidationException>(async () =>
            await sut.UpdateShipmentStatusAsync(Guid.NewGuid(), "   "));
    }

    [Test]
    public void UpdateShipmentStatusAsync_ThrowsNotFoundWhenShipmentMissing()
    {
        var sut = new ShipmentApplicationService(new FakeShipmentRepository());

        Assert.ThrowsAsync<NotFoundException>(async () =>
            await sut.UpdateShipmentStatusAsync(Guid.NewGuid(), "Booked"));
    }

    [Test]
    public async Task UpdateShipmentStatusAsync_UpdatesExistingShipment()
    {
        var id = Guid.NewGuid();
        var repository = new FakeShipmentRepository
        {
            ExistingShipment = new Shipment
            {
                Id = id,
                OwnerId = "owner",
                Status = "Draft",
                CreatedAtUtc = DateTime.UtcNow,
                Sender = new Sender { Name = "S", Address = "A", Phone = "1" },
                Receiver = new Receiver { Name = "R", Address = "B", Phone = "2" },
                Package = new Package { WeightKg = 1, LengthCm = 1, WidthCm = 1, HeightCm = 1, Description = "D" }
            }
        };
        var sut = new ShipmentApplicationService(repository);

        await sut.UpdateShipmentStatusAsync(id, "Booked");

        Assert.That(repository.UpdatedShipment, Is.Not.Null);
        Assert.That(repository.UpdatedShipment!.Status, Is.EqualTo("Booked"));
    }

    private sealed class FakeShipmentRepository : IShipmentRepository
    {
        public Shipment? SavedShipment { get; private set; }
        public Shipment? ExistingShipment { get; set; }
        public Shipment? UpdatedShipment { get; private set; }

        public Task AddShipmentAsync(Shipment shipment, CancellationToken cancellationToken = default)
        {
            SavedShipment = shipment;
            return Task.CompletedTask;
        }

        public Task<List<Shipment>> GetShipmentsByOwnerAsync(string ownerId, CancellationToken cancellationToken = default)
            => Task.FromResult(new List<Shipment>());

        public Task<List<Shipment>> GetAllShipmentsAsync(CancellationToken cancellationToken = default)
            => Task.FromResult(new List<Shipment>());

        public Task<Shipment?> GetShipmentByIdAsync(Guid id, CancellationToken cancellationToken = default)
            => Task.FromResult(ExistingShipment?.Id == id ? ExistingShipment : null);

        public Task UpdateShipmentAsync(Shipment shipment, CancellationToken cancellationToken = default)
        {
            UpdatedShipment = shipment;
            return Task.CompletedTask;
        }
    }
}

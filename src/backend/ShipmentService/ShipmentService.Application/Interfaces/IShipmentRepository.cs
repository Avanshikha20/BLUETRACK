using ShipmentService.Core.Entities;

namespace ShipmentService.Application.Interfaces;

public interface IShipmentRepository
{
    Task AddShipmentAsync(Shipment shipment, CancellationToken cancellationToken = default);
    Task<List<Shipment>> GetShipmentsByOwnerAsync(string ownerId, CancellationToken cancellationToken = default);
    Task<List<Shipment>> GetAllShipmentsAsync(CancellationToken cancellationToken = default);
    Task<Shipment?> GetShipmentByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task UpdateShipmentAsync(Shipment shipment, CancellationToken cancellationToken = default);
}

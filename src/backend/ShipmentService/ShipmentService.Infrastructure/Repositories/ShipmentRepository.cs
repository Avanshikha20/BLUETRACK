using Microsoft.EntityFrameworkCore;
using ShipmentService.Application.Interfaces;
using ShipmentService.Core.Entities;
using ShipmentService.Infrastructure.Data;

namespace ShipmentService.Infrastructure.Repositories;

public class ShipmentRepository : IShipmentRepository
{
    private readonly ShipmentDbContext _dbContext;

    public ShipmentRepository(ShipmentDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task AddShipmentAsync(Shipment shipment, CancellationToken cancellationToken = default)
    {
        _dbContext.Shipments.Add(shipment);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<List<Shipment>> GetShipmentsByOwnerAsync(string ownerId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Shipments
            .Include(s => s.Sender)
            .Include(s => s.Receiver)
            .Include(s => s.Package)
            .Where(s => s.OwnerId == ownerId)
            .OrderByDescending(s => s.CreatedAtUtc)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Shipment>> GetAllShipmentsAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.Shipments
            .Include(s => s.Sender)
            .Include(s => s.Receiver)
            .Include(s => s.Package)
            .OrderByDescending(s => s.CreatedAtUtc)
            .ToListAsync(cancellationToken);
    }

    public async Task<Shipment?> GetShipmentByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Shipments
            .Include(s => s.Sender)
            .Include(s => s.Receiver)
            .Include(s => s.Package)
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
    }

    public async Task UpdateShipmentAsync(Shipment shipment, CancellationToken cancellationToken = default)
    {
        _dbContext.Shipments.Update(shipment);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}

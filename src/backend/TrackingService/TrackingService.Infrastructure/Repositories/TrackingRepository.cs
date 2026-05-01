using Microsoft.EntityFrameworkCore;
using TrackingService.Application.Interfaces;
using TrackingService.Core.Entities;
using TrackingService.Infrastructure.Data;

namespace TrackingService.Infrastructure.Repositories;

public class TrackingRepository : ITrackingRepository
{
    private readonly TrackingDbContext _dbContext;

    public TrackingRepository(TrackingDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task AddTrackingEventAsync(TrackingEvent trackingEvent, CancellationToken cancellationToken = default)
    {
        _dbContext.TrackingEvents.Add(trackingEvent);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<List<TrackingEvent>> GetTrackingTimelineAsync(Guid trackingId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.TrackingEvents
            .Where(t => t.TrackingId == trackingId)
            .OrderBy(t => t.TimestampUtc)
            .ToListAsync(cancellationToken);
    }

    public async Task AddDocumentAsync(Document document, CancellationToken cancellationToken = default)
    {
        _dbContext.Documents.Add(document);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<List<Document>> GetDocumentsByShipmentIdAsync(Guid shipmentId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Documents
            .Where(d => d.ShipmentId == shipmentId)
            .OrderByDescending(d => d.UploadedAtUtc)
            .ToListAsync(cancellationToken);
    }

    public async Task<Document?> GetDocumentByIdAsync(Guid documentId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Documents.FirstOrDefaultAsync(d => d.Id == documentId, cancellationToken);
    }

    public async Task SaveDeliveryProofAsync(DeliveryProof deliveryProof, CancellationToken cancellationToken = default)
    {
        _dbContext.DeliveryProofs.Add(deliveryProof);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<DeliveryProof?> GetDeliveryProofByShipmentIdAsync(Guid shipmentId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.DeliveryProofs.FirstOrDefaultAsync(d => d.ShipmentId == shipmentId, cancellationToken);
    }
}

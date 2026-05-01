using TrackingService.Core.Entities;

namespace TrackingService.Application.Interfaces;

public interface ITrackingRepository
{
    Task AddTrackingEventAsync(TrackingEvent trackingEvent, CancellationToken cancellationToken = default);
    Task<List<TrackingEvent>> GetTrackingTimelineAsync(Guid trackingId, CancellationToken cancellationToken = default);
    Task AddDocumentAsync(Document document, CancellationToken cancellationToken = default);
    Task<List<Document>> GetDocumentsByShipmentIdAsync(Guid shipmentId, CancellationToken cancellationToken = default);
    Task<Document?> GetDocumentByIdAsync(Guid documentId, CancellationToken cancellationToken = default);
    Task SaveDeliveryProofAsync(DeliveryProof deliveryProof, CancellationToken cancellationToken = default);
    Task<DeliveryProof?> GetDeliveryProofByShipmentIdAsync(Guid shipmentId, CancellationToken cancellationToken = default);
}

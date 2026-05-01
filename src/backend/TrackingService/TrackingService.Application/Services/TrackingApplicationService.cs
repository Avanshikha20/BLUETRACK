using Shared.Models;
using TrackingService.Application.Interfaces;
using TrackingService.Application.Interfaces;
using TrackingService.Core.Entities;

namespace TrackingService.Application.Services;

public interface ITrackingService
{
    Task<TrackingEvent> UpdateTrackingAsync(TrackingUpdateRequest request, CancellationToken cancellationToken = default);
    Task<List<TrackingEvent>> GetTimelineAsync(Guid trackingId, CancellationToken cancellationToken = default);
    Task<DocumentDto> UploadDocumentAsync(Guid shipmentId, string fileName, string contentType, byte[] data, CancellationToken cancellationToken = default);
    Task<List<DocumentDto>> GetDocumentsAsync(Guid shipmentId, CancellationToken cancellationToken = default);
    Task<(byte[] Data, string ContentType, string FileName)> GetDocumentFileAsync(Guid documentId, CancellationToken cancellationToken = default);
    Task<DeliveryProofDto> SaveDeliveryProofAsync(Guid shipmentId, string receiverName, string contentType, byte[] signatureImage, CancellationToken cancellationToken = default);
    Task<(byte[] Data, string ContentType, DeliveryProofDto Meta)> GetDeliveryProofAsync(Guid shipmentId, CancellationToken cancellationToken = default);
}

public class TrackingApplicationService : ITrackingService
{
    private readonly ITrackingRepository _repository;

    public TrackingApplicationService(ITrackingRepository repository)
    {
        _repository = repository;
    }

    public async Task<TrackingEvent> UpdateTrackingAsync(TrackingUpdateRequest request, CancellationToken cancellationToken = default)
    {
        var evt = new TrackingEvent
        {
            Id = Guid.NewGuid(),
            TrackingId = request.TrackingId,
            Location = request.Location,
            Status = request.Status,
            TimestampUtc = DateTime.UtcNow
        };

        await _repository.AddTrackingEventAsync(evt, cancellationToken);
        return evt;
    }

    public async Task<List<TrackingEvent>> GetTimelineAsync(Guid trackingId, CancellationToken cancellationToken = default)
    {
        return await _repository.GetTrackingTimelineAsync(trackingId, cancellationToken);
    }

    public async Task<DocumentDto> UploadDocumentAsync(Guid shipmentId, string fileName, string contentType, byte[] data, CancellationToken cancellationToken = default)
    {
        if (data == null || data.Length == 0)
            throw new ArgumentException("File is empty");

        var document = new Document
        {
            Id = Guid.NewGuid(),
            ShipmentId = shipmentId,
            FileName = fileName,
            ContentType = contentType,
            Data = data,
            UploadedAtUtc = DateTime.UtcNow
        };

        await _repository.AddDocumentAsync(document, cancellationToken);

        return new DocumentDto(document.Id, document.FileName, document.ContentType, document.UploadedAtUtc);
    }

    public async Task<List<DocumentDto>> GetDocumentsAsync(Guid shipmentId, CancellationToken cancellationToken = default)
    {
        var documents = await _repository.GetDocumentsByShipmentIdAsync(shipmentId, cancellationToken);
        return documents.Select(d => new DocumentDto(d.Id, d.FileName, d.ContentType, d.UploadedAtUtc)).ToList();
    }

    public async Task<(byte[] Data, string ContentType, string FileName)> GetDocumentFileAsync(Guid documentId, CancellationToken cancellationToken = default)
    {
        var document = await _repository.GetDocumentByIdAsync(documentId, cancellationToken);
        if (document == null)
            throw new Exception($"Document with ID '{documentId}' was not found.");

        return (document.Data, document.ContentType, document.FileName);
    }

    public async Task<DeliveryProofDto> SaveDeliveryProofAsync(Guid shipmentId, string receiverName, string contentType, byte[] signatureImage, CancellationToken cancellationToken = default)
    {
        if (signatureImage == null || signatureImage.Length == 0)
            throw new ArgumentException("Signature image is empty");

        var proof = new DeliveryProof
        {
            Id = Guid.NewGuid(),
            ShipmentId = shipmentId,
            ReceiverName = receiverName,
            ContentType = contentType,
            SignatureImage = signatureImage,
            DeliveredAtUtc = DateTime.UtcNow
        };

        await _repository.SaveDeliveryProofAsync(proof, cancellationToken);

        return new DeliveryProofDto(proof.Id, proof.ReceiverName, proof.DeliveredAtUtc);
    }

    public async Task<(byte[] Data, string ContentType, DeliveryProofDto Meta)> GetDeliveryProofAsync(Guid shipmentId, CancellationToken cancellationToken = default)
    {
        var proof = await _repository.GetDeliveryProofByShipmentIdAsync(shipmentId, cancellationToken);
        if (proof == null)
            throw new Exception($"Delivery proof for shipment '{shipmentId}' was not found.");

        var meta = new DeliveryProofDto(proof.Id, proof.ReceiverName, proof.DeliveredAtUtc);
        return (proof.SignatureImage, proof.ContentType, meta);
    }
}

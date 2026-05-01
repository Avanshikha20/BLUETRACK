namespace TrackingService.Core.Entities;

public class Document
{
    public Guid Id { get; set; }
    public Guid ShipmentId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public byte[] Data { get; set; } = Array.Empty<byte>();
    public DateTime UploadedAtUtc { get; set; }
}

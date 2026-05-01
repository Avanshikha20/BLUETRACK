namespace TrackingService.Core.Entities;

public class DeliveryProof
{
    public Guid Id { get; set; }
    public Guid ShipmentId { get; set; }
    public string ReceiverName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public byte[] SignatureImage { get; set; } = Array.Empty<byte>();
    public DateTime DeliveredAtUtc { get; set; }
}

namespace TrackingService.Core.Entities;

public sealed class TrackingEvent
{
    public Guid Id { get; set; }
    public Guid TrackingId { get; set; }
    public string Location { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime TimestampUtc { get; set; }
}

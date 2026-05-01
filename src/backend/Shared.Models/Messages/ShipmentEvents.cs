namespace Shared.Models.Messages;

public interface IShipmentCreatedEvent
{
    Guid ShipmentId { get; }
    string OwnerId { get; }
    DateTime TimestampUtc { get; }
}

public record ShipmentCreatedEvent(Guid ShipmentId, string OwnerId, DateTime TimestampUtc) : IShipmentCreatedEvent;

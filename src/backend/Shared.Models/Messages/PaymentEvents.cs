namespace Shared.Models.Messages;

public interface IPaymentCompletedEvent
{
    Guid ShipmentId { get; }
    Guid TransactionId { get; }
    DateTime TimestampUtc { get; }
}

public interface IPaymentFailedEvent
{
    Guid ShipmentId { get; }
    string Reason { get; }
    DateTime TimestampUtc { get; }
}

public record PaymentCompletedEvent(Guid ShipmentId, Guid TransactionId, DateTime TimestampUtc) : IPaymentCompletedEvent;
public record PaymentFailedEvent(Guid ShipmentId, string Reason, DateTime TimestampUtc) : IPaymentFailedEvent;

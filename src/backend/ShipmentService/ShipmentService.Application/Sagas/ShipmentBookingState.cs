using MassTransit;

namespace ShipmentService.Application.Sagas;

public class ShipmentBookingState : SagaStateMachineInstance
{
    public Guid CorrelationId { get; set; }
    public string CurrentState { get; set; } = string.Empty;
    public Guid ShipmentId { get; set; }
    public Guid? TransactionId { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
}

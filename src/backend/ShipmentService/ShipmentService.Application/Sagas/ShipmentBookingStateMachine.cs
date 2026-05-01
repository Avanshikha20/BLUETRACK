using MassTransit;
using Shared.Models.Messages;
using ShipmentService.Application.Services;
using Microsoft.Extensions.DependencyInjection;

namespace ShipmentService.Application.Sagas;

public class ShipmentBookingStateMachine : MassTransitStateMachine<ShipmentBookingState>
{
    public State PendingPayment { get; private set; } = null!;
    public State Booked { get; private set; } = null!;
    public State Failed { get; private set; } = null!;

    public Event<ShipmentCreatedEvent> ShipmentCreated { get; private set; } = null!;
    public Event<PaymentCompletedEvent> PaymentCompleted { get; private set; } = null!;
    public Event<PaymentFailedEvent> PaymentFailed { get; private set; } = null!;

    public ShipmentBookingStateMachine(IServiceProvider serviceProvider)
    {
        InstanceState(x => x.CurrentState);

        Event(() => ShipmentCreated, x => x.CorrelateById(context => context.Message.ShipmentId));
        Event(() => PaymentCompleted, x => x.CorrelateById(context => context.Message.ShipmentId));
        Event(() => PaymentFailed, x => x.CorrelateById(context => context.Message.ShipmentId));

        Initially(
            When(ShipmentCreated)
                .Then(context =>
                {
                    context.Saga.ShipmentId = context.Message.ShipmentId;
                    context.Saga.CreatedAtUtc = context.Message.TimestampUtc;
                    context.Saga.UpdatedAtUtc = DateTime.UtcNow;
                })
                .TransitionTo(PendingPayment)
        );

        During(PendingPayment,
            When(PaymentCompleted)
                .ThenAsync(async context =>
                {
                    context.Saga.TransactionId = context.Message.TransactionId;
                    context.Saga.UpdatedAtUtc = DateTime.UtcNow;

                    using var scope = serviceProvider.CreateScope();
                    var shipmentService = scope.ServiceProvider.GetRequiredService<IShipmentApplicationService>();
                    await shipmentService.UpdateShipmentStatusAsync(context.Saga.ShipmentId, "Booked");
                })
                .TransitionTo(Booked)
                .Finalize(),

            When(PaymentFailed)
                .ThenAsync(async context =>
                {
                    context.Saga.UpdatedAtUtc = DateTime.UtcNow;

                    using var scope = serviceProvider.CreateScope();
                    var shipmentService = scope.ServiceProvider.GetRequiredService<IShipmentApplicationService>();
                    await shipmentService.UpdateShipmentStatusAsync(context.Saga.ShipmentId, "Failed");
                })
                .TransitionTo(Failed)
                .Finalize()
        );

        SetCompletedWhenFinalized();
    }
}

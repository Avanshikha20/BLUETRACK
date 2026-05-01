using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ShipmentService.Application.Sagas;

namespace ShipmentService.Infrastructure.Data;

public class ShipmentBookingStateMap : IEntityTypeConfiguration<ShipmentBookingState>
{
    public void Configure(EntityTypeBuilder<ShipmentBookingState> entity)
    {
        entity.HasKey(x => x.CorrelationId);
        entity.Property(x => x.CurrentState).HasMaxLength(64);
        entity.Property(x => x.CreatedAtUtc);
        entity.Property(x => x.UpdatedAtUtc);
    }
}

using Microsoft.EntityFrameworkCore;
using TrackingService.Core.Entities;

namespace TrackingService.Infrastructure.Data;

public sealed class TrackingDbContext : DbContext
{
    public TrackingDbContext(DbContextOptions<TrackingDbContext> options) : base(options)
    {
    }

    public DbSet<TrackingEvent> TrackingEvents => Set<TrackingEvent>();
    public DbSet<Document> Documents => Set<Document>();
    public DbSet<DeliveryProof> DeliveryProofs => Set<DeliveryProof>();
}

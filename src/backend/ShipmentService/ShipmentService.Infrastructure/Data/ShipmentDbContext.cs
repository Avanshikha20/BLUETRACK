using Microsoft.EntityFrameworkCore;
using ShipmentService.Core.Entities;

namespace ShipmentService.Infrastructure.Data;

public sealed class ShipmentDbContext : DbContext
{
    public ShipmentDbContext(DbContextOptions<ShipmentDbContext> options) : base(options)
    {
    }

    public DbSet<Shipment> Shipments => Set<Shipment>();
    public DbSet<Sender> Senders => Set<Sender>();
    public DbSet<Receiver> Receivers => Set<Receiver>();
    public DbSet<Package> Packages => Set<Package>();
    public DbSet<PickupDetails> Pickups => Set<PickupDetails>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Shipment>().HasKey(x => x.Id);

        modelBuilder.Entity<Package>().Property(x => x.WeightKg).HasPrecision(10, 2);
        modelBuilder.Entity<Package>().Property(x => x.LengthCm).HasPrecision(10, 2);
        modelBuilder.Entity<Package>().Property(x => x.WidthCm).HasPrecision(10, 2);
        modelBuilder.Entity<Package>().Property(x => x.HeightCm).HasPrecision(10, 2);

        modelBuilder.Entity<Shipment>()
            .HasOne(x => x.Sender)
            .WithOne()
            .HasForeignKey<Sender>(x => x.ShipmentId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Shipment>()
            .HasOne(x => x.Receiver)
            .WithOne()
            .HasForeignKey<Receiver>(x => x.ShipmentId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Shipment>()
            .HasOne(x => x.Package)
            .WithOne()
            .HasForeignKey<Package>(x => x.ShipmentId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Shipment>()
            .HasOne(x => x.Pickup)
            .WithOne()
            .HasForeignKey<PickupDetails>(x => x.ShipmentId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

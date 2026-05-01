namespace ShipmentService.Core.Entities;

public sealed class Shipment
{
    public Guid Id { get; set; }
    public string OwnerId { get; set; } = string.Empty;
    public string Status { get; set; } = "Draft";
    public DateTime CreatedAtUtc { get; set; }
    public Sender Sender { get; set; } = null!;
    public Receiver Receiver { get; set; } = null!;
    public Package Package { get; set; } = null!;
    public PickupDetails? Pickup { get; set; }
    public Guid? AssignedHubId { get; set; }
}

public sealed class Sender
{
    public int Id { get; set; }
    public Guid ShipmentId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
}

public sealed class Receiver
{
    public int Id { get; set; }
    public Guid ShipmentId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
}

public sealed class Package
{
    public int Id { get; set; }
    public Guid ShipmentId { get; set; }
    public decimal WeightKg { get; set; }
    public decimal LengthCm { get; set; }
    public decimal WidthCm { get; set; }
    public decimal HeightCm { get; set; }
    public string Description { get; set; } = string.Empty;
}

public sealed class PickupDetails
{
    public int Id { get; set; }
    public Guid ShipmentId { get; set; }
    public DateTime Date { get; set; }
    public string Slot { get; set; } = string.Empty;
    public string Instructions { get; set; } = string.Empty;
}

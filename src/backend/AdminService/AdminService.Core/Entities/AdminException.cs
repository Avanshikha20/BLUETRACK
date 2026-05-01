namespace AdminService.Core.Entities;

public sealed class AdminException
{
    public Guid Id { get; set; }
    public Guid ShipmentId { get; set; }
    public string Notes { get; set; } = string.Empty;
    public bool IsResolved { get; set; }
    public DateTime? ResolvedAtUtc { get; set; }
}

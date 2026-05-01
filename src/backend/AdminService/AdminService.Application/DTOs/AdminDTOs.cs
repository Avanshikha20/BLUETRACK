namespace AdminService.Application.DTOs;

public sealed record ResolveExceptionRequest(Guid ShipmentId, string ForceStatus, string Notes);

public sealed class RevenueResponse
{
    public decimal TotalRevenue { get; set; }
}

public sealed class AdminSenderDto
{
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
}

public sealed class AdminReceiverDto
{
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
}

public sealed class ShipmentSummary
{
    public Guid Id { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; }
    public AdminSenderDto? Sender { get; set; }
    public AdminReceiverDto? Receiver { get; set; }
}

public sealed class SLAStats
{
    public int TotalShipments { get; set; }
    public int OnTime { get; set; }
    public int Delayed { get; set; }
    public double CompliancePercentage { get; set; }
}

public sealed class ReportDataResponse
{
    public SLAStats SLA { get; set; } = new SLAStats();
    public List<ShipmentSummary> Shipments { get; set; } = new List<ShipmentSummary>();
}

public sealed class DashboardMetricsResponse
{
    public int TotalShipments { get; set; }
    public decimal Revenue { get; set; }
    public int ActiveExceptions { get; set; }
    public int InTransit { get; set; }
    public int Delivered { get; set; }
    public int Delayed { get; set; }
}

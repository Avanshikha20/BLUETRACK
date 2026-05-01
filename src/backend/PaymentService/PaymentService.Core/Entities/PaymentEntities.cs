namespace PaymentService.Core.Entities;

public sealed class Transaction
{
    public Guid Id { get; set; }
    public Guid ShipmentId { get; set; }
    public decimal Amount { get; set; }
    public string Status { get; set; } = "Pending";
    public DateTime CreatedAtUtc { get; set; }
}

public sealed class Invoice
{
    public Guid Id { get; set; }
    public Guid TransactionId { get; set; }
    public string Number { get; set; } = string.Empty;
    public DateTime IssuedAtUtc { get; set; }
}

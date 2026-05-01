using Shared.Models;
using PaymentService.Application.Interfaces;
using PaymentService.Core.Entities;

namespace PaymentService.Application.Services;

public class PaymentResult
{
    public Guid TransactionId { get; set; }
    public string Status { get; set; } = string.Empty;
    public string InvoiceNumber { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? Warning { get; set; }
}

public interface IPaymentApplicationService
{
    Task<RazorpayOrderResponse> CreateRazorpayOrderAsync(CreateRazorpayOrderRequest request, CancellationToken cancellationToken = default);
    Task<PaymentResult> VerifyRazorpayPaymentAsync(VerifyRazorpayPaymentRequest request, string token, CancellationToken cancellationToken = default);
    Task<PaymentResult> ProcessPaymentAsync(ProcessPaymentRequest request, string token, CancellationToken cancellationToken = default);
    Task<decimal> GetRevenueAsync(CancellationToken cancellationToken = default);
    Task<byte[]> GetInvoicePdfAsync(Guid shipmentId, string token, CancellationToken cancellationToken = default);
}

public class PaymentApplicationService : IPaymentApplicationService
{
    private readonly IPaymentRepository _repository;
    private readonly IExternalServicesClient _externalClient;
    private readonly IRazorpayClient _razorpayClient;
    private readonly IInvoiceGenerator _invoiceGenerator;

    public PaymentApplicationService(IPaymentRepository repository, IExternalServicesClient externalClient, IRazorpayClient razorpayClient, IInvoiceGenerator invoiceGenerator)
    {
        _repository = repository;
        _externalClient = externalClient;
        _razorpayClient = razorpayClient;
        _invoiceGenerator = invoiceGenerator;
    }

    public async Task<RazorpayOrderResponse> CreateRazorpayOrderAsync(CreateRazorpayOrderRequest request, CancellationToken cancellationToken = default)
    {
        if (request.Amount <= 0)
        {
            throw new ArgumentException("Payment amount must be greater than zero.", nameof(request));
        }

        return await _razorpayClient.CreateOrderAsync(request, cancellationToken);
    }

    public async Task<PaymentResult> VerifyRazorpayPaymentAsync(VerifyRazorpayPaymentRequest request, string token, CancellationToken cancellationToken = default)
    {
        if (!_razorpayClient.VerifyPaymentSignature(request.RazorpayOrderId, request.RazorpayPaymentId, request.RazorpaySignature))
        {
            return new PaymentResult
            {
                Status = "Failed",
                Message = "Payment verification failed."
            };
        }

        return await CompletePaymentAsync(request.ShipmentId, request.Amount, token, cancellationToken);
    }

    public async Task<PaymentResult> ProcessPaymentAsync(ProcessPaymentRequest request, string token, CancellationToken cancellationToken = default)
    {
        return await CompletePaymentAsync(request.ShipmentId, request.Amount, token, cancellationToken);
    }

    private async Task<PaymentResult> CompletePaymentAsync(Guid shipmentId, decimal amount, string token, CancellationToken cancellationToken)
    {
        var transaction = new Transaction
        {
            Id = Guid.NewGuid(),
            ShipmentId = shipmentId,
            Amount = amount,
            Status = "Completed",
            CreatedAtUtc = DateTime.UtcNow
        };

        var invoice = new Invoice
        {
            Id = Guid.NewGuid(),
            TransactionId = transaction.Id,
            Number = $"INV-{DateTime.UtcNow:yyyyMMdd}-{Random.Shared.Next(1000, 9999)}",
            IssuedAtUtc = DateTime.UtcNow
        };

        await _repository.AddTransactionAndInvoiceAsync(transaction, invoice, cancellationToken);

        var statusUpdateSuccess = await _externalClient.UpdateShipmentStatusAsync(shipmentId, "Booked", token, cancellationToken);

        if (!statusUpdateSuccess)
        {
            return new PaymentResult
            {
                TransactionId = transaction.Id,
                Status = transaction.Status,
                InvoiceNumber = invoice.Number,
                Warning = "Payment completed but shipment status update failed."
            };
        }

        return new PaymentResult
        {
            TransactionId = transaction.Id,
            Status = transaction.Status,
            InvoiceNumber = invoice.Number,
            Message = "Payment completed and shipment booked."
        };
    }

    public async Task<decimal> GetRevenueAsync(CancellationToken cancellationToken = default)
    {
        return await _repository.GetTotalRevenueAsync(cancellationToken);
    }

    public async Task<byte[]> GetInvoicePdfAsync(Guid shipmentId, string token, CancellationToken cancellationToken = default)
    {
        var paymentDetails = await _repository.GetPaymentDetailsByShipmentIdAsync(shipmentId, cancellationToken);
        if (paymentDetails == null)
        {
            throw new KeyNotFoundException($"No completed payment found for shipment {shipmentId}");
        }

        var shipment = await _externalClient.GetShipmentDetailsAsync(shipmentId, token, cancellationToken);
        if (shipment == null)
        {
            throw new KeyNotFoundException($"Shipment details not found for {shipmentId}");
        }

        return _invoiceGenerator.GenerateInvoicePdf(shipment, paymentDetails.Value.Transaction, paymentDetails.Value.Invoice);
    }
}

using PaymentService.Core.Entities;
using Shared.Models;

namespace PaymentService.Application.Interfaces;

public interface IPaymentRepository
{
    Task AddTransactionAndInvoiceAsync(Transaction transaction, Invoice invoice, CancellationToken cancellationToken = default);
    Task<(Transaction Transaction, Invoice Invoice)?> GetPaymentDetailsByShipmentIdAsync(Guid shipmentId, CancellationToken cancellationToken = default);
    Task<decimal> GetTotalRevenueAsync(CancellationToken cancellationToken = default);
}

public interface IExternalServicesClient
{
    Task<bool> UpdateShipmentStatusAsync(Guid shipmentId, string status, string token, CancellationToken cancellationToken = default);
    Task<ShipmentDto?> GetShipmentDetailsAsync(Guid shipmentId, string token, CancellationToken cancellationToken = default);
}

public interface IRazorpayClient
{
    Task<RazorpayOrderResponse> CreateOrderAsync(CreateRazorpayOrderRequest request, CancellationToken cancellationToken = default);
    bool VerifyPaymentSignature(string orderId, string paymentId, string signature);
}

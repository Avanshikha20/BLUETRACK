using PaymentService.Application.Interfaces;
using PaymentService.Application.Services;
using PaymentService.Core.Entities;
using Shared.Models;

namespace PaymentService.Tests;

public class SmokeTests
{
    [Test]
    public async Task ProcessPaymentAsync_StatusUpdateSuccess_ReturnsSuccessMessage()
    {
        var repository = new FakePaymentRepository();
        var external = new FakeExternalServicesClient { UpdateResult = true };
        var sut = new PaymentApplicationService(repository, external, new FakeRazorpayClient());

        var request = new ProcessPaymentRequest(Guid.NewGuid(), 120m);
        var result = await sut.ProcessPaymentAsync(request, "token");

        Assert.That(repository.SavedTransaction, Is.Not.Null);
        Assert.That(repository.SavedInvoice, Is.Not.Null);
        Assert.That(result.Status, Is.EqualTo("Completed"));
        Assert.That(result.Warning, Is.Null);
        Assert.That(result.Message, Does.Contain("shipment booked"));
    }

    [Test]
    public async Task ProcessPaymentAsync_StatusUpdateFailure_ReturnsWarning()
    {
        var repository = new FakePaymentRepository();
        var external = new FakeExternalServicesClient { UpdateResult = false };
        var sut = new PaymentApplicationService(repository, external, new FakeRazorpayClient());

        var request = new ProcessPaymentRequest(Guid.NewGuid(), 99m);
        var result = await sut.ProcessPaymentAsync(request, "token");

        Assert.That(result.Warning, Does.Contain("status update failed"));
        Assert.That(result.Message, Is.Empty);
    }

    [Test]
    public async Task GetRevenueAsync_ReturnsRepositoryValue()
    {
        var repository = new FakePaymentRepository { Revenue = 345.67m };
        var sut = new PaymentApplicationService(repository, new FakeExternalServicesClient(), new FakeRazorpayClient());

        var revenue = await sut.GetRevenueAsync();

        Assert.That(revenue, Is.EqualTo(345.67m));
    }

    private sealed class FakePaymentRepository : IPaymentRepository
    {
        public Transaction? SavedTransaction { get; private set; }
        public Invoice? SavedInvoice { get; private set; }
        public decimal Revenue { get; set; }

        public Task AddTransactionAndInvoiceAsync(Transaction transaction, Invoice invoice, CancellationToken cancellationToken = default)
        {
            SavedTransaction = transaction;
            SavedInvoice = invoice;
            return Task.CompletedTask;
        }

        public Task<decimal> GetTotalRevenueAsync(CancellationToken cancellationToken = default)
            => Task.FromResult(Revenue);
    }

    private sealed class FakeExternalServicesClient : IExternalServicesClient
    {
        public bool UpdateResult { get; set; }

        public Task<bool> UpdateShipmentStatusAsync(Guid shipmentId, string status, string token, CancellationToken cancellationToken = default)
            => Task.FromResult(UpdateResult);
    }

    private sealed class FakeRazorpayClient : IRazorpayClient
    {
        public bool SignatureIsValid { get; set; } = true;

        public Task<RazorpayOrderResponse> CreateOrderAsync(CreateRazorpayOrderRequest request, CancellationToken cancellationToken = default)
            => Task.FromResult(new RazorpayOrderResponse("order_test", "rzp_test_key", request.Amount, (int)(request.Amount * 100), "INR", "receipt"));

        public bool VerifyPaymentSignature(string orderId, string paymentId, string signature)
            => SignatureIsValid;
    }
}

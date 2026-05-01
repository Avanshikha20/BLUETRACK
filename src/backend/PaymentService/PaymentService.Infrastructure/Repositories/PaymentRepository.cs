using Microsoft.EntityFrameworkCore;
using PaymentService.Application.Interfaces;
using PaymentService.Core.Entities;
using PaymentService.Infrastructure.Data;

namespace PaymentService.Infrastructure.Repositories;

public class PaymentRepository : IPaymentRepository
{
    private readonly PaymentDbContext _dbContext;

    public PaymentRepository(PaymentDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task AddTransactionAndInvoiceAsync(Transaction transaction, Invoice invoice, CancellationToken cancellationToken = default)
    {
        _dbContext.Transactions.Add(transaction);
        _dbContext.Invoices.Add(invoice);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<(Transaction Transaction, Invoice Invoice)?> GetPaymentDetailsByShipmentIdAsync(Guid shipmentId, CancellationToken cancellationToken = default)
    {
        var transaction = await _dbContext.Transactions
            .FirstOrDefaultAsync(t => t.ShipmentId == shipmentId && t.Status == "Completed", cancellationToken);

        if (transaction == null) return null;

        var invoice = await _dbContext.Invoices
            .FirstOrDefaultAsync(i => i.TransactionId == transaction.Id, cancellationToken);

        if (invoice == null) return null;

        return (transaction, invoice);
    }

    public async Task<decimal> GetTotalRevenueAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.Transactions
            .Where(t => t.Status == "Completed")
            .SumAsync(t => t.Amount, cancellationToken);
    }
}

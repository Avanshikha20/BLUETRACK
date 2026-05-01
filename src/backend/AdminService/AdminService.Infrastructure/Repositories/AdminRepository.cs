using AdminService.Application.Interfaces;
using AdminService.Core.Entities;
using AdminService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AdminService.Infrastructure.Repositories;

public class AdminRepository : IAdminRepository
{
    private readonly AdminDbContext _dbContext;

    public AdminRepository(AdminDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<int> GetActiveExceptionsCountAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.AdminExceptions.CountAsync(e => !e.IsResolved, cancellationToken);
    }

    public async Task AddExceptionAsync(AdminException exception, CancellationToken cancellationToken = default)
    {
        _dbContext.AdminExceptions.Add(exception);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}

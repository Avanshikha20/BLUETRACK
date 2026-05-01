using AdminService.Application.Interfaces;
using AdminService.Core.Entities;
using AdminService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AdminService.Infrastructure.Repositories;

public class HubRepository : IHubRepository
{
    private readonly AdminDbContext _dbContext;

    public HubRepository(AdminDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<Hub>> GetAllHubsAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.Hubs.ToListAsync(cancellationToken);
    }

    public async Task<Hub?> GetHubByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Hubs.FindAsync(new object[] { id }, cancellationToken);
    }

    public async Task AddHubAsync(Hub hub, CancellationToken cancellationToken = default)
    {
        _dbContext.Hubs.Add(hub);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateHubAsync(Hub hub, CancellationToken cancellationToken = default)
    {
        _dbContext.Hubs.Update(hub);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteHubAsync(Hub hub, CancellationToken cancellationToken = default)
    {
        _dbContext.Hubs.Remove(hub);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}

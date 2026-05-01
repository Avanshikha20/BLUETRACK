using AdminService.Core.Entities;

namespace AdminService.Application.Interfaces;

public interface IHubRepository
{
    Task<List<Hub>> GetAllHubsAsync(CancellationToken cancellationToken = default);
    Task<Hub?> GetHubByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task AddHubAsync(Hub hub, CancellationToken cancellationToken = default);
    Task UpdateHubAsync(Hub hub, CancellationToken cancellationToken = default);
    Task DeleteHubAsync(Hub hub, CancellationToken cancellationToken = default);
}

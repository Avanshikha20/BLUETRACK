using AdminService.Application.DTOs;

namespace AdminService.Application.Interfaces;

public interface IHubService
{
    Task<List<HubDto>> GetAllHubsAsync(CancellationToken cancellationToken = default);
    Task<HubDto> GetHubByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<HubDto> CreateHubAsync(CreateHubRequest request, CancellationToken cancellationToken = default);
    Task<HubDto> UpdateHubAsync(Guid id, UpdateHubRequest request, CancellationToken cancellationToken = default);
    Task DeleteHubAsync(Guid id, CancellationToken cancellationToken = default);
}

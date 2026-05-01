using AdminService.Application.DTOs;
using AdminService.Application.Interfaces;
using AdminService.Core.Entities;

namespace AdminService.Application.Services;

public class HubService : IHubService
{
    private readonly IHubRepository _repository;

    public HubService(IHubRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<HubDto>> GetAllHubsAsync(CancellationToken cancellationToken = default)
    {
        var hubs = await _repository.GetAllHubsAsync(cancellationToken);
        return hubs.Select(h => new HubDto(h.Id, h.Name, h.Location, h.ContactPerson, h.Phone, h.IsActive)).ToList();
    }

    public async Task<HubDto> GetHubByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var hub = await _repository.GetHubByIdAsync(id, cancellationToken);
        if (hub == null)
            throw new KeyNotFoundException($"Hub with ID '{id}' was not found.");

        return new HubDto(hub.Id, hub.Name, hub.Location, hub.ContactPerson, hub.Phone, hub.IsActive);
    }

    public async Task<HubDto> CreateHubAsync(CreateHubRequest request, CancellationToken cancellationToken = default)
    {
        var hub = new Hub
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Location = request.Location,
            ContactPerson = request.ContactPerson,
            Phone = request.Phone,
            IsActive = request.IsActive
        };

        await _repository.AddHubAsync(hub, cancellationToken);

        return new HubDto(hub.Id, hub.Name, hub.Location, hub.ContactPerson, hub.Phone, hub.IsActive);
    }

    public async Task<HubDto> UpdateHubAsync(Guid id, UpdateHubRequest request, CancellationToken cancellationToken = default)
    {
        var hub = await _repository.GetHubByIdAsync(id, cancellationToken);
        if (hub == null)
            throw new KeyNotFoundException($"Hub with ID '{id}' was not found.");

        hub.Name = request.Name;
        hub.Location = request.Location;
        hub.ContactPerson = request.ContactPerson;
        hub.Phone = request.Phone;
        hub.IsActive = request.IsActive;

        await _repository.UpdateHubAsync(hub, cancellationToken);

        return new HubDto(hub.Id, hub.Name, hub.Location, hub.ContactPerson, hub.Phone, hub.IsActive);
    }

    public async Task DeleteHubAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var hub = await _repository.GetHubByIdAsync(id, cancellationToken);
        if (hub == null)
            throw new KeyNotFoundException($"Hub with ID '{id}' was not found.");

        await _repository.DeleteHubAsync(hub, cancellationToken);
    }
}

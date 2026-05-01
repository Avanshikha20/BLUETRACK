namespace AdminService.Application.DTOs;

public record HubDto(
    Guid Id,
    string Name,
    string Location,
    string ContactPerson,
    string Phone,
    bool IsActive
);

public record CreateHubRequest(
    string Name,
    string Location,
    string ContactPerson,
    string Phone,
    bool IsActive
);

public record UpdateHubRequest(
    string Name,
    string Location,
    string ContactPerson,
    string Phone,
    bool IsActive
);

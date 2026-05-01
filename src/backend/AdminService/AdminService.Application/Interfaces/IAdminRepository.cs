using AdminService.Core.Entities;

namespace AdminService.Application.Interfaces;

public interface IAdminRepository
{
    Task<int> GetActiveExceptionsCountAsync(CancellationToken cancellationToken = default);
    Task AddExceptionAsync(AdminException exception, CancellationToken cancellationToken = default);
}

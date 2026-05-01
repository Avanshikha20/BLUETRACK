using AdminService.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace AdminService.Infrastructure.Data;

public sealed class AdminDbContext : DbContext
{
    public AdminDbContext(DbContextOptions<AdminDbContext> options) : base(options)
    {
    }

    public DbSet<AdminException> AdminExceptions => Set<AdminException>();
    public DbSet<Hub> Hubs => Set<Hub>();
}

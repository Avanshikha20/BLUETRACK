using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace IdentityService.Infrastructure.Data;

public sealed class IdentityDb : IdentityDbContext<IdentityUser, IdentityRole, string>
{
    public IdentityDb(DbContextOptions<IdentityDb> options) : base(options)
    {
    }
}

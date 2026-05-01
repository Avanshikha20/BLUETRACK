using Shared.Models;
using IdentityService.Core.Entities;

namespace IdentityService.Application.Interfaces;

public interface IAuthService
{
    Task<(bool Success, IEnumerable<string>? Errors, string? Email, string? Role)> RegisterAsync(RegisterRequest request);
    Task<(bool Success, bool RequiresOtp, string? Email)> LoginAsync(LoginRequest request);
    Task<(bool Success, AuthResponse? Response, string? Error)> VerifyOtpAsync(VerifyOtpRequest request);
    Task<(bool Success, AuthResponse? Response, string? Error)> GoogleLoginAsync(GoogleLoginRequest request);
    Task<List<object>> GetUsersAsync();
}

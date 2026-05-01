namespace IdentityService.Core.Entities;

public sealed record VerifyOtpRequest(string Email, string Otp);
public sealed record OtpEntry(string Otp, DateTime Expiry, string UserId, string Role);
public sealed record GoogleLoginRequest(string IdToken);

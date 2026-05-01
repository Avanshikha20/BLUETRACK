using System.Collections.Concurrent;
using System.IdentityModel.Tokens.Jwt;
using System.Net.Http;
using System.Security.Claims;
using System.Text;
using IdentityService.Application.Interfaces;
using IdentityService.Core.Entities;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using MimeKit;
using Shared.Models;
using Google.Apis.Auth;

namespace IdentityService.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly UserManager<IdentityUser> _userManager;
    private readonly IConfiguration _config;
    private readonly ConcurrentDictionary<string, OtpEntry> _store;
    private readonly IHttpClientFactory _httpClientFactory;

    public AuthService(
        UserManager<IdentityUser> userManager,
        IConfiguration config,
        ConcurrentDictionary<string, OtpEntry> store,
        IHttpClientFactory httpClientFactory)
    {
        _userManager = userManager;
        _config = config;
        _store = store;
        _httpClientFactory = httpClientFactory;
    }

    public async Task<(bool Success, IEnumerable<string>? Errors, string? Email, string? Role)> RegisterAsync(RegisterRequest request)
    {
        var role = request.Role is "Admin" ? "Admin" : "Customer";
        var user = new IdentityUser { UserName = request.Email, Email = request.Email };

        var createResult = await _userManager.CreateAsync(user, request.Password);
        if (!createResult.Succeeded)
            return (false, createResult.Errors.Select(e => e.Description), null, null);

        var roleResult = await _userManager.AddToRoleAsync(user, role);
        if (!roleResult.Succeeded)
            return (false, roleResult.Errors.Select(e => e.Description), null, null);

        return (true, null, user.Email, role);
    }

    public async Task<(bool Success, bool RequiresOtp, string? Email)> LoginAsync(LoginRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user is null) return (false, false, null);

        if (!await _userManager.CheckPasswordAsync(user, request.Password))
            return (false, false, null);

        var roles = await _userManager.GetRolesAsync(user);
        var role = roles.FirstOrDefault() ?? "Customer";

        var otp = Random.Shared.Next(100_000, 999_999).ToString();
        _store[request.Email] = new OtpEntry(otp, DateTime.UtcNow.AddMinutes(10), user.Id, role);

        try
        {
            var smtp = _config.GetSection("Smtp");
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress("SmartShip", smtp["SenderEmail"]));
            message.To.Add(new MailboxAddress(string.Empty, request.Email));
            message.Subject = "SmartShip — Your verification code";
            message.Body = new TextPart("html")
            {
                Text = $"""
                    <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:2rem;background:#f8f6ef;border-radius:12px">
                      <h2 style="color:#0d9488;margin-bottom:0.5rem">SmartShip</h2>
                      <p style="color:#374947">Hi there! Use the code below to complete your sign-in.</p>
                      <div style="background:#fff;border:1px solid #d7d1bb;border-radius:8px;padding:1.5rem;text-align:center;margin:1.5rem 0">
                        <span style="font-size:2.4rem;font-weight:700;letter-spacing:0.25em;color:#1a2926">{otp}</span>
                      </div>
                      <p style="color:#7a8c88;font-size:0.85rem">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
                      <p style="color:#b0b8b5;font-size:0.75rem;margin-top:1rem">SmartShip · Automated security email</p>
                    </div>
                    """
            };

            using var client = new SmtpClient();
            await client.ConnectAsync(smtp["SmtpHost"], int.Parse(smtp["SmtpPort"]!), SecureSocketOptions.StartTls);
            await client.AuthenticateAsync(smtp["SenderEmail"], smtp["SenderPassword"]);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[OTP EMAIL ERROR] {ex.Message}");
        }

        return (true, true, request.Email);
    }

    public Task<(bool Success, AuthResponse? Response, string? Error)> VerifyOtpAsync(VerifyOtpRequest request)
    {
        if (!_store.TryGetValue(request.Email, out var entry))
            return Task.FromResult((false, (AuthResponse?)null, "No pending verification for this email."));

        if (DateTime.UtcNow > entry.Expiry)
        {
            _store.TryRemove(request.Email, out _);
            return Task.FromResult((false, (AuthResponse?)null, "Verification code has expired. Please log in again."));
        }

        if (entry.Otp != request.Otp)
            return Task.FromResult((false, (AuthResponse?)null, "Invalid verification code."));

        _store.TryRemove(request.Email, out _);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub,   entry.UserId),
            new(JwtRegisteredClaimNames.Email, request.Email),
            new(ClaimTypes.NameIdentifier,     entry.UserId),
            new(ClaimTypes.Email,              request.Email),
            new(ClaimTypes.Role,               entry.Role),
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: creds);

        var jwt = new JwtSecurityTokenHandler().WriteToken(token);
        return Task.FromResult((true, new AuthResponse(jwt, request.Email, entry.Role), (string?)null));
    }

    public async Task<(bool Success, AuthResponse? Response, string? Error)> GoogleLoginAsync(GoogleLoginRequest request)
    {
        try
        {
            // Use Google's userinfo endpoint to validate the access_token
            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Authorization =
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", request.IdToken);

            var userInfoResponse = await client.GetAsync("https://www.googleapis.com/oauth2/v3/userinfo");
            if (!userInfoResponse.IsSuccessStatusCode)
                return (false, null, "Failed to validate Google token.");

            var userInfoJson = await userInfoResponse.Content.ReadAsStringAsync();
            using var doc = System.Text.Json.JsonDocument.Parse(userInfoJson);
            var email = doc.RootElement.GetProperty("email").GetString();

            if (string.IsNullOrWhiteSpace(email))
                return (false, null, "Could not retrieve email from Google.");

            var user = await _userManager.FindByEmailAsync(email);
            var role = "Customer";

            if (user == null)
            {
                user = new IdentityUser { UserName = email, Email = email };
                var createResult = await _userManager.CreateAsync(user);
                if (!createResult.Succeeded)
                    return (false, null, "Failed to create user from Google account.");

                await _userManager.AddToRoleAsync(user, role);
            }
            else
            {
                var roles = await _userManager.GetRolesAsync(user);
                role = roles.FirstOrDefault() ?? "Customer";
            }

            var claims = new List<Claim>
            {
                new(JwtRegisteredClaimNames.Sub,   user.Id),
                new(JwtRegisteredClaimNames.Email, user.Email!),
                new(ClaimTypes.NameIdentifier,     user.Id),
                new(ClaimTypes.Email,              user.Email!),
                new(ClaimTypes.Role,               role),
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(8),
                signingCredentials: creds);

            var jwt = new JwtSecurityTokenHandler().WriteToken(token);
            return (true, new AuthResponse(jwt, user.Email!, role), null);
        }
        catch (Exception ex)
        {
            return (false, null, $"Google authentication error: {ex.Message}");
        }
    }

    public async Task<List<object>> GetUsersAsync()
    {
        var users = _userManager.Users.ToList();
        var result = new List<object>();
        foreach (var u in users)
        {
            var roles = await _userManager.GetRolesAsync(u);
            result.Add(new
            {
                id = u.Id,
                email = u.Email,
                role = roles.FirstOrDefault() ?? "Customer",
            });
        }
        return result;
    }
}

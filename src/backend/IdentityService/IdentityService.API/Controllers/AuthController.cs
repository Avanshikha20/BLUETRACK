using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IdentityService.Application.Interfaces;
using Shared.Models;
using IdentityService.Core.Entities;

namespace IdentityService.API.Controllers;

[ApiController]
[Route("")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var (success, errors, email, role) = await _authService.RegisterAsync(request);
        if (!success) return BadRequest(errors);
        return Ok(new { Message = "User registered successfully", email, Role = role });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var (success, requiresOtp, email) = await _authService.LoginAsync(request);
        if (!success) return Unauthorized();
        return Ok(new { requiresOtp, email });
    }

    [HttpPost("verify-otp")]
    public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequest request)
    {
        var (success, response, error) = await _authService.VerifyOtpAsync(request);
        if (!success) return BadRequest(new { error });
        return Ok(response);
    }

    [HttpPost("google-login")]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequest request)
    {
        var (success, response, error) = await _authService.GoogleLoginAsync(request);
        if (!success) return BadRequest(new { error });
        return Ok(response);
    }

    [HttpGet("users")]
    // Missing authorize by design for gateway proxy as seen in original code
    public async Task<IActionResult> GetUsers()
    {
        var users = await _authService.GetUsersAsync();
        return Ok(users);
    }
}

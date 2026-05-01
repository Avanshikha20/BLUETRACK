using AdminService.Application.DTOs;
using AdminService.Application.Interfaces;
using AdminService.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AdminService.API.Controllers;

[ApiController]
[Route("")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly IAdminDashboardService _dashboardService;
    private readonly IHubService _hubService;

    public AdminController(IAdminDashboardService dashboardService, IHubService hubService)
    {
        _dashboardService = dashboardService;
        _hubService = hubService;
    }

    private string GetToken()
    {
        var authHeader = Request.Headers.Authorization.ToString();
        return authHeader.Replace("Bearer ", string.Empty);
    }

    [HttpGet("dashboard-metrics")]
    public async Task<IActionResult> GetDashboardMetrics(CancellationToken cancellationToken)
    {
        var metrics = await _dashboardService.GetDashboardMetricsAsync(GetToken(), cancellationToken);
        return Ok(metrics);
    }

    [HttpPut("resolve-exception")]
    public async Task<IActionResult> ResolveException([FromBody] ResolveExceptionRequest request, CancellationToken cancellationToken)
    {
        await _dashboardService.ResolveExceptionAsync(request, GetToken(), cancellationToken);
        return Ok(new { Message = "Exception resolved and shipment force-updated." });
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers(CancellationToken cancellationToken)
    {
        var usersResponse = await _dashboardService.GetUsersAsync(GetToken(), cancellationToken);
        if (usersResponse == null)
        {
            return StatusCode(500, "Failed to retrieve users from Identity Service.");
        }
        return Content(usersResponse, "application/json");
    }

    [HttpGet("reports")]
    public async Task<IActionResult> GetReportsAsync(CancellationToken cancellationToken)
    {
        var reports = await _dashboardService.GetReportsAsync(GetToken(), cancellationToken);
        return Ok(reports);
    }

    [HttpGet("hubs")]
    public async Task<IActionResult> GetHubs(CancellationToken cancellationToken)
    {
        var hubs = await _hubService.GetAllHubsAsync(cancellationToken);
        return Ok(hubs);
    }

    [HttpPost("hubs")]
    public async Task<IActionResult> CreateHub([FromBody] CreateHubRequest request, CancellationToken cancellationToken)
    {
        var hub = await _hubService.CreateHubAsync(request, cancellationToken);
        return Ok(hub);
    }

    [HttpPut("hubs/{id}")]
    public async Task<IActionResult> UpdateHub(Guid id, [FromBody] UpdateHubRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var hub = await _hubService.UpdateHubAsync(id, request, cancellationToken);
            return Ok(hub);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { Message = ex.Message });
        }
    }

    [HttpDelete("hubs/{id}")]
    public async Task<IActionResult> DeleteHub(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            await _hubService.DeleteHubAsync(id, cancellationToken);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { Message = ex.Message });
        }
    }
}

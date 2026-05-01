using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NotificationService.Application.Services;
using Shared.Models;

namespace NotificationService.API.Controllers;

[ApiController]
[Route("")]
[Authorize]
public class NotificationController : ControllerBase
{
    private readonly INotificationApplicationService _notificationService;

    public NotificationController(INotificationApplicationService notificationService)
    {
        _notificationService = notificationService;
    }

    [HttpPost("notify")]
    public async Task<IActionResult> Notify([FromBody] NotificationRequest request, CancellationToken cancellationToken)
    {
        await _notificationService.NotifyAsync(request, cancellationToken);
        return Ok(new { Message = "Email Sent", request.Email });
    }
}

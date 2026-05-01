using NotificationService.Application.Interfaces;
using Shared.Models;

namespace NotificationService.Application.Services;

public interface INotificationApplicationService
{
    Task NotifyAsync(NotificationRequest request, CancellationToken cancellationToken = default);
}

public class NotificationApplicationService : INotificationApplicationService
{
    private readonly IEmailSender _emailSender;

    public NotificationApplicationService(IEmailSender emailSender)
    {
        _emailSender = emailSender;
    }

    public async Task NotifyAsync(NotificationRequest request, CancellationToken cancellationToken = default)
    {
        await _emailSender.SendEmailAsync(request.Email, request.Message, cancellationToken);
    }
}

namespace NotificationService.Application.Interfaces;

public interface IEmailSender
{
    Task SendEmailAsync(string email, string message, CancellationToken cancellationToken = default);
}

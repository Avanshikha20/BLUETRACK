using NotificationService.Application.Interfaces;

namespace NotificationService.Infrastructure.Services;

public class ConsoleEmailSender : IEmailSender
{
    public Task SendEmailAsync(string email, string message, CancellationToken cancellationToken = default)
    {
        Console.WriteLine($"Email Sent -> To: {email} | Message: {message}");
        return Task.CompletedTask;
    }
}

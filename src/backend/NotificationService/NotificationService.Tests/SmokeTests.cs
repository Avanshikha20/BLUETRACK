using NotificationService.Application.Interfaces;
using NotificationService.Application.Services;
using Shared.Models;

namespace NotificationService.Tests;

public class SmokeTests
{
    [Test]
    public async Task NotifyAsync_ForwardsEmailAndMessageToSender()
    {
        var sender = new FakeEmailSender();
        var sut = new NotificationApplicationService(sender);

        var request = new NotificationRequest("user@test.com", "Shipment created");
        await sut.NotifyAsync(request);

        Assert.That(sender.Email, Is.EqualTo("user@test.com"));
        Assert.That(sender.Message, Is.EqualTo("Shipment created"));
        Assert.That(sender.CallCount, Is.EqualTo(1));
    }

    private sealed class FakeEmailSender : IEmailSender
    {
        public string? Email { get; private set; }
        public string? Message { get; private set; }
        public int CallCount { get; private set; }

        public Task SendEmailAsync(string email, string message, CancellationToken cancellationToken = default)
        {
            Email = email;
            Message = message;
            CallCount++;
            return Task.CompletedTask;
        }
    }
}

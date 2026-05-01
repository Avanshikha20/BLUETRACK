using System.Collections.Concurrent;
using IdentityService.Core.Entities;
using IdentityService.Infrastructure.Services;
using Microsoft.Extensions.Configuration;

namespace IdentityService.Tests;

public class SmokeTests
{
    [Test]
    public async Task VerifyOtpAsync_ReturnsErrorWhenNoPendingVerification()
    {
        var store = new ConcurrentDictionary<string, OtpEntry>();
        var sut = CreateService(store);

        var (success, response, error) = await sut.VerifyOtpAsync(new VerifyOtpRequest("user@test.com", "123456"));

        Assert.That(success, Is.False);
        Assert.That(response, Is.Null);
        Assert.That(error, Does.Contain("No pending verification"));
    }

    [Test]
    public async Task VerifyOtpAsync_ExpiredCode_RemovesEntryAndReturnsError()
    {
        var store = new ConcurrentDictionary<string, OtpEntry>();
        store["user@test.com"] = new OtpEntry("123456", DateTime.UtcNow.AddMinutes(-1), "user-id", "Customer");
        var sut = CreateService(store);

        var (success, response, error) = await sut.VerifyOtpAsync(new VerifyOtpRequest("user@test.com", "123456"));

        Assert.That(success, Is.False);
        Assert.That(response, Is.Null);
        Assert.That(error, Does.Contain("expired"));
        Assert.That(store.ContainsKey("user@test.com"), Is.False);
    }

    [Test]
    public async Task VerifyOtpAsync_ValidCode_ReturnsAuthResponseAndClearsPendingEntry()
    {
        var store = new ConcurrentDictionary<string, OtpEntry>();
        store["user@test.com"] = new OtpEntry("654321", DateTime.UtcNow.AddMinutes(5), "user-id", "Admin");
        var sut = CreateService(store);

        var (success, response, error) = await sut.VerifyOtpAsync(new VerifyOtpRequest("user@test.com", "654321"));

        Assert.That(success, Is.True);
        Assert.That(error, Is.Null);
        Assert.That(response, Is.Not.Null);
        Assert.That(response!.Email, Is.EqualTo("user@test.com"));
        Assert.That(response.Role, Is.EqualTo("Admin"));
        Assert.That(response.Token, Is.Not.Empty);
        Assert.That(store.ContainsKey("user@test.com"), Is.False);
    }

    private static AuthService CreateService(ConcurrentDictionary<string, OtpEntry> store)
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"] = "this-is-a-long-enough-test-key-for-jwt-token-signing",
                ["Jwt:Issuer"] = "SmartShip.Tests",
                ["Jwt:Audience"] = "SmartShip.Clients"
            })
            .Build();

        return new AuthService(
            userManager: null!,
            config: config,
            store: store,
            httpClientFactory: null!);
    }
}

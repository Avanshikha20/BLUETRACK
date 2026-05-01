using Shared.Models;
using TrackingService.Application.Interfaces;
using TrackingService.Application.Services;
using TrackingService.Core.Entities;

namespace TrackingService.Tests;

public class SmokeTests
{
    [Test]
    public async Task UpdateTrackingAsync_CreatesAndPersistsEvent()
    {
        var repository = new FakeTrackingRepository();
        var sut = new TrackingApplicationService(repository);
        var trackingId = Guid.NewGuid();

        var result = await sut.UpdateTrackingAsync(new TrackingUpdateRequest(trackingId, "Delhi Hub", "InTransit"));

        Assert.That(result.TrackingId, Is.EqualTo(trackingId));
        Assert.That(result.Location, Is.EqualTo("Delhi Hub"));
        Assert.That(result.Status, Is.EqualTo("InTransit"));
        Assert.That(repository.AddedEvent, Is.Not.Null);
    }

    [Test]
    public async Task GetTimelineAsync_ReturnsRepositoryTimeline()
    {
        var trackingId = Guid.NewGuid();
        var expected = new List<TrackingEvent>
        {
            new() { Id = Guid.NewGuid(), TrackingId = trackingId, Location = "A", Status = "Created", TimestampUtc = DateTime.UtcNow }
        };

        var repository = new FakeTrackingRepository { Timeline = expected };
        var sut = new TrackingApplicationService(repository);

        var result = await sut.GetTimelineAsync(trackingId);

        Assert.That(result, Has.Count.EqualTo(1));
        Assert.That(result[0].Status, Is.EqualTo("Created"));
    }

    private sealed class FakeTrackingRepository : ITrackingRepository
    {
        public TrackingEvent? AddedEvent { get; private set; }
        public List<TrackingEvent> Timeline { get; set; } = new();

        public Task AddTrackingEventAsync(TrackingEvent trackingEvent, CancellationToken cancellationToken = default)
        {
            AddedEvent = trackingEvent;
            return Task.CompletedTask;
        }

        public Task<List<TrackingEvent>> GetTrackingTimelineAsync(Guid trackingId, CancellationToken cancellationToken = default)
            => Task.FromResult(Timeline);
    }
}

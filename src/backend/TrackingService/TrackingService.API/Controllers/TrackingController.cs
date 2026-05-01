using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shared.Models;
using TrackingService.Application.Services;

namespace TrackingService.API.Controllers;

[ApiController]
[Route("")]
[Authorize]
public class TrackingController : ControllerBase
{
    private readonly ITrackingService _trackingService;

    public TrackingController(ITrackingService trackingService)
    {
        _trackingService = trackingService;
    }

    [HttpPost("update")]
    public async Task<IActionResult> UpdateTracking([FromBody] TrackingUpdateRequest request, CancellationToken cancellationToken)
    {
        var evt = await _trackingService.UpdateTrackingAsync(request, cancellationToken);
        return Ok(evt);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetTrackingTimeline(Guid id, CancellationToken cancellationToken)
    {
        var timeline = await _trackingService.GetTimelineAsync(id, cancellationToken);
        return Ok(timeline);
    }

    [HttpPost("documents/upload")]
    public async Task<IActionResult> UploadDocument([FromForm] Guid shipmentId, IFormFile file, CancellationToken cancellationToken)
    {
        if (file == null || file.Length == 0)
            return BadRequest("File is empty.");

        using var memoryStream = new MemoryStream();
        await file.CopyToAsync(memoryStream, cancellationToken);
        var data = memoryStream.ToArray();

        var result = await _trackingService.UploadDocumentAsync(shipmentId, file.FileName, file.ContentType, data, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}/documents")]
    public async Task<IActionResult> GetDocuments(Guid id, CancellationToken cancellationToken)
    {
        var documents = await _trackingService.GetDocumentsAsync(id, cancellationToken);
        return Ok(documents);
    }

    [HttpGet("documents/{docId:guid}/download")]
    public async Task<IActionResult> DownloadDocument(Guid docId, CancellationToken cancellationToken)
    {
        var (data, contentType, fileName) = await _trackingService.GetDocumentFileAsync(docId, cancellationToken);
        return File(data, contentType, fileName);
    }

    [HttpGet("{id:guid}/delivery-proof")]
    public async Task<IActionResult> GetDeliveryProof(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            var (data, contentType, meta) = await _trackingService.GetDeliveryProofAsync(id, cancellationToken);
            return Ok(new
            {
                id = meta.Id,
                receiverName = meta.ReceiverName,
                deliveredAtUtc = meta.DeliveredAtUtc,
                contentType,
                imageBase64 = Convert.ToBase64String(data)
            });
        }
        catch (Exception ex) when (ex.Message.Contains("not found"))
        {
            return NotFound(new { Message = ex.Message });
        }
    }

    [HttpPost("{id:guid}/delivery-proof")]
    public async Task<IActionResult> UploadDeliveryProof(Guid id, [FromForm] string receiverName, IFormFile signatureImage, CancellationToken cancellationToken)
    {
        if (signatureImage == null || signatureImage.Length == 0)
            return BadRequest("Signature image is required.");

        if (string.IsNullOrWhiteSpace(receiverName))
            return BadRequest("Receiver name is required.");

        using var ms = new MemoryStream();
        await signatureImage.CopyToAsync(ms, cancellationToken);
        var imageBytes = ms.ToArray();

        var result = await _trackingService.SaveDeliveryProofAsync(id, receiverName, signatureImage.ContentType, imageBytes, cancellationToken);
        return Ok(result);
    }
}

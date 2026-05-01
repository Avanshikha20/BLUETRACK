using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shared.Models;
using ShipmentService.Application.Services;

namespace ShipmentService.API.Controllers;

[ApiController]
[Route("shipments")]
public class ShipmentController : ControllerBase
{
    private readonly IShipmentApplicationService _shipmentService;

    public ShipmentController(IShipmentApplicationService shipmentService)
    {
        _shipmentService = shipmentService;
    }

    public sealed record UpdateShipmentStatusRequest(string Status);

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateShipment([FromBody] CreateShipmentRequest request, CancellationToken cancellationToken)
    {
        var ownerId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(ownerId))
            return Unauthorized();

        var dto = await _shipmentService.CreateShipmentAsync(request, ownerId, cancellationToken);
        return Created($"/shipments/{dto.Id}", dto);
    }

    [HttpGet("my")]
    [Authorize]
    public async Task<IActionResult> GetMyShipments(CancellationToken cancellationToken)
    {
        var ownerId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(ownerId))
            return Unauthorized();

        var shipments = await _shipmentService.GetMyShipmentsAsync(ownerId, cancellationToken);
        return Ok(shipments);
    }

    [HttpGet("drafts/latest")]
    [Authorize]
    public async Task<IActionResult> GetLatestDraft(CancellationToken cancellationToken)
    {
        var ownerId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(ownerId))
            return Unauthorized();

        var draft = await _shipmentService.GetLatestDraftAsync(ownerId, cancellationToken);
        return draft is null ? NoContent() : Ok(draft);
    }

    [HttpPost("draft")]
    [Authorize]
    public async Task<IActionResult> CreateDraft([FromBody] CreateShipmentRequest request, CancellationToken cancellationToken)
    {
        var ownerId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(ownerId))
            return Unauthorized();

        var draft = await _shipmentService.CreateDraftAsync(request, ownerId, cancellationToken);
        return Created($"/shipments/{draft.Id}", draft);
    }

    [HttpPut("{id:guid}/draft")]
    [Authorize]
    public async Task<IActionResult> UpdateDraft(Guid id, [FromBody] CreateShipmentRequest request, CancellationToken cancellationToken)
    {
        var ownerId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(ownerId))
            return Unauthorized();

        var draft = await _shipmentService.UpdateDraftAsync(id, request, ownerId, cancellationToken);
        return Ok(draft);
    }

    [HttpGet("all")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAllShipments(CancellationToken cancellationToken)
    {
        var shipments = await _shipmentService.GetAllShipmentsAsync(cancellationToken);
        return Ok(shipments);
    }

    [HttpGet("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> GetShipmentById(Guid id, CancellationToken cancellationToken)
    {
        var shipment = await _shipmentService.GetShipmentByIdAsync(id, cancellationToken);

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isAdmin = User.IsInRole("Admin");
        if (!isAdmin && !string.Equals(shipment.OwnerId, userId, StringComparison.Ordinal))
            return Forbid();

        return Ok(shipment);
    }

    [HttpPut("{id:guid}/status")]
    [Authorize]
    public async Task<IActionResult> UpdateShipmentStatus(Guid id, [FromBody] UpdateShipmentStatusRequest request, CancellationToken cancellationToken)
    {
        await _shipmentService.UpdateShipmentStatusAsync(id, request.Status, cancellationToken);
        return Ok(new { Id = id, Status = request.Status });
    }

    [HttpPut("{id:guid}/hub")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateShipmentHub(Guid id, [FromBody] UpdateShipmentHubRequest request, CancellationToken cancellationToken)
    {
        await _shipmentService.UpdateShipmentHubAsync(id, request.HubId, cancellationToken);
        return Ok(new { Id = id, HubId = request.HubId });
    }
}

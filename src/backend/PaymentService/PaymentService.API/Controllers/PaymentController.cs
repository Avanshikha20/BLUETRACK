using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PaymentService.Application.Services;
using Shared.Models;

namespace PaymentService.API.Controllers;

[ApiController]
[Route("")]
[Authorize]
public class PaymentController : ControllerBase
{
    private readonly IPaymentApplicationService _paymentService;

    public PaymentController(IPaymentApplicationService paymentService)
    {
        _paymentService = paymentService;
    }

    private string GetToken()
    {
        var authHeader = Request.Headers.Authorization.ToString();
        return authHeader.Replace("Bearer ", string.Empty);
    }

    [HttpPost("orders")]
    public async Task<IActionResult> CreateOrder([FromBody] CreateRazorpayOrderRequest request, CancellationToken cancellationToken)
    {
        var result = await _paymentService.CreateRazorpayOrderAsync(request, cancellationToken);
        return Ok(result);
    }

    [HttpPost("verify")]
    public async Task<IActionResult> Verify([FromBody] VerifyRazorpayPaymentRequest request, CancellationToken cancellationToken)
    {
        var result = await _paymentService.VerifyRazorpayPaymentAsync(request, GetToken(), cancellationToken);
        if (result.Status == "Failed")
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    [HttpPost("process")]
    public async Task<IActionResult> Process([FromBody] ProcessPaymentRequest request, CancellationToken cancellationToken)
    {
        var result = await _paymentService.ProcessPaymentAsync(request, GetToken(), cancellationToken);
        return Ok(result);
    }

    [HttpGet("metrics/revenue")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetRevenue(CancellationToken cancellationToken)
    {
        var total = await _paymentService.GetRevenueAsync(cancellationToken);
        return Ok(new { TotalRevenue = total });
    }

    [HttpGet("invoice/{shipmentId:guid}")]
    public async Task<IActionResult> GetInvoice(Guid shipmentId, CancellationToken cancellationToken)
    {
        try
        {
            var pdfBytes = await _paymentService.GetInvoicePdfAsync(shipmentId, GetToken(), cancellationToken);
            return File(pdfBytes, "application/pdf", $"Invoice-{shipmentId}.pdf");
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = "Error generating invoice", Details = ex.Message });
        }
    }
}

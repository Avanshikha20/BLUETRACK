namespace Shared.Models;

public sealed record RegisterRequest(string Email, string Password, string Role);

public sealed record LoginRequest(string Email, string Password);

public sealed record AuthResponse(string Token, string Email, string Role);

public sealed record SenderDto(string Name, string Address, string Phone);

public sealed record ReceiverDto(string Name, string Address, string Phone);

public sealed record PackageDto(decimal WeightKg, decimal LengthCm, decimal WidthCm, decimal HeightCm, string Description);

public sealed record PickupDto(DateTime Date, string Slot, string Instructions);

public sealed record CreateShipmentRequest(SenderDto Sender, ReceiverDto Receiver, PackageDto Package, PickupDto? Pickup);

public sealed record ShipmentDto(
	Guid Id,
	string OwnerId,
	string Status,
	SenderDto Sender,
	ReceiverDto Receiver,
	PackageDto Package,
	PickupDto? Pickup,
	DateTime CreatedAtUtc,
	Guid? AssignedHubId = null
);

public sealed record UpdateShipmentHubRequest(Guid? HubId);

public sealed record ProcessPaymentRequest(Guid ShipmentId, decimal Amount);

public sealed record CreateRazorpayOrderRequest(Guid ShipmentId, decimal Amount);

public sealed record RazorpayOrderResponse(
	string OrderId,
	string KeyId,
	decimal Amount,
	int AmountInSubunits,
	string Currency,
	string Receipt
);

public sealed record VerifyRazorpayPaymentRequest(
	Guid ShipmentId,
	decimal Amount,
	string RazorpayOrderId,
	string RazorpayPaymentId,
	string RazorpaySignature
);

public sealed record TrackingUpdateRequest(Guid TrackingId, string Location, string Status);

public sealed record NotificationRequest(string Email, string Message);

public sealed record DocumentDto(Guid Id, string FileName, string ContentType, DateTime UploadedAtUtc);

public sealed record DeliveryProofDto(Guid Id, string ReceiverName, DateTime DeliveredAtUtc);

using Shared.Models;
using ShipmentService.Application.Interfaces;
using ShipmentService.Core.Entities;
using Shared.Infrastructure.Exceptions;

namespace ShipmentService.Application.Services;

public interface IShipmentApplicationService
{
    Task<ShipmentDto> CreateShipmentAsync(CreateShipmentRequest request, string ownerId, CancellationToken cancellationToken = default);
    Task<List<ShipmentDto>> GetMyShipmentsAsync(string ownerId, CancellationToken cancellationToken = default);
    Task<List<ShipmentDto>> GetAllShipmentsAsync(CancellationToken cancellationToken = default);
    Task<ShipmentDto> GetShipmentByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ShipmentDto> CreateDraftAsync(CreateShipmentRequest request, string ownerId, CancellationToken cancellationToken = default);
    Task<ShipmentDto> UpdateDraftAsync(Guid id, CreateShipmentRequest request, string ownerId, CancellationToken cancellationToken = default);
    Task<ShipmentDto?> GetLatestDraftAsync(string ownerId, CancellationToken cancellationToken = default);
    Task UpdateShipmentStatusAsync(Guid id, string status, CancellationToken cancellationToken = default);
    Task UpdateShipmentHubAsync(Guid id, Guid? hubId, CancellationToken cancellationToken = default);
}

public class ShipmentApplicationService : IShipmentApplicationService
{
    private readonly IShipmentRepository _repository;
    private readonly MassTransit.IPublishEndpoint _publishEndpoint;

    public ShipmentApplicationService(IShipmentRepository repository, MassTransit.IPublishEndpoint publishEndpoint)
    {
        _repository = repository;
        _publishEndpoint = publishEndpoint;
    }

    public async Task<ShipmentDto> CreateShipmentAsync(CreateShipmentRequest request, string ownerId, CancellationToken cancellationToken = default)
    {
        var shipment = new Shipment
        {
            Id = Guid.NewGuid(),
            OwnerId = ownerId,
            Status = "Draft",
            CreatedAtUtc = DateTime.UtcNow,
            Sender = new Sender
            {
                Name = request.Sender.Name,
                Address = request.Sender.Address,
                Phone = request.Sender.Phone
            },
            Receiver = new Receiver
            {
                Name = request.Receiver.Name,
                Address = request.Receiver.Address,
                Phone = request.Receiver.Phone
            },
            Package = new Package
            {
                WeightKg = request.Package.WeightKg,
                LengthCm = request.Package.LengthCm,
                WidthCm = request.Package.WidthCm,
                HeightCm = request.Package.HeightCm,
                Description = request.Package.Description
            },
            Pickup = request.Pickup != null ? new PickupDetails
            {
                Date = request.Pickup.Date,
                Slot = request.Pickup.Slot,
                Instructions = request.Pickup.Instructions
            } : null
        };

        await _repository.AddShipmentAsync(shipment, cancellationToken);
        
        await _publishEndpoint.Publish(new Shared.Models.Messages.ShipmentCreatedEvent(shipment.Id, ownerId, DateTime.UtcNow), cancellationToken);

        return ToDto(shipment);
    }

    public async Task<List<ShipmentDto>> GetMyShipmentsAsync(string ownerId, CancellationToken cancellationToken = default)
    {
        var shipments = await _repository.GetShipmentsByOwnerAsync(ownerId, cancellationToken);
        return shipments.Select(ToDto).ToList();
    }

    public async Task<List<ShipmentDto>> GetAllShipmentsAsync(CancellationToken cancellationToken = default)
    {
        var shipments = await _repository.GetAllShipmentsAsync(cancellationToken);
        return shipments.Select(ToDto).ToList();
    }

    public async Task<ShipmentDto> CreateDraftAsync(CreateShipmentRequest request, string ownerId, CancellationToken cancellationToken = default)
    {
        var shipment = new Shipment
        {
            Id = Guid.NewGuid(),
            OwnerId = ownerId,
            Status = "Draft",
            CreatedAtUtc = DateTime.UtcNow,
            Sender = new Sender
            {
                Name = request.Sender.Name,
                Address = request.Sender.Address,
                Phone = request.Sender.Phone
            },
            Receiver = new Receiver
            {
                Name = request.Receiver.Name,
                Address = request.Receiver.Address,
                Phone = request.Receiver.Phone
            },
            Package = new Package
            {
                WeightKg = request.Package.WeightKg,
                LengthCm = request.Package.LengthCm,
                WidthCm = request.Package.WidthCm,
                HeightCm = request.Package.HeightCm,
                Description = request.Package.Description
            },
            Pickup = request.Pickup != null ? new PickupDetails
            {
                Date = request.Pickup.Date,
                Slot = request.Pickup.Slot,
                Instructions = request.Pickup.Instructions
            } : null
        };

        await _repository.AddShipmentAsync(shipment, cancellationToken);
        return ToDto(shipment);
    }

    public async Task<ShipmentDto> UpdateDraftAsync(Guid id, CreateShipmentRequest request, string ownerId, CancellationToken cancellationToken = default)
    {
        var shipment = await _repository.GetShipmentByIdAsync(id, cancellationToken);
        if (shipment is null)
            throw new NotFoundException($"Shipment with ID '{id}' was not found.");

        if (!string.Equals(shipment.OwnerId, ownerId, StringComparison.Ordinal))
            throw new AppException("You are not allowed to modify this shipment draft.", 403);

        shipment.Status = "Draft";
        shipment.Sender.Name = request.Sender.Name;
        shipment.Sender.Address = request.Sender.Address;
        shipment.Sender.Phone = request.Sender.Phone;
        shipment.Receiver.Name = request.Receiver.Name;
        shipment.Receiver.Address = request.Receiver.Address;
        shipment.Receiver.Phone = request.Receiver.Phone;
        shipment.Package.WeightKg = request.Package.WeightKg;
        shipment.Package.LengthCm = request.Package.LengthCm;
        shipment.Package.WidthCm = request.Package.WidthCm;
        shipment.Package.HeightCm = request.Package.HeightCm;
        shipment.Package.Description = request.Package.Description;

        if (request.Pickup != null)
        {
            if (shipment.Pickup == null) shipment.Pickup = new PickupDetails();
            shipment.Pickup.Date = request.Pickup.Date;
            shipment.Pickup.Slot = request.Pickup.Slot;
            shipment.Pickup.Instructions = request.Pickup.Instructions;
        }
        else
        {
            shipment.Pickup = null;
        }

        await _repository.UpdateShipmentAsync(shipment, cancellationToken);
        return ToDto(shipment);
    }

    public async Task<ShipmentDto?> GetLatestDraftAsync(string ownerId, CancellationToken cancellationToken = default)
    {
        var shipments = await _repository.GetShipmentsByOwnerAsync(ownerId, cancellationToken);
        var latestDraft = shipments.FirstOrDefault(s => string.Equals(s.Status, "Draft", StringComparison.OrdinalIgnoreCase));
        return latestDraft is null ? null : ToDto(latestDraft);
    }

    public async Task<ShipmentDto> GetShipmentByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var shipment = await _repository.GetShipmentByIdAsync(id, cancellationToken);
        if (shipment is null)
            throw new NotFoundException($"Shipment with ID '{id}' was not found.");

        return ToDto(shipment);
    }

    public async Task UpdateShipmentStatusAsync(Guid id, string status, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(status))
            throw new ValidationException("Shipment status cannot be empty.");

        var shipment = await _repository.GetShipmentByIdAsync(id, cancellationToken);
        if (shipment is null) 
            throw new NotFoundException($"Shipment with ID '{id}' was not found.");

        shipment.Status = status;
        await _repository.UpdateShipmentAsync(shipment, cancellationToken);
    }

    public async Task UpdateShipmentHubAsync(Guid id, Guid? hubId, CancellationToken cancellationToken = default)
    {
        var shipment = await _repository.GetShipmentByIdAsync(id, cancellationToken);
        if (shipment is null)
            throw new NotFoundException($"Shipment with ID '{id}' was not found.");

        shipment.AssignedHubId = hubId;
        await _repository.UpdateShipmentAsync(shipment, cancellationToken);
    }

    private static ShipmentDto ToDto(Shipment shipment) =>
        new(
            shipment.Id,
            shipment.OwnerId,
            shipment.Status,
            new SenderDto(shipment.Sender.Name, shipment.Sender.Address, shipment.Sender.Phone),
            new ReceiverDto(shipment.Receiver.Name, shipment.Receiver.Address, shipment.Receiver.Phone),
            new PackageDto(shipment.Package.WeightKg, shipment.Package.LengthCm, shipment.Package.WidthCm, shipment.Package.HeightCm, shipment.Package.Description),
            shipment.Pickup != null ? new PickupDto(shipment.Pickup.Date, shipment.Pickup.Slot, shipment.Pickup.Instructions) : null,
            shipment.CreatedAtUtc,
            shipment.AssignedHubId
        );
}

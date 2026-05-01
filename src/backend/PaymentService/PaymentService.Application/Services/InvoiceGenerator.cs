using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using Shared.Models;
using PaymentService.Core.Entities;

namespace PaymentService.Application.Services;

public interface IInvoiceGenerator
{
    byte[] GenerateInvoicePdf(ShipmentDto shipment, Transaction transaction, Invoice invoice);
}

public class InvoiceGenerator : IInvoiceGenerator
{
    public byte[] GenerateInvoicePdf(ShipmentDto shipment, Transaction transaction, Invoice invoice)
    {
        // Set QuestPDF license (Community is free for small companies/individuals)
        QuestPDF.Settings.License = LicenseType.Community;

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(1, Unit.Inch);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(10).FontFamily(Fonts.Verdana));

                page.Header().Row(row =>
                {
                    row.RelativeItem().Column(col =>
                    {
                        col.Item().Text("SmartShip").FontSize(24).SemiBold().FontColor(Colors.Blue.Medium);
                        col.Item().Text("Global Logistics & Shipping Solutions").FontSize(9).Italic();
                    });

                    row.RelativeItem().AlignRight().Column(col =>
                    {
                        col.Item().Text("Invoice").FontSize(20).SemiBold();
                        col.Item().Text($"Invoice #: {invoice.Number}");
                        col.Item().Text($"Date: {invoice.IssuedAtUtc:MMM dd, yyyy}");
                    });
                });

                page.Content().PaddingVertical(20).Column(col =>
                {
                    // Section: Addresses
                    col.Item().Row(row =>
                    {
                        row.RelativeItem().Column(c =>
                        {
                            c.Item().Text("From (Sender)").SemiBold().Underline();
                            c.Item().Text(shipment.Sender.Name);
                            c.Item().Text(shipment.Sender.Address);
                            c.Item().Text($"Phone: {shipment.Sender.Phone}");
                        });

                        row.ConstantItem(50);

                        row.RelativeItem().Column(c =>
                        {
                            c.Item().Text("To (Receiver)").SemiBold().Underline();
                            c.Item().Text(shipment.Receiver.Name);
                            c.Item().Text(shipment.Receiver.Address);
                            c.Item().Text($"Phone: {shipment.Receiver.Phone}");
                        });
                    });

                    col.Item().PaddingTop(20).LineHorizontal(1).LineColor(Colors.Grey.Lighten2);

                    // Section: Shipment Info
                    col.Item().PaddingTop(10).Text("Shipment Details").SemiBold();
                    col.Item().Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.RelativeColumn(3);
                            columns.RelativeColumn();
                            columns.RelativeColumn();
                        });

                        table.Header(header =>
                        {
                            header.Cell().Element(CellStyle).Text("Description");
                            header.Cell().Element(CellStyle).AlignRight().Text("Weight (Kg)");
                            header.Cell().Element(CellStyle).AlignRight().Text("Amount (INR)");

                            static IContainer CellStyle(IContainer container)
                            {
                                return container.DefaultTextStyle(x => x.SemiBold()).PaddingVertical(5).BorderBottom(1).BorderColor(Colors.Black);
                            }
                        });

                        table.Cell().Element(CellStyle).Text(shipment.Package.Description ?? "Standard Package");
                        table.Cell().Element(CellStyle).AlignRight().Text($"{shipment.Package.WeightKg}");
                        table.Cell().Element(CellStyle).AlignRight().Text($"{transaction.Amount:N2}");

                        static IContainer CellStyle(IContainer container)
                        {
                            return container.PaddingVertical(5);
                        }
                    });

                    // Section: Totals
                    col.Item().AlignRight().PaddingTop(20).Column(c =>
                    {
                        c.Item().Text($"Subtotal: ₹{transaction.Amount:N2}");
                        c.Item().Text($"Tax (0%): ₹0.00");
                        c.Item().PaddingTop(5).Text($"Total: ₹{transaction.Amount:N2}").FontSize(14).SemiBold().FontColor(Colors.Blue.Medium);
                    });

                    // Section: Additional Info
                    col.Item().PaddingTop(30).Column(c =>
                    {
                        c.Item().Text("Additional Information").SemiBold();
                        c.Item().Text($"Shipment ID: {shipment.Id}");
                        c.Item().Text($"Transaction ID: {transaction.Id}");
                        c.Item().Text($"Payment Status: {transaction.Status}");
                    });
                });

                page.Footer().AlignCenter().Column(c =>
                {
                    c.Item().LineHorizontal(1).LineColor(Colors.Grey.Lighten2);
                    c.Item().PaddingTop(5).Text("Thank you for choosing SmartShip!").SemiBold();
                    c.Item().Text("For any queries, contact support@smartship.com");
                    c.Item().Text(x =>
                    {
                        x.Span("Page ");
                        x.CurrentPageNumber();
                    });
                });
            });
        });

        return document.GeneratePdf();
    }
}

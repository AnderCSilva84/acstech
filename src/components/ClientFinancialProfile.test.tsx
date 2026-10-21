import { it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ClientFinancialProfile } from "./ClientFinancialProfile";
it("isola o cliente e organiza cobranças, produtos, serviços e comprovantes por data", async () => {
  const client = {
    id: "c1",
    name: "Ana",
    phone: "11999999999",
    document: "",
    establishments: [
      {
        id: "e1",
        name: "Loja Ana",
        system: "PDV Ana",
        url: "https://example.com",
      },
    ],
  };
  const base = { clientId: "c1", amount: 10000, status: "pending" };
  render(
    <ClientFinancialProfile
      client={client}
      charges={[
        {
          ...base,
          id: "q1",
          description: "Mais antiga Ana",
          dueDate: "2026-09-10",
          category: "product",
        },
        {
          ...base,
          id: "q2",
          description: "Mais recente Ana",
          dueDate: "2026-10-10",
          category: "service",
        },
        {
          ...base,
          id: "q3",
          description: "Cobrança Bia",
          clientId: "c2",
          dueDate: "2026-10-20",
        },
      ]}
      payments={[
        {
          id: "p1",
          clientId: "c1",
          description: "Recibo antigo",
          amount: 10000,
          paidAt: "2026-09-10",
          method: "PIX",
        },
        {
          id: "p2",
          clientId: "c1",
          description: "Recibo recente",
          amount: 20000,
          paidAt: "2026-10-10",
          method: "PIX",
        },
        {
          id: "p3",
          clientId: "c2",
          description: "Recibo Bia",
          amount: 99999,
          paidAt: "2026-10-20",
          method: "PIX",
        },
      ]}
      requests={[
        {
          id: "r1",
          clientId: "c1",
          title: "Manutenção Ana",
          details: "Visita",
          createdAt: "2026-10-10",
          status: "received",
        },
        {
          id: "r2",
          clientId: "c2",
          title: "Serviço Bia",
          details: "",
          createdAt: "2026-10-10",
          status: "received",
        },
      ]}
      onBack={vi.fn()}
      onEdit={vi.fn()}
      onCharge={vi.fn()}
      onSettle={vi.fn()}
      onRemove={vi.fn()}
    />,
  );
  expect(screen.queryByText("Cobrança Bia")).not.toBeInTheDocument();
  let records = within(
    screen.getByRole("region", { name: "Financeiro" }),
  ).getAllByRole("article");
  expect(records[0]).toHaveTextContent("Mais recente Ana");
  await userEvent.selectOptions(
    screen.getByLabelText("Ordenar por data"),
    "asc",
  );
  records = within(
    screen.getByRole("region", { name: "Financeiro" }),
  ).getAllByRole("article");
  expect(records[0]).toHaveTextContent("Mais antiga Ana");
  await userEvent.click(screen.getByRole("button", { name: "Produtos" }));
  expect(screen.getByText("PDV Ana")).toBeInTheDocument();
  expect(screen.queryByText("Mais recente Ana")).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Serviços" }));
  expect(screen.getByText("Manutenção Ana")).toBeInTheDocument();
  expect(screen.queryByText("Serviço Bia")).not.toBeInTheDocument();
  await userEvent.click(
    screen.getByRole("button", { name: "Comprovantes (2)" }),
  );
  expect(screen.queryByText("Recibo Bia")).not.toBeInTheDocument();
  expect(
    screen.getAllByRole("link", { name: "Abrir comprovante" })[0],
  ).toHaveAttribute("href", "/api/portal/receipt?clientId=c1&id=p1");
});

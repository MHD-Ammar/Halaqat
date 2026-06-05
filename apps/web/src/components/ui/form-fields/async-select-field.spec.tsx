import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";

import { AsyncSelectField } from "./async-select-field";

function Wrapper({
  children,
  queryClient,
}: {
  children: React.ReactNode;
  queryClient: QueryClient;
}) {
  const form = useForm<{ teacherId: string }>({ defaultValues: { teacherId: "" } });
  return (
    <QueryClientProvider client={queryClient}>
      <FormProvider {...form}>{children}</FormProvider>
    </QueryClientProvider>
  );
}

describe("AsyncSelectField", () => {
  it("renders loading state", async () => {
    const queryClient = new QueryClient();
    type Teacher = { id: string; name: string };
    render(
      <Wrapper queryClient={queryClient}>
        <AsyncSelectField<Teacher>
          name="teacherId"
          label="المعلم"
          queryKey={["teachers"]}
          queryFn={() => new Promise<Teacher[]>(() => {})}
          getOptionValue={(t) => t.id}
          getOptionLabel={(t) => t.name}
        />
      </Wrapper>,
    );

    expect(screen.getByText(/جاري التحميل/i)).toBeInTheDocument();
  });
});

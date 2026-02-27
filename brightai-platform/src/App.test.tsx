import React from "react";
import { render, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "./i18n";
import App from "./App";

test("يعرض القالب العام للتطبيق", async () => {
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>
  );

  await waitFor(() => {
    expect(document.querySelector("[data-rht-toaster]")).toBeInTheDocument();
  });
});

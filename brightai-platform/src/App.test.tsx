import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "./i18n";
import App from "./App";

test("يعرض العنوان الرئيسي للصفحة", () => {
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>
  );
  const titleElement = screen.getByText(/حوّل البيانات التشغيلية/);
  expect(titleElement).toBeInTheDocument();
});

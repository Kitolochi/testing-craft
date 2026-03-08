/**
 * Simple DOM component factories for visual regression testing.
 * Each returns an HTML element that can be rendered and screenshot-tested.
 */

export function createButton(label: string, variant: "primary" | "secondary" | "danger" = "primary"): HTMLButtonElement {
  const button = document.createElement("button");
  button.textContent = label;
  button.style.cssText = `
    padding: 8px 16px;
    border-radius: 6px;
    border: none;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  `;

  const variants = {
    primary: "background: #3b82f6; color: white;",
    secondary: "background: #e5e7eb; color: #1f2937;",
    danger: "background: #ef4444; color: white;",
  };

  button.style.cssText += variants[variant];
  return button;
}

export function createCard(title: string, body: string): HTMLDivElement {
  const card = document.createElement("div");
  card.style.cssText = `
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 16px;
    max-width: 320px;
    font-family: system-ui, sans-serif;
    background: white;
  `;

  const h3 = document.createElement("h3");
  h3.textContent = title;
  h3.style.cssText = "margin: 0 0 8px; font-size: 16px; color: #111827;";

  const p = document.createElement("p");
  p.textContent = body;
  p.style.cssText = "margin: 0; font-size: 14px; color: #6b7280; line-height: 1.5;";

  card.append(h3, p);
  return card;
}

export function createBadge(text: string, color: string = "#3b82f6"): HTMLSpanElement {
  const badge = document.createElement("span");
  badge.textContent = text;
  badge.style.cssText = `
    display: inline-block;
    padding: 2px 8px;
    border-radius: 9999px;
    font-size: 12px;
    font-weight: 500;
    background: ${color}20;
    color: ${color};
    border: 1px solid ${color}40;
  `;
  return badge;
}

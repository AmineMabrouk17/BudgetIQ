interface TurnstileRenderOptions {
  sitekey: string;
  action?: string;
  callback?: (token: string) => void;
  "expired-callback"?: () => void;
  "error-callback"?: () => void;
}

interface Turnstile {
  render: (
    container: HTMLElement,
    options: TurnstileRenderOptions
  ) => string;
  reset: (widgetId?: string | HTMLElement) => void;
  remove: (widgetId: string | HTMLElement) => void;
}

interface Window {
  turnstile?: Turnstile;
}
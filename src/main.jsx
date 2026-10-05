import React from "react";
import { createRoot } from "react-dom/client";
import App from "./MarketApp.jsx";

class ErrorBoundary extends React.Component {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <main className="error-screen">
        <h1>Вернёмся к игре.</h1>
        <p>
          Не удалось открыть экран. Ваши демоматериалы сохранены в этом
          браузере.
        </p>
        <button
          onClick={() => {
            location.hash = "/";
            location.reload();
          }}
        >
          Смотреть прогнозы
        </button>
      </main>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);

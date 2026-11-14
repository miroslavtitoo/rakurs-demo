// Synthetic identity used only in browser checks, never in the application bundle.
export const testAccount = { name: "Алина Ветрова", method: "telegram", telegramId: 123456 };
export async function setTelegramTestUser(page) {
  await page.evaluate(() => {
    window.Telegram.WebApp.initDataUnsafe.user = {
      id: 123456, first_name: "Алина", last_name: "Ветрова",
    };
  });
}
export async function signInTelegram(page) {
  await setTelegramTestUser(page);
  await page.getByRole("button", { name: "Войти через Telegram", exact: true }).click();
}

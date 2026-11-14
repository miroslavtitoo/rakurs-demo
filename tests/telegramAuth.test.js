import test from "node:test";
import assert from "node:assert/strict";
import { isTelegramAccount, telegramAccount, requestTelegramContact } from "../src/telegramAuth.js";

test("Only a Telegram identity enters; legacy phone profiles are retained but cannot authenticate", () => {
  for (const profile of [null, { name: "Участник", phoneSuffix: "1234" }, { name: "Ира", method: "telegram", telegramId: 0 }])
    assert.equal(isTelegramAccount(profile), false);
  assert.equal(telegramAccount({ initDataUnsafe: { user: { id: "123" } } }), null);
  const account = telegramAccount({ initDataUnsafe: { user: { id: 123, first_name: "Ира", last_name: "Иванова" } } });
  assert.equal(isTelegramAccount(account), true);
  assert.equal(account.name, "Ира Иванова");
  assert.equal(telegramAccount({ initDataUnsafe: { user: { id: 123 } } }).name, "Участник");
});

test("Contact sharing uses the native API, reports consent only and handles denial/unsupported/errors", () => {
  let result;
  const done = (status) => { result = status; };
  requestTelegramContact(null, done);
  assert.equal(result, "unsupported");
  const tg = { isVersionAtLeast: (version) => version === "6.9", requestContact: (cb) => cb(false) };
  requestTelegramContact(tg, done);
  assert.equal(result, "declined");
  tg.requestContact = (cb) => cb(true);
  requestTelegramContact(tg, done);
  assert.equal(result, "shared");
  tg.requestContact = () => { throw new Error("native unavailable"); };
  requestTelegramContact(tg, done);
  assert.equal(result, "error");
});

import { chromium, expect } from "@playwright/test";
import fs from "node:fs/promises";
import { rewardDay } from "../src/rewards.js";
const browser=await chromium.launch({channel:"msedge"});
const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const page=await context.newPage(), base=process.env.DEMO_URL || "http://localhost:5173/", errors=[];
page.on("pageerror",e=>errors.push(e.message));
await fs.mkdir("tmp/rakurs-v13",{recursive:true});
await context.addInitScript(day=>{
  if(localStorage.getItem("v13-seeded"))return;
  localStorage.setItem("v13-seeded","true");
  localStorage.setItem("rakurs:pdfOnboardingSeen","true");
  localStorage.setItem("rakurs:demoUser",JSON.stringify({method:"telegram",telegramId:42,name:"Алина"}));
  localStorage.setItem("rakurs:rewardsWallet",JSON.stringify({balance:0,lastShownDay:day}));
},rewardDay());
const route=async path=>{await page.goto(base+"#"+path);await expect(page.locator("main>[data-route]")).toHaveAttribute("data-route",path);};
try {
  await route("/");await expect(page).toHaveTitle(/Rakurs/);
  await expect(page.locator(".diverge-logo img")).toHaveAttribute("src",/rakurs\/logo/);
  const nav=page.locator(".bottom-nav"); const n=await nav.boundingBox();
  const buttons=await nav.locator("button").all();
  for(const button of buttons){const box=await button.boundingBox();expect(box.width).toBe(box.height);expect(Math.abs((box.y-n.y)-(n.y+n.height-box.y-box.height))).toBeLessThan(1);}
  await route("/subscription");
  const cards=page.locator(".polished-package");await expect(cards).toHaveCount(3);
  for(const [i,price] of [[0,"9,67"],[1,"7,80"],[2,"6,90"]])await expect(cards.nth(i).locator(".pack-unit")).toContainText(price);
  await expect(page.locator(".plans-offer")).toHaveCount(0);
  await expect(page.locator("main")).not.toContainText(/1 000|месяц|популярный|отзыв/i);
  await cards.nth(1).click();await page.getByRole("button",{name:/Купить пакет/}).click();
  await expect(page.getByRole("dialog")).toContainText("5 матчей");
  await page.getByRole("button",{name:"Оплатить 39 ₽",exact:true}).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".plans-owned")).toContainText("5");await page.reload();await expect(page.locator(".plans-owned")).toContainText("5");
  await route("/profile");await page.locator(".profile-wheel-card").click();
  await expect(page.locator(".roulette-wallet")).toHaveCount(1);await expect(page.getByRole("button",{name:"Монетки",exact:true})).toHaveCount(0);
  const reel=await page.locator(".reel-cards").elementHandle();
  await page.getByRole("button",{name:"Призы",exact:true}).click();
  await expect(page.locator(".roulette-internal-overlay .prize-grid-card")).toHaveCount(9);
  await page.keyboard.press("Escape");await expect(page.locator(".roulette-internal-overlay")).toHaveCount(0);
  expect(await reel.evaluate(el=>el.isConnected)).toBe(true);
  await page.getByRole("button",{name:/Получить монеты за вход/}).click();
  await expect(page.locator(".roulette-rewards")).toBeVisible();await page.getByRole("button",{name:"Забрать награду",exact:true}).click();
  await expect(page.locator(".next-reward-time")).toHaveText("24:00");
  await page.keyboard.press("Escape");await expect(page.locator(".roulette-internal-overlay")).toHaveCount(0);await expect(page.locator(".roulette-wallet")).toContainText("10");
  expect(await reel.evaluate(el=>el.isConnected)).toBe(true);
  await page.getByRole("button",{name:"Закрыть",exact:true}).click();await expect(page.getByRole("dialog")).toHaveCount(0);
  // A real saved coupon controls both the deadline and checkout price; reload does not extend it.
  const deadline=Date.now()+86400000;
  await page.evaluate(expiresAt=>{const key="rakurs:rewardsWallet",w=JSON.parse(localStorage.getItem(key));w.coupons=[{id:"test-coupon",percent:20,expiresAt}];localStorage.setItem(key,JSON.stringify(w));},deadline);
  await page.reload();await route("/");await expect(page.locator(".coupon-notice")).toBeVisible({timeout:7500});await page.waitForTimeout(600);
  const notice=await page.locator(".coupon-notice").boundingBox();expect(Math.abs(notice.x+notice.width/2-195)).toBeLessThan(1);
  await page.screenshot({path:"tmp/rakurs-v13/coupon-notice.png"});
  await route("/subscription");await expect(page.locator(".plans-offer time")).toHaveAttribute("datetime",new Date(deadline).toISOString());
  await expect(cards.first().locator(".pack-price strong")).toContainText("23");await page.reload();await expect(page.locator(".plans-offer time")).toHaveAttribute("datetime",new Date(deadline).toISOString());
  await page.getByRole("button",{name:/Купить пакет/}).click();await page.getByRole("button",{name:"Оплатить 23 ₽",exact:true}).click();await expect(page.getByRole("dialog")).toHaveCount(0);await expect(page.locator(".plans-offer")).toHaveCount(0);
  await route("/chat");const input=page.getByRole("textbox",{name:"Сообщение AI"});
  expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1)).toBe(true);
  const before=await page.locator(".chat-mind i").first().evaluate(el=>getComputedStyle(el).transform);await page.waitForTimeout(250);expect(await page.locator(".chat-mind i").first().evaluate(el=>getComputedStyle(el).transform)).not.toBe(before);
  await input.tap();await input.fill("Покажи матчи");await expect(page.locator(".general-chat")).toHaveAttribute("data-thinking","true");
  expect(await input.evaluate(el=>parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16);
  await page.evaluate(()=>{Object.defineProperty(visualViewport,"height",{configurable:true,get:()=>490});visualViewport.dispatchEvent(new Event("resize"));});
  await expect(page.locator(".general-chat")).toHaveAttribute("data-keyboard","true");const box=await input.boundingBox();expect(box.y+box.height).toBeLessThanOrEqual(490);
  for(let i=0;i<12;i++){await input.fill("Вопрос "+i);await input.press("Enter");}
  expect(await page.evaluate(()=>scrollY)).toBe(0);expect(await page.locator(".general-chat-log").evaluate(el=>el.scrollHeight>el.clientHeight)).toBe(true);
  await page.screenshot({path:"tmp/rakurs-v13/chat-keyboard.png"});
  await route("/subscription");
  for(const [width,height] of [[320,568],[390,844],[430,932],[768,1024],[1440,1000]]){
    await page.setViewportSize({width,height});
    for(const path of ["/subscription","/chat","/profile","/"]){await route(path);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);}
  }
  expect(errors).toEqual([]);
  console.log("PASS: Rakurs brand, concentric navigation, exact bundle/unit prices and purchase persistence, nested roulette/rewards without remount, coupon expiry/consumption, stable visual viewport keyboard, reactive moving chat with isolated scrolling, 20 responsive layouts.");
} finally {await browser.close();}

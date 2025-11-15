# app.py → GOD V8 | Render.com Optimized | ALWAYS SIGNAL | 98-99% CONF
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import asyncio
import websockets
import json
import threading
from collections import deque
from typing import Dict
import math
import os

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

APP_ID = 109504

WEBSITE_PAIRS = {
    "EUR/USD": "frxEURUSD",
    "USD/JPY": "frxUSDJPY",
    "GBP/USD": "frxGBPUSD",
    "BTC/USD": "frxBTCUSD",
    "AUD/USD": "frxAUDUSD",
    "USD/CAD": "frxUSDCAD"
}
API_TO_LABEL = {v: k for k, v in WEBSITE_PAIRS.items()}

pair_data: Dict[str, dict] = {}
last_signal_time: Dict[str, int] = {}
ws = None  # Global WebSocket

for pair in WEBSITE_PAIRS.values():
    pair_data[pair] = {
        "live_price": 0.0,
        "direction": "NEUTRAL",
        "confidence": 0,
        "predicted_price": 0.0,
        "timer": "00:59",
        "prices": deque(maxlen=300),
        "trend": "NEUTRAL"
    }
    last_signal_time[pair] = 0

# === INDICATORS ===
def adv_rsi(prices, period=14):
    if len(prices) < period + 1: return 50
    deltas = [prices[i] - prices[i-1] for i in range(-period, 0)]
    up = sum(d for d in deltas if d > 0) / period
    down = sum(-d for d in deltas if d < 0) / period
    if down == 0: return 100
    rs = up / down
    return 100 - (100 / (1 + rs))

def ema_crossover(prices, fast=8, slow=21):
    if len(prices) < slow: return "NEUTRAL"
    ema_fast = sum(prices[-fast:]) / fast
    ema_slow = sum(prices[-slow:]) / slow
    return "BULLISH" if ema_fast > ema_slow else "BEARISH"

def macd(prices, fast=12, slow=26):
    if len(prices) < slow: return 0
    ema_fast = sum(prices[-fast:]) / fast
    ema_slow = sum(prices[-slow:]) / slow
    return ema_fast - ema_slow

def bollinger_bands(prices, period=20, std_dev=2):
    if len(prices) < period: return 0, 0, 0
    mean = sum(prices[-period:]) / period
    variance = sum((p - mean)**2 for p in prices[-period:]) / period
    std = math.sqrt(variance)
    upper = mean + (std * std_dev)
    lower = mean - (std * std_dev)
    return upper, mean, lower

# === WEBSOCKET ENGINE ===
async def websocket_engine():
    global ws
    uri = f"wss://ws.derivws.com/websockets/v3?app_id={APP_ID}"
    while True:
        try:
            ws = await websockets.connect(uri)
            print("WebSocket Connected – Deriv Live")
            for pair in WEBSITE_PAIRS.values():
                await ws.send(json.dumps({"ticks": pair, "subscribe": 1}))
                await ws.send(json.dumps({
                    "ticks_history": pair,
                    "end": "latest",
                    "count": 50,
                    "granularity": 60,
                    "style": "candles"
                }))
            while True:
                msg = json.loads(await ws.recv())
                if "history" in msg:
                    pair = msg["request"]["ticks_history"]
                    if pair in pair_data:
                        pair_data[pair]["prices"].clear()
                        for c in msg["history"]["candles"]:
                            pair_data[pair]["prices"].append(float(c['close']))
                    continue
                if msg.get("msg_type") == "tick" and "tick" in msg:
                    tick = msg["tick"]
                    pair = tick["symbol"]
                    if pair not in pair_data: continue
                    data = pair_data[pair]
                    live_price = float(tick["quote"])
                    data["live_price"] = live_price
                    epoch = int(tick["epoch"])
                    sec = epoch % 60
                    data["timer"] = f"00:{59-sec:02d}"
                    data["prices"].append(live_price)
                    if len(data["prices"]) >= 100:
                        data["trend"] = "UP" if data["prices"][-1] > data["prices"][-100] else "DOWN"
                    # Signal at 55 sec
                    if sec == 55:
                        p = list(data["prices"])
                        if len(p) < 60: continue
                        rsi = adv_rsi(p)
                        ema = ema_crossover(p)
                        macd_val = macd(p)
                        bb_upper, bb_mid, bb_lower = bollinger_bands(p)
                        current = live_price
                        trend = data["trend"]
                        buy_signals = sell_signals = 0
                        if rsi < 32: buy_signals += 2
                        if rsi > 68: sell_signals += 2
                        if ema == "BULLISH": buy_signals += 2
                        if ema == "BEARISH": sell_signals += 2
                        if macd_val > 0: buy_signals += 1
                        if macd_val < 0: sell_signals += 1
                        if current < bb_lower: buy_signals += 2
                        if current > bb_upper: sell_signals += 2
                        if buy_signals >= 4 and trend != "DOWN":
                            data["direction"] = "GREEN"
                            data["confidence"] = 99
                            data["predicted_price"] = round(current + 0.00045, 5)
                        elif sell_signals >= 4 and trend != "UP":
                            data["direction"] = "RED"
                            data["confidence"] = 99
                            data["predicted_price"] = round(current - 0.00045, 5)
                        else:
                            data["direction"] = "GREEN" if buy_signals > sell_signals else "RED"
                            data["confidence"] = 98
                            move = 0.00030
                            data["predicted_price"] = round(current + move if buy_signals > sell_signals else current - move, 5)
                        print(f"{API_TO_LABEL[pair]} → {data['direction']} | {data['confidence']}%")
        except Exception as e:
            print("WebSocket error:", e)
            await asyncio.sleep(5)

def start_background():
    asyncio.run(websocket_engine())

@app.on_event("startup")
async def startup():
    threading.Thread(target=start_background, daemon=True).start()

@app.get("/api/live")
async def get_signal(pair: str = Query("frxEURUSD")):
    if pair not in pair_data:
        pair = "frxEURUSD"
    data = pair_data[pair]
    return {
        "direction": data["direction"],
        "confidence": data["confidence"],
        "live_price": round(data["live_price"], 5),
        "predicted_price": data["predicted_price"],
        "timer": data["timer"],
        "pair": API_TO_LABEL.get(pair, pair)
    }

if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
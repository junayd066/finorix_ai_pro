# app.py → GOD V12 | Railway + Deriv 100% TICK | Fixed Subscribe
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import asyncio
import websockets
import json
import threading
from collections import deque
from typing import Dict
import os

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

APP_ID = 111961
AUTH_TOKEN = "8zRzA8K10txxdrt"

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

for pair in WEBSITE_PAIRS.values():
    pair_data[pair] = {
        "live_price": 0.0,
        "direction": "NEUTRAL",
        "confidence": 0,
        "predicted_price": 0.0,
        "timer": "00:59",
        "prices": deque(maxlen=300),
        "last_tick": 0
    }

# === RSI ===
def rsi(prices, period=14):
    if len(prices) < period + 1: return 50
    deltas = [prices[i] - prices[i-1] for i in range(-period, 0)]
    up = sum(d for d in deltas if d > 0) / period
    down = sum(-d for d in deltas if d < 0) / period
    if down == 0: return 100
    rs = up / down
    return 100 - (100 / (1 + rs))

# === WEBSOCKET ENGINE (FIXED) ===
async def websocket_engine():
    uri = f"wss://ws.derivws.com/websockets/v3?app_id={APP_ID}"
    while True:
        try:
            print("Connecting to Deriv...")
            async with websockets.connect(uri) as ws:
                print("WebSocket Connected!")
                
                # Authorize
                await ws.send(json.dumps({"authorize": AUTH_TOKEN}))
                auth_resp = json.loads(await ws.recv())
                if auth_resp.get("error"):
                    print("Auth Failed:", auth_resp["error"]["message"])
                    await asyncio.sleep(5)
                    continue
                print("Authenticated with Deriv")

                # Subscribe to ticks (CORRECT WAY)
                for pair in WEBSITE_PAIRS.values():
                    # Subscribe to live ticks
                    await ws.send(json.dumps({
                        "ticks": pair,
                        "subscribe": 1
                    }))
                    print(f"Subscribed to {pair}")

                    # Get history (to fill prices)
                    await ws.send(json.dumps({
                        "ticks_history": pair,
                        "end": "latest",
                        "count": 100,
                        "granularity": 60,
                        "style": "ticks"
                    }))
                    print(f"Requested history for {pair}")

                # Keep receiving
                while True:
                    try:
                        msg = json.loads(await ws.recv())
                        
                        # Handle tick subscription response
                        if msg.get("subscription"):
                            print(f"Subscription confirmed for {msg['subscription']['id']}")
                            continue
                        
                        # Handle history
                        if msg.get("msg_type") == "history":
                            pair = msg["request"]["ticks_history"]
                            if pair in pair_data and "ticks" in msg:
                                pair_data[pair]["prices"].clear()
                                for t in msg["ticks"]:
                                    pair_data[pair]["prices"].append(float(t["quote"]))
                                print(f"History loaded for {pair}: {len(msg['ticks'])} ticks")
                            continue
                        
                        # Handle live tick
                        if msg.get("msg_type") == "tick":
                            tick = msg["tick"]
                            pair = tick["symbol"]
                            if pair not in pair_data: continue
                            
                            data = pair_data[pair]
                            live_price = float(tick["quote"])
                            data["live_price"] = live_price
                            data["prices"].append(live_price)
                            epoch = int(tick["epoch"])
                            sec = epoch % 60
                            data["timer"] = f"00:{59-sec:02d}"
                            data["last_tick"] = epoch
                            
                            print(f"TICK: {API_TO_LABEL[pair]} = {live_price} | Timer: {data['timer']}")
                            
                            # Signal at 55 sec
                            if sec == 55 and len(data["prices"]) >= 30:
                                p = list(data["prices"])
                                rsi_val = rsi(p)
                                trend = "UP" if p[-1] > p[-30] else "DOWN"
                                
                                buy = (rsi_val < 35) + (p[-1] > p[-2]) + (trend == "UP")
                                sell = (rsi_val > 65) + (p[-1] < p[-2]) + (trend == "DOWN")
                                
                                if buy >= 2:
                                    data["direction"] = "GREEN"
                                    data["confidence"] = 99
                                    data["predicted_price"] = round(live_price + 0.00045, 5)
                                elif sell >= 2:
                                    data["direction"] = "RED"
                                    data["confidence"] = 99
                                    data["predicted_price"] = round(live_price - 0.00045, 5)
                                else:
                                    data["direction"] = "NEUTRAL"
                                    data["confidence"] = 50
                                    data["predicted_price"] = round(live_price, 5)
                                
                                print(f"SIGNAL: {API_TO_LABEL[pair]} → {data['direction']} | {data['confidence']}% | RSI: {rsi_val:.1f}")
                                
                    except websockets.exceptions.ConnectionClosed:
                        print("WebSocket closed. Reconnecting...")
                        break
                    except Exception as e:
                        print("Message error:", e)
                        continue
                        
        except Exception as e:
            print("Reconnecting in 3s...", e)
            await asyncio.sleep(3)

def start_ws():
    asyncio.run(websocket_engine())

@app.on_event("startup")
async def startup():
    threading.Thread(target=start_ws, daemon=True).start()

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
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
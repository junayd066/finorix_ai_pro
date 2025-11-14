import { TradingSignal } from "@/types";
import { ArrowUp, ArrowDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface SignalCardProps {
  signal: TradingSignal;
  className?: string;
}

const SignalCard = ({ signal, className }: SignalCardProps) => {
  const isGreen = signal.direction === "GREEN";
  const priceDiff = signal.predicted_price - signal.live_price;
  const priceChange = ((priceDiff / signal.live_price) * 100).toFixed(2);

  return (
    <div
      className={cn(
        "glass-panel rounded-2xl p-8 relative overflow-hidden transition-all duration-300 hover:scale-[1.02]",
        isGreen ? "glow-green" : "glow-red",
        className
      )}
    >
      {/* Gradient overlay */}
      <div
        className={cn(
          "absolute inset-0 opacity-10 pointer-events-none",
          isGreen ? "bg-gradient-to-br from-success to-transparent" : "bg-gradient-to-br from-destructive to-transparent"
        )}
      />

      {/* Content */}
      <div className="relative z-10">
        {/* Direction Badge */}
        <div className="flex items-center justify-between mb-6">
          <div
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm",
              isGreen
                ? "bg-success/20 text-success border border-success/30"
                : "bg-destructive/20 text-destructive border border-destructive/30"
            )}
          >
            {isGreen ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
            {signal.direction === "GREEN" ? "BUY SIGNAL" : "SELL SIGNAL"}
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">LIVE</span>
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          </div>
        </div>

        {/* Confidence */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Confidence</span>
            <span className="text-2xl font-bold text-foreground">{signal.confidence}%</span>
          </div>
          <div className="w-full h-2 bg-secondary/50 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                isGreen ? "bg-success" : "bg-destructive"
              )}
              style={{ width: `${signal.confidence}%` }}
            />
          </div>
        </div>

        {/* Prices */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="glass-panel rounded-xl p-4">
            <div className="text-xs text-muted-foreground mb-1">Current Price</div>
            <div className="text-xl font-bold">${signal.live_price.toFixed(5)}</div>
          </div>
          <div className="glass-panel rounded-xl p-4">
            <div className="text-xs text-muted-foreground mb-1">Predicted Price</div>
            <div className="text-xl font-bold">${signal.predicted_price.toFixed(5)}</div>
          </div>
        </div>

        {/* Price Change */}
        <div className="flex items-center justify-between mb-6 p-4 glass-panel rounded-xl">
          <span className="text-sm text-muted-foreground">Expected Change</span>
          <div className="flex items-center gap-2">
            {isGreen ? (
              <ArrowUp className="w-5 h-5 text-success" />
            ) : (
              <ArrowDown className="w-5 h-5 text-destructive" />
            )}
            <span
              className={cn("text-lg font-bold", isGreen ? "text-success" : "text-destructive")}
            >
              {priceChange}%
            </span>
          </div>
        </div>

        {/* Timer */}
        <div className="text-center">
          <div className="text-sm text-muted-foreground mb-2">Next Update In</div>
          <div className="text-4xl font-bold text-primary font-mono tracking-wider animate-pulse-slow">
            {signal.timer}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignalCard;

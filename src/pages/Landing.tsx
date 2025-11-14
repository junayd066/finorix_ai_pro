import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TradingSignal } from "@/types";
import { fetchTradingSignal } from "@/lib/api";
import SignalCard from "@/components/SignalCard";
import ParticlesBackground from "@/components/ParticlesBackground";
import { Button } from "@/components/ui/button";
import { BarChart3, Shield, Zap } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();
  const [signal, setSignal] = useState<TradingSignal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSignal = async () => {
      setLoading(true);
      const data = await fetchTradingSignal();
      setSignal(data);
      setLoading(false);
    };

    loadSignal();
    const interval = setInterval(loadSignal, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <ParticlesBackground />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Header */}
        <header className="mb-16 text-center">
          <div className="inline-block mb-6">
            <div className="glass-panel glow-cyan rounded-2xl px-6 py-3 inline-flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-primary" />
              <span className="text-2xl font-bold bg-gradient-neon bg-clip-text text-transparent">
                TradingSignals Pro
              </span>
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            AI-Powered Trading
            <br />
            <span className="bg-gradient-neon bg-clip-text text-transparent">
              Signals in Real-Time
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get instant market insights with our advanced AI algorithm. High confidence predictions
            updated every second.
          </p>
        </header>

        {/* Live Demo Signal */}
        <div className="max-w-2xl mx-auto mb-16">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">Live Signal Demo</h2>
            <p className="text-muted-foreground">Real-time data from our trading AI</p>
          </div>

          {loading ? (
            <div className="glass-panel rounded-2xl p-12 text-center">
              <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-muted-foreground">Loading live signal...</p>
            </div>
          ) : signal ? (
            <SignalCard signal={signal} />
          ) : null}
        </div>

        {/* CTA */}
        <div className="text-center mb-16">
          <Button
            size="lg"
            onClick={() => navigate("/login")}
            className="bg-gradient-neon hover:opacity-90 text-lg px-8 py-6 h-auto font-semibold glow-cyan"
          >
            Login to Dashboard
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            Already have an account? Login to access full features
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div className="glass-panel rounded-2xl p-6 text-center hover:scale-105 transition-transform">
            <div className="w-12 h-12 bg-gradient-neon rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-primary-foreground" />
            </div>
            <h3 className="font-bold text-lg mb-2">Real-Time Updates</h3>
            <p className="text-sm text-muted-foreground">
              Signals refresh every 10 seconds with live market data
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-6 text-center hover:scale-105 transition-transform">
            <div className="w-12 h-12 bg-gradient-neon rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-6 h-6 text-primary-foreground" />
            </div>
            <h3 className="font-bold text-lg mb-2">High Confidence</h3>
            <p className="text-sm text-muted-foreground">
              AI predictions with 70-100% confidence ratings
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-6 text-center hover:scale-105 transition-transform">
            <div className="w-12 h-12 bg-gradient-neon rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
            <h3 className="font-bold text-lg mb-2">Device Locked</h3>
            <p className="text-sm text-muted-foreground">
              Your account is secured to your device for maximum protection
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;

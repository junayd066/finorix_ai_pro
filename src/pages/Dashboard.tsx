import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { TradingSignal } from '@/types';
import { fetchTradingSignal } from '@/lib/api';
import { getSession, logout, getUserById } from '@/lib/auth';
import SignalCard from '@/components/SignalCard';
import ParticlesBackground from '@/components/ParticlesBackground';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart3,
  LogOut,
  Shield,
  Calendar,
  AlertTriangle,
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const [signal, setSignal] = useState<TradingSignal | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const session = getSession();
  const user = session ? getUserById(session.userId) : null;
  const countdownInterval = useRef<NodeJS.Timeout | null>(null);
  const [prevSignal, setPrevSignal] = useState<TradingSignal | null>(null);

  // এখানে ডিফল্ট পেয়ার
  const [currentPair, setCurrentPair] = useState('frxUSDJPY'); // EUR/USD না!

  const availablePairs = [
    { value: 'frxEURUSD', label: 'EUR/USD' },
    { value: 'frxUSDJPY', label: 'USD/JPY' },
    { value: 'frxGBPUSD', label: 'GBP/USD' },
    { value: 'frxBTCUSD', label: 'BTC/USD' },
    { value: 'frxAUDUSD', label: 'AUD/USD' },
    { value: 'frxUSDCAD', label: 'USD/CAD' },
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const loadSignal = async () => {
      setIsLoading(true);
      console.log('Loading signal for:', currentPair); // ডিবাগ

      const data = await fetchTradingSignal(currentPair);

      if (data) {
        if (signal) setPrevSignal(signal);
        setSignal(data);

        const [m, s] = data.timer.split(':').map(Number);
        const total = m * 60 + s;
        setCountdown(total);

        if (countdownInterval.current) clearInterval(countdownInterval.current);
        countdownInterval.current = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(countdownInterval.current!);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setSignal(null);
        setPrevSignal(null);
        setCountdown(0);
      }
      setIsLoading(false);
    };

    loadSignal();
    interval = setInterval(loadSignal, 3000);

    return () => {
      clearInterval(interval);
      if (countdownInterval.current) clearInterval(countdownInterval.current);
    };
  }, [currentPair]); // currentPair চেঞ্জ হলে রিলোড

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const daysRemaining = () => {
    if (!user?.expiresAt) return null;
    const diff = new Date(user.expiresAt).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <ParticlesBackground />

      <header className="relative z-10 border-b border-border/50 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="glass-panel glow-cyan rounded-xl px-4 py-2 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <span className="font-bold bg-gradient-neon bg-clip-text text-transparent">
                Finorix AI Pro
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-sm">
              <span className="text-muted-foreground">Welcome, </span>
              <span className="font-semibold text-foreground">
                {session?.username}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="glass-panel"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="relative z-10 container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto mb-8">
          <div className="glass-panel rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-primary" />
              <div>
                <div className="text-sm font-medium">Subscription Status</div>
                <div className="text-xs text-muted-foreground">
                  {user?.validity === 'lifetime' ? (
                    <span className="text-success">Lifetime Access</span>
                  ) : daysRemaining() !== null ? (
                    daysRemaining()! > 3 ? (
                      <span className="text-success">
                        Valid for {daysRemaining()} days
                      </span>
                    ) : (
                      <span className="text-destructive">
                        Expires in {daysRemaining()} days
                      </span>
                    )
                  ) : (
                    'Unknown'
                  )}
                </div>
              </div>
            </div>
            {user?.expiresAt && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="w-4 h-4" />
                {new Date(user.expiresAt).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        {/* Market Selector */}
        <div className="max-w-2xl mx-auto mb-6">
          <Select value={currentPair} onValueChange={setCurrentPair}>
            <SelectTrigger className="glass-panel">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availablePairs.map(pair => (
                <SelectItem key={pair.value} value={pair.value}>
                  {pair.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold mb-2">Live Trading Signal</h1>
            <p className="text-muted-foreground">
              Background refresh every 3 seconds • No Flicker • 5 Seconds Early
            </p>
          </div>

          <div className="relative">
            {isLoading && !signal && (
              <div className="glass-panel rounded-2xl p-12 text-center">
                <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-muted-foreground">
                  Loading {currentPair}...
                </p>
              </div>
            )}

            {signal && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <SignalCard
                  signal={{ ...signal, timer: formatTime(countdown) }}
                />
              </div>
            )}

            {!isLoading && !signal && (
              <div className="glass-panel rounded-2xl p-12 text-center bg-red-900/30 border border-red-500/50">
                <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <p className="text-2xl font-bold text-red-400">
                  SERVER OFFLINE
                </p>
                <p className="text-muted-foreground mt-2">
                  Signal will appear when server is back
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="max-w-2xl mx-auto mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            100% Real Deriv Data • Made in Bangladesh • Zero Flicker Update
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

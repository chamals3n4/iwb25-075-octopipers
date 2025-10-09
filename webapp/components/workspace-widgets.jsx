"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Cloud, MapPin, ArrowLeftRight } from "lucide-react";

import {
  fetchLatestNews,
  fetchWeather,
  fetchCurrencyConversion,
} from "@/lib/tools";
import { useSession } from "next-auth/react";

export function WorkspaceWidgets() {
  const browserTimeZone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const { data: session } = useSession();
  //console.log("Session:", session);
  //console.log("Access token:", session?.access_token);
  const [fromTimeZone, setFromTimeZone] = useState(browserTimeZone);
  const [toTimeZone, setToTimeZone] = useState("UTC");
  const [now, setNow] = useState(new Date());

  const [newsData, setNewsData] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState(null);

  // Currency conversion state
  const [currencyData, setCurrencyData] = useState(null);
  const [currencyLoading, setCurrencyLoading] = useState(false);
  const [currencyError, setCurrencyError] = useState(null);
  const [fromAmount, setFromAmount] = useState("1");
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("LKR");
  const [toAmount, setToAmount] = useState("");

  const kelvinToCelsius = (kelvin) => Math.round(kelvin - 273.15);
  const getWeatherIcon = (main) => {
    switch (main?.toLowerCase()) {
      case "clouds":
        return Cloud;
      case "clear":
        return Cloud; //later
      case "rain":
        return Cloud;
      default:
        return Cloud;
    }
  };

  // --- Time zone utilities ---
  const commonTimeZones = [
    "UTC",
    "Asia/Colombo",
    "Asia/Kolkata",
    "Asia/Bangkok",
    "Asia/Jakarta",
    "Asia/Singapore",
    "Asia/Dubai",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "America/New_York",
    "America/Chicago",
    "America/Los_Angeles",
    "America/Toronto",
    "America/Sao_Paulo",
    "Africa/Johannesburg",
    "Asia/Tokyo",
    "Australia/Sydney",
    "Pacific/Auckland",
  ];

  const formatInTimeZone = (date, timeZone, options) => {
    return new Intl.DateTimeFormat("en-US", { timeZone, ...options }).format(
      date
    );
  };

  const getPartsInTimeZone = (date, timeZone) => {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).formatToParts(date);
    const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
    return map;
  };

  const getOffsetMinutes = (date, timeZone) => {
    const p = getPartsInTimeZone(date, timeZone);
    const asUTC = Date.UTC(
      Number(p.year),
      Number(p.month) - 1,
      Number(p.day),
      Number(p.hour),
      Number(p.minute),
      Number(p.second)
    );
    const diffMs = asUTC - date.getTime();
    return Math.round(diffMs / 60000);
  };

  const humanOffset = (date, timeZone) => {
    const mins = getOffsetMinutes(date, timeZone);
    const sign = mins >= 0 ? "+" : "-";
    const abs = Math.abs(mins);
    const h = String(Math.floor(abs / 60)).padStart(2, "0");
    const m = String(abs % 60).padStart(2, "0");
    return `UTC${sign}${h}${m !== "00" ? ":" + m : ""}`;
  };

  const zoneDisplayName = (timeZone) => {
    const city = timeZone.includes("/")
      ? timeZone.split("/").pop().replaceAll("_", " ")
      : timeZone;
    return city;
  };

  const ymdInZone = (date, timeZone) => {
    const p = getPartsInTimeZone(date, timeZone);
    return `${p.year}-${p.month}-${p.day}`;
  };

  const dayRelation = (date, fromZone, toZone) => {
    const a = ymdInZone(date, fromZone);
    const b = ymdInZone(date, toZone);
    if (a === b) return "Same day";
    // Compare as dates
    const ad = new Date(`${a}T00:00:00Z`);
    const bd = new Date(`${b}T00:00:00Z`);
    const diffDays = Math.round((bd.getTime() - ad.getTime()) / 86400000);
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";
    return diffDays > 1
      ? `${diffDays} days ahead`
      : `${Math.abs(diffDays)} days behind`;
  };

  // Currency conversion function
  const convertCurrency = async (amount, base, target) => {
    if (!amount || parseFloat(amount) <= 0) {
      setToAmount("");
      setCurrencyData(null);
      return;
    }

    try {
      setCurrencyLoading(true);
      setCurrencyError(null);
      const result = await fetchCurrencyConversion(
        parseFloat(amount),
        base,
        target,
        session
      );

      if (result.success && result.data) {
        setCurrencyData(result.data);
        setToAmount(result.data.result.toFixed(2));
      } else {
        setCurrencyError(result.message || "Conversion failed");
        setToAmount("");
      }
    } catch (error) {
      console.error("Failed to convert currency:", error);
      setCurrencyError("Unable to fetch currency conversion. Using fallback rate.");
      // Fallback to a default conversion rate
      try {
        const fallbackRate = base === "USD" && target === "LKR" ? 300.37 : 1;
        const convertedAmount = (parseFloat(amount) * fallbackRate).toFixed(2);
        setToAmount(convertedAmount);
        setCurrencyData({
          base,
          target,
          rate: fallbackRate,
          result: parseFloat(convertedAmount),
          timestamp: new Date().toISOString()
        });
      } catch (fallbackError) {
        setToAmount("");
        setCurrencyData(null);
      }
    } finally {
      setCurrencyLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      const loadNews = async () => {
        try {
          setNewsLoading(true);
          setNewsError(null);
          const news = await fetchLatestNews();
          setNewsData(news);
        } catch (error) {
          console.error("Failed to fetch news:", error);
          setNewsError("Failed to load latest news");
          // Fallback to static data if fetch fails
          setNewsData([
            {
              title: "Unable to load latest news",
              src: "System",
              time: "Now",
              excerpt: "Please check your connection and try again.",
              link: "#",
            },
          ]);
        } finally {
          setNewsLoading(false);
        }
      };

      const loadWeather = async () => {
        try {
          setWeatherLoading(true);
          setWeatherError(null);
          const weather = await fetchWeather(session);
          setWeatherData(weather);
        } catch (error) {
          console.error("Failed to fetch weather:", error);
          setWeatherError("Failed to load weather data");
          setWeatherData(null);
        } finally {
          setWeatherLoading(false);
        }
      };

      await Promise.all([loadNews(), loadWeather()]);
    };

    loadData();
  }, []);

  // Initial currency conversion
  useEffect(() => {
    convertCurrency(fromAmount, fromCurrency, toCurrency);
  }, []);

  // Currency conversion when inputs change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      convertCurrency(fromAmount, fromCurrency, toCurrency);
    }, 500); // Debounce for 500ms

    return () => clearTimeout(timeoutId);
  }, [fromAmount, fromCurrency, toCurrency]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="px-8 pb-8 bg-background">
      <div className="max-w-7xl mx-auto grid grid-cols-1 gap-4 md:gap-6 md:grid-cols-2 xl:grid-cols-12">
        {/* Currency converter */}
        <Card className="rounded-2xl md:col-span-2 xl:col-span-6 shadow-none h-[280px] overflow-hidden">
          <CardHeader className="pb-2">
            <CardDescription>
              {currencyData
                ? `1 ${currencyData.base} equals`
                : "1 United States Dollar equals"}
            </CardDescription>
            <CardTitle className="text-2xl md:text-3xl">
              {currencyLoading
                ? "Loading..."
                : currencyData
                ? `${currencyData.rate.toFixed(2)} ${currencyData.target}`
                : "300.37 Sri Lankan Rupee"}
            </CardTitle>
            <CardDescription>
              {currencyData
                ? `${new Date(currencyData.timestamp).toLocaleString()} · From `
                : "Using fallback rate · From "}
              <a href="https://hexarate.paikama.co/" target="_blank">
                HexaRate
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {currencyError && (
              <div className="text-center text-yellow-600 text-sm">
                {currencyError}
              </div>
            )}
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-5">
                <Input
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  className="h-11 !text-lg rounded-xl"
                  placeholder="Amount"
                  type="number"
                  step="0.01"
                  min="0"
                />
              </div>
              <div className="col-span-7">
                <Select value={fromCurrency} onValueChange={setFromCurrency}>
                  <SelectTrigger className="!h-11 w-full rounded-xl">
                    <SelectValue placeholder="Currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">United States Dollar</SelectItem>
                    <SelectItem value="LKR">Sri Lankan Rupee</SelectItem>
                    <SelectItem value="EUR">Euro</SelectItem>
                    <SelectItem value="GBP">British Pound</SelectItem>
                    <SelectItem value="JPY">Japanese Yen</SelectItem>
                    <SelectItem value="AUD">Australian Dollar</SelectItem>
                    <SelectItem value="CAD">Canadian Dollar</SelectItem>
                    <SelectItem value="CHF">Swiss Franc</SelectItem>
                    <SelectItem value="CNY">Chinese Yuan</SelectItem>
                    <SelectItem value="INR">Indian Rupee</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-5">
                <Input
                  value={toAmount}
                  className="h-11 !text-lg rounded-xl"
                  placeholder="Result"
                  readOnly
                  disabled={currencyLoading}
                />
              </div>
              <div className="col-span-7">
                <Select value={toCurrency} onValueChange={setToCurrency}>
                  <SelectTrigger className="!h-11 w-full rounded-xl">
                    <SelectValue placeholder="Currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">United States Dollar</SelectItem>
                    <SelectItem value="LKR">Sri Lankan Rupee</SelectItem>
                    <SelectItem value="EUR">Euro</SelectItem>
                    <SelectItem value="GBP">British Pound</SelectItem>
                    <SelectItem value="JPY">Japanese Yen</SelectItem>
                    <SelectItem value="AUD">Australian Dollar</SelectItem>
                    <SelectItem value="CAD">Canadian Dollar</SelectItem>
                    <SelectItem value="CHF">Swiss Franc</SelectItem>
                    <SelectItem value="CNY">Chinese Yuan</SelectItem>
                    <SelectItem value="INR">Indian Rupee</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weather card (enhanced UX) */}
        <Card className="relative md:col-span-1 xl:col-span-3 h-[280px] overflow-hidden rounded-2xl border-0 shadow-none p-0 text-white">
          {/* layered gradients for depth */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#4e6b8a] via-[#6f86a6] to-[#a9abb0]" />
          <div className="absolute -top-10 -right-10 size-40 rounded-full bg-white/10 blur-2xl" />
          <div className="relative h-full w-full p-5 flex flex-col">
            {weatherLoading && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-white/80">Loading weather...</div>
              </div>
            )}
            {weatherError && !weatherLoading && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-white/80 text-center">
                  <div className="text-sm">{weatherError}</div>
                </div>
              </div>
            )}
            {!weatherLoading &&
              weatherData &&
              weatherData.success &&
              weatherData.data && (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-4xl md:text-5xl font-semibold leading-none tracking-tight">
                        {kelvinToCelsius(weatherData.data.temperature)}°C
                      </div>
                      <div className="mt-2 inline-flex items-center rounded-full bg-white/15 px-2.5 py-1 text-xs md:text-sm backdrop-blur capitalize">
                        {weatherData.data.description}
                      </div>
                    </div>
                    {(() => {
                      const WeatherIcon = getWeatherIcon(weatherData.data.main);
                      return (
                        <WeatherIcon className="size-12 md:size-14 text-white/95" />
                      );
                    })()}
                  </div>
                  <div className="mt-auto flex items-center gap-2 text-sm md:text-base font-medium text-white/95">
                    <MapPin className="size-4 md:size-5 text-white/95" />
                    {weatherData.data.location}
                  </div>
                  <div className="text-[10px] md:text-xs text-white/70">
                    Updated{" "}
                    {new Date().toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </>
              )}
          </div>
        </Card>

        {/* Emergency contacts (replaces Visa Stay Calculator) */}
        <Card className="rounded-2xl md:col-span-1 xl:col-span-3 h-[280px] shadow-none overflow-hidden">
          <CardHeader className="pb-0 pt-1 gap-0">
            <CardTitle className="text-lg">Emergency Contacts</CardTitle>
          </CardHeader>
          <CardContent className="w-full h-full -mt-1 flex flex-col gap-1 text-sm">
            <div className="grid grid-cols-1 gap-1.5 flex-1 min-h-0 overflow-y-auto pb-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {[
                {
                  name: "Police Emergency",
                  number: "119",
                },
                {
                  name: "Ambulance / Fire & Rescue",
                  number: "110",
                },
                {
                  name: "Suwa Seriya Ambulance",
                  number: "1990",
                },
                {
                  name: "Tourist Police",
                  number: "1912",
                },
                {
                  name: "Disaster Management",
                  number: "117",
                },
                {
                  name: "Accident Service (Colombo)",
                  number: "011-2691111",
                },
                {
                  name: "Colombo Fire/Ambulance",
                  number: "011-2422222",
                },
              ].map((contact) => (
                <div
                  key={contact.number}
                  className="flex items-center justify-between rounded-lg border px-3 py-2 bg-card"
                >
                  <span className="font-medium text-foreground">
                    {contact.name}
                  </span>
                  <a
                    className="text-primary font-semibold"
                    href={`tel:${contact.number}`}
                  >
                    {contact.number}
                  </a>
                </div>
              ))}
            </div>
            <div className="pt-1 mt-auto text-xs text-muted-foreground">
              Tap a number to dial instantly.
            </div>
          </CardContent>
        </Card>

        {/* Time Zone Converter (replaces SIM comparator) */}
        <Card className="rounded-2xl  md:col-span-1 lg:col-span-2 xl:col-span-4 h-[280px] shadow-none overflow-hidden">
          <CardContent className="space-y-3 h-full flex flex-col">
            <CardTitle className="text-xl font-semibold text-foreground">
              Time Zone Converter
            </CardTitle>

            <div className="mt-1 rounded-xl border bg-muted px-3 py-2">
              <div className="grid grid-cols-12 items-end">
                <div className="col-span-5">
                  <div className="text-xs text-muted-foreground">
                    {zoneDisplayName(fromTimeZone)} ·{" "}
                    {humanOffset(now, fromTimeZone)}
                  </div>
                  <div className="text-xl font-semibold leading-tight">
                    {formatInTimeZone(now, fromTimeZone, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {formatInTimeZone(now, fromTimeZone, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>
                <div className="col-span-2 text-center text-xs uppercase text-muted-foreground">
                  →
                </div>
                <div className="col-span-5 text-right">
                  <div className="text-xs text-muted-foreground">
                    {zoneDisplayName(toTimeZone)} ·{" "}
                    {humanOffset(now, toTimeZone)}
                  </div>
                  <div className="text-xl font-semibold leading-tight">
                    {formatInTimeZone(now, toTimeZone, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {formatInTimeZone(now, toTimeZone, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-5">
                <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                  From
                </Label>
                <Select value={fromTimeZone} onValueChange={setFromTimeZone}>
                  <SelectTrigger className="h-10 w-full rounded-xl border-2 text-sm">
                    <SelectValue placeholder="From time zone" />
                  </SelectTrigger>
                  <SelectContent>
                    {commonTimeZones.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {zoneDisplayName(tz)} ({humanOffset(now, tz)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 flex items-end justify-center pb-0.5">
                <Button
                  variant="secondary"
                  className="h-10 w-10 rounded-xl"
                  onClick={() => {
                    const a = fromTimeZone;
                    const b = toTimeZone;
                    setFromTimeZone(b);
                    setToTimeZone(a);
                  }}
                >
                  <ArrowLeftRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="col-span-5">
                <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                  To
                </Label>
                <Select value={toTimeZone} onValueChange={setToTimeZone}>
                  <SelectTrigger className="h-10 w-full rounded-xl border-2 text-sm">
                    <SelectValue placeholder="To time zone" />
                  </SelectTrigger>
                  <SelectContent>
                    {commonTimeZones.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {zoneDisplayName(tz)} ({humanOffset(now, tz)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-auto grid grid-cols-12 gap-1 text-xs text-muted-foreground">
              <div className="col-span-7">
                {(() => {
                  const offFrom = getOffsetMinutes(now, fromTimeZone);
                  const offTo = getOffsetMinutes(now, toTimeZone);
                  const diffMin = offTo - offFrom;
                  const ahead = diffMin > 0;
                  const abs = Math.abs(diffMin);
                  const h = Math.floor(abs / 60);
                  const m = abs % 60;
                  return (
                    <span>
                      {zoneDisplayName(toTimeZone)} is{" "}
                      {ahead ? "ahead of" : "behind"}{" "}
                      {zoneDisplayName(fromTimeZone)} by {h}h{m ? ` ${m}m` : ""}
                    </span>
                  );
                })()}
              </div>
              <div className="col-span-5 text-right">
                {dayRelation(now, fromTimeZone, toTimeZone)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Simple card to replace calendar */}
        <Card className="rounded-2xl md:col-span-1 lg:col-span-1 shadow-none xl:col-span-3 h-[280px] overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Quick Info</CardTitle>
            <CardDescription>Important updates and reminders</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg bg-muted border p-2">
              <div className="text-xs font-medium text-foreground">
                Today's Date
              </div>
              <div className="text-sm font-semibold text-foreground">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </div>
            </div>
            <div className="rounded-lg bg-muted border p-2">
              <div className="text-xs font-medium text-foreground">
                Local Time
              </div>
              <div className="text-sm font-semibold text-foreground">
                {new Date().toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-none md:col-span-2 lg:col-span-3 xl:col-span-5 h-[280px] overflow-hidden">
          <CardContent className="h-full flex flex-col">
            {newsLoading && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-sm text-muted-foreground">
                  Loading latest news...
                </div>
              </div>
            )}
            {newsError && !newsLoading && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-sm text-red-600">{newsError}</div>
              </div>
            )}

            {!newsLoading && !newsError && (
              <div className="grid grid-cols-1 gap-3 flex-1 min-h-0 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {newsData.map((item, idx) => (
                  <div key={idx} className="rounded-xl border p-3 bg-card">
                    <div className="text-base font-semibold leading-snug line-clamp-2 text-foreground">
                      {item.title}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Newswire.lk · {item.date}
                    </div>
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center text-primary text-sm font-medium hover:underline"
                    >
                      Read More →
                    </a>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

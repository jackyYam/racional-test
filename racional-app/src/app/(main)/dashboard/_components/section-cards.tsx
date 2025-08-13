"use client";

import { TrendingUp, TrendingDown, Coins } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useInvestmentData } from "@/hooks/use-investment-data";
import { useDateRangeUrl } from "@/hooks/use-date-range-url";
import { format } from "date-fns";

export function SectionCards() {
  const { getEffectiveDateRange } = useDateRangeUrl();
  const { metrics, loading, error, updatedAt, filteredDataPoints, totalDataPoints } =
    useInvestmentData(getEffectiveDateRange());
  const latestDate = getEffectiveDateRange()?.to;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number, decimalPlaces = 1) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(decimalPlaces)}%`;
  };

  if (loading) {
    return (
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-2 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs sm:grid-cols-2 md:gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="@container/card">
            <CardHeader>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-6 w-16" />
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1 text-xs md:gap-1.5 md:text-sm">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-32" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-2 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs sm:grid-cols-2 md:gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        <Card className="@container/card col-span-full">
          <CardHeader>
            <CardTitle className="text-red-500">Error Loading Investment Data</CardTitle>
            <CardDescription>{error || "Unable to load investment metrics"}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="text-muted-foreground mb-2 flex items-center justify-between text-sm">
        <span>Last updated: {updatedAt}</span>
        <span>
          Showing {filteredDataPoints} of {totalDataPoints} data points
        </span>
      </div>
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        <Card className="@container/card">
          <CardHeader>
            <CardDescription className="flex items-center gap-1">
              Portfolio Value
              <Badge variant="outline">
                {metrics.totalGainLoss >= 0 ? <TrendingUp /> : <TrendingDown />}
                {formatPercentage(metrics.totalGainLossPercentage)}
              </Badge>
            </CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {formatCurrency(metrics.totalPortfolioValue)}
            </CardTitle>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              {metrics.totalGainLoss >= 0 ? "Portfolio gains" : "Portfolio loss"}
            </div>
            <div className="text-muted-foreground flex items-center gap-1">
              {metrics.totalGainLoss >= 0 ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
              {formatCurrency(Math.abs(metrics.totalGainLoss))} {metrics.totalGainLoss >= 0 ? "gain" : "loss"}
            </div>
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Total Contributions</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {formatCurrency(metrics.totalContributions)}
            </CardTitle>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Capital invested <Coins className="size-4" />
            </div>
            <div className="text-muted-foreground">Total money contributed</div>
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription className="flex items-center gap-1">
              Portfolio Index
              <Badge variant="outline">
                {metrics.portfolioIndex >= 100 ? <TrendingUp /> : <TrendingDown />}
                {metrics.portfolioIndex >= 100 ? "Above" : "Below"} Base
              </Badge>
            </CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {metrics.portfolioIndex.toFixed(2)}
            </CardTitle>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Performance index{" "}
              {metrics.portfolioIndex >= 100 ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
            </div>
            <div className="text-muted-foreground">Base index: 100</div>
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription className="flex items-center gap-1">
              Daily Return
              <Badge variant="outline">
                {metrics.dailyReturn >= 0 ? <TrendingUp /> : <TrendingDown />}
                {metrics.dailyReturn >= 0 ? "Positive" : "Negative"}
              </Badge>
            </CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {formatPercentage(metrics.dailyReturn * 100, 3)}
            </CardTitle>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">Latest daily change</div>
            <div className="text-muted-foreground">on {latestDate ? format(latestDate, "MMM dd, yyyy") : "N/A"}</div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

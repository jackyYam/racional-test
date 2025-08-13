"use client";

import * as React from "react";

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useIsMobile } from "@/hooks/use-mobile";
import { useInvestmentData } from "@/hooks/use-investment-data";
import { useDateRangeUrl } from "@/hooks/use-date-range-url";
import { Skeleton } from "@/components/ui/skeleton";

export const description = "Investment portfolio evolution chart";

const chartConfig = {
  portfolio: {
    label: "Portfolio Value",
  },
  portfolioValue: {
    label: "Portfolio Value",
    color: "oklch(0.546 0.245 262.881)",
  },
  contributions: {
    label: "Contributions",
    color: "var(--chart-2)",
  },
  gains: {
    label: "Gains/Losses",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

export function ChartAreaInteractive() {
  const isMobile = useIsMobile();
  const { getEffectiveDateRange } = useDateRangeUrl();
  const { chartData, loading, error } = useInvestmentData(getEffectiveDateRange());

  if (loading) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Portfolio Evolution</CardTitle>
          <CardDescription className="text-red-500">Error loading data: {error}</CardDescription>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <div className="text-muted-foreground flex h-[250px] items-center justify-center">
            Failed to load investment data
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Portfolio Evolution</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">Investment portfolio value over time</span>
          <span className="@[540px]/card:hidden">Portfolio over time</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="fillPortfolioValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="oklch(0.546 0.245 262.881)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="oklch(0.546 0.245 262.881)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillContributions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-contributions)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-contributions)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
              }}
            />
            <ChartTooltip
              cursor={false}
              defaultIndex={isMobile ? -1 : Math.max(0, chartData.length - 10)}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                  }}
                  formatter={(value, name) => (
                    <div className="flex gap-1">
                      <div className="text-sm font-medium">{name === "portfolioValue" ? "Portfolio Value" : name}</div>
                      <div className="text-muted-foreground text-sm">
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(value as number)}
                      </div>
                    </div>
                  )}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="contributions"
              type="natural"
              fill="url(#fillContributions)"
              stroke="var(--color-contributions)"
              strokeWidth={2}
              stackId="a"
            />
            <Area
              dataKey="portfolioValue"
              type="natural"
              fill="url(#fillPortfolioValue)"
              stroke="oklch(0.546 0.245 262.881)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

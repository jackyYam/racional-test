"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDateRangeUrl } from "@/hooks/use-date-range-url";

export function DayRangePicker() {
  const { fromDate, toDate, setStartDate, setEndDate, datasetBounds } = useDateRangeUrl();

  const formatDate = (date: Date | undefined) => {
    if (!date) return "Select date";
    return format(date, "MMM dd, yyyy");
  };

  const isDateDisabled = (date: Date) => {
    if (!datasetBounds) return true;
    return date < datasetBounds.minDate || date > datasetBounds.maxDate;
  };

  const isEndDateDisabled = (date: Date) => {
    if (isDateDisabled(date)) return true;
    // End date must be after start date
    if (fromDate && date < fromDate) return true;
    return false;
  };

  const isStartDateDisabled = (date: Date) => {
    if (isDateDisabled(date)) return true;
    // Start date must be before end date
    if (toDate && date > toDate) return true;
    return false;
  };

  return (
    <div className="flex items-center gap-2">
      {/* Start Date Picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn("w-[160px] justify-start text-left font-normal", !fromDate && "text-muted-foreground")}
          >
            <CalendarIcon />
            {formatDate(fromDate)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          {datasetBounds && (
            <div className="text-muted-foreground border-b p-3 text-center text-xs">
              Available: {format(datasetBounds.minDate, "MMM dd, yyyy")} -{" "}
              {format(datasetBounds.maxDate, "MMM dd, yyyy")}
            </div>
          )}
          <Calendar
            mode="single"
            selected={fromDate}
            onSelect={setStartDate}
            disabled={isStartDateDisabled}
            defaultMonth={fromDate}
            autoFocus
          />
        </PopoverContent>
      </Popover>

      <span className="text-muted-foreground text-sm">to</span>

      {/* End Date Picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn("w-[160px] justify-start text-left font-normal", !toDate && "text-muted-foreground")}
          >
            <CalendarIcon />
            {formatDate(toDate)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          {datasetBounds && (
            <div className="text-muted-foreground border-b p-3 text-center text-xs">
              Available: {format(datasetBounds.minDate, "MMM dd, yyyy")} -{" "}
              {format(datasetBounds.maxDate, "MMM dd, yyyy")}
            </div>
          )}
          <Calendar
            mode="single"
            selected={toDate}
            onSelect={setEndDate}
            disabled={isEndDateDisabled}
            defaultMonth={toDate}
            autoFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

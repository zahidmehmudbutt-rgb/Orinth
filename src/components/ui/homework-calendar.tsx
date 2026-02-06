import { useState } from "react";
import { ChevronLeft, ChevronRight, BookOpen, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface HomeworkItem {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  status: "pending" | "submitted" | "graded" | "overdue";
}

interface HomeworkCalendarProps {
  homework: HomeworkItem[];
  onSelectDate?: (date: Date) => void;
  onSelectHomework?: (homework: HomeworkItem) => void;
}

export function HomeworkCalendar({ homework, onSelectDate, onSelectHomework }: HomeworkCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startingDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getHomeworkForDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return homework.filter(hw => hw.dueDate.startsWith(dateStr));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted":
      case "graded":
        return "bg-green-500";
      case "overdue":
        return "bg-red-500";
      default:
        return "bg-yellow-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "submitted":
      case "graded":
        return <CheckCircle className="w-3 h-3" />;
      case "overdue":
        return <AlertCircle className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  const handleDateClick = (day: number) => {
    const date = new Date(year, month, day);
    setSelectedDate(date);
    onSelectDate?.(date);
  };

  const renderCalendarDays = () => {
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="p-2" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayHomework = getHomeworkForDate(day);
      const isSelected = selectedDate?.getDate() === day &&
        selectedDate?.getMonth() === month &&
        selectedDate?.getFullYear() === year;

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(day)}
          className={cn(
            "relative p-2 min-h-[60px] sm:min-h-[80px] rounded-lg transition-all text-left hover:bg-muted/50",
            isToday(day) && "bg-primary/10 ring-2 ring-primary/30",
            isSelected && "bg-primary/20 ring-2 ring-primary"
          )}
        >
          <span className={cn(
            "text-sm font-medium",
            isToday(day) && "text-primary font-bold"
          )}>
            {day}
          </span>
          {dayHomework.length > 0 && (
            <div className="mt-1 space-y-0.5">
              {dayHomework.slice(0, 2).map((hw) => (
                <div
                  key={hw.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectHomework?.(hw);
                  }}
                  className={cn(
                    "text-[10px] sm:text-xs px-1.5 py-0.5 rounded truncate flex items-center gap-1 cursor-pointer hover:opacity-80",
                    getStatusColor(hw.status),
                    "text-white"
                  )}
                >
                  {getStatusIcon(hw.status)}
                  <span className="truncate hidden sm:inline">{hw.subject}</span>
                </div>
              ))}
              {dayHomework.length > 2 && (
                <span className="text-[10px] text-muted-foreground">
                  +{dayHomework.length - 2} more
                </span>
              )}
            </div>
          )}
        </button>
      );
    }

    return days;
  };

  const selectedDateHomework = selectedDate
    ? getHomeworkForDate(selectedDate.getDate())
    : [];

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          {monthNames[month]} {year}
        </h3>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-yellow-500" />
          <span className="text-muted-foreground">Pending</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span className="text-muted-foreground">Submitted</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-500" />
          <span className="text-muted-foreground">Overdue</span>
        </div>
      </div>

      {/* Day Names */}
      <div className="grid grid-cols-7 gap-1">
        {dayNames.map((day) => (
          <div
            key={day}
            className="p-2 text-center text-xs font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 border rounded-lg p-2 bg-card">
        {renderCalendarDays()}
      </div>

      {/* Selected Date Homework List */}
      {selectedDate && selectedDateHomework.length > 0 && (
        <div className="border rounded-lg p-4 bg-card space-y-3">
          <h4 className="font-medium text-foreground flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            Homework for {selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </h4>
          <div className="space-y-2">
            {selectedDateHomework.map((hw) => (
              <div
                key={hw.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                onClick={() => onSelectHomework?.(hw)}
              >
                <div>
                  <p className="font-medium text-sm text-foreground">{hw.title}</p>
                  <p className="text-xs text-muted-foreground">{hw.subject}</p>
                </div>
                <Badge
                  className={cn(
                    "text-white",
                    hw.status === "submitted" || hw.status === "graded"
                      ? "bg-green-500"
                      : hw.status === "overdue"
                      ? "bg-red-500"
                      : "bg-yellow-500"
                  )}
                >
                  {hw.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

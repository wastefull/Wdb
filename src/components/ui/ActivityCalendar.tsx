import { useMemo } from "react";

interface ActivityDay {
  date: string; // YYYY-MM-DD
  count: number;
  level: 0 | 1 | 2 | 3 | 4; // GitHub-style levels
}

interface ActivityCalendarProps {
  data: ActivityDay[];
  startDate?: Date;
  endDate?: Date;
}

export function ActivityCalendar({
  data,
  startDate,
  endDate,
}: ActivityCalendarProps) {
  const { weeks, months } = useMemo(() => {
    const end = endDate || new Date();
    const start =
      startDate ||
      new Date(end.getFullYear(), end.getMonth() - 11, end.getDate());

    // Create map of dates to counts
    const dataMap = new Map(data.map((d) => [d.date, d]));

    // Generate weeks array
    const weeks: ActivityDay[][] = [];
    let currentWeek: ActivityDay[] = [];
    let currentDate = new Date(start);

    // Start from Sunday
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0) {
      currentDate.setDate(currentDate.getDate() - dayOfWeek);
    }

    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split("T")[0];
      const dayData = dataMap.get(dateStr);
      const count = dayData?.count || 0;

      currentWeek.push({
        date: dateStr,
        count,
        level: getLevel(count),
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    // Calculate month labels
    const months: Array<{ name: string; offset: number }> = [];
    let lastMonth = -1;

    weeks.forEach((week, weekIndex) => {
      const firstDay = week[0];
      if (!firstDay) return;

      const date = new Date(firstDay.date);
      const month = date.getMonth();

      if (month !== lastMonth) {
        months.push({
          name: date.toLocaleDateString("en-US", { month: "short" }),
          offset: weekIndex,
        });
        lastMonth = month;
      }
    });

    return { weeks, months };
  }, [data, startDate, endDate]);

  return (
    <div className="activity-calendar">
      {/* Month labels */}
      <div className="flex mb-2 text-[10px] text-black/60 dark:text-white/60">
        {months.map((month, i) => (
          <div
            key={i}
            className="shrink-0"
            style={{
              width: `${(month.offset * 100) / weeks.length}%`,
              marginLeft: i === 0 ? "0" : undefined,
            }}
          >
            {month.name}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex gap-0.5 overflow-x-auto pb-2">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-0.5">
            {week.map((day, dayIndex) => (
              <div
                key={day.date}
                className={`
                  w-2.5 h-2.5 rounded-[1px] cursor-pointer
                  transition-all hover:ring-1 hover:ring-black/20 dark:hover:ring-white/20
                  ${getLevelColor(day.level)}
                `}
                title={`${day.count} ${
                  day.count === 1 ? "contribution" : "contributions"
                } on ${new Date(day.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}`}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3 text-[10px] text-black/60 dark:text-white/60">
        <span>Less</span>
        <div className="flex gap-0.5">
          {[0, 1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={`w-2.5 h-2.5 rounded-[1px] ${getLevelColor(
                level as 0 | 1 | 2 | 3 | 4
              )}`}
            />
          ))}
        </div>
        <span>More</span>
      </div>
    </div>
  );
}

function getLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 10) return 3;
  return 4;
}

function getLevelColor(level: 0 | 1 | 2 | 3 | 4): string {
  const colors = {
    0: "bg-[#e5e4dc] dark:bg-[#2a2825] border border-black/10 dark:border-white/10",
    1: "bg-[#9be9a8] dark:bg-[#0e4429]",
    2: "bg-[#40c463] dark:bg-[#006d32]",
    3: "bg-[#30a14e] dark:bg-[#26a641]",
    4: "bg-[#216e39] dark:bg-[#39d353]",
  };
  return colors[level];
}

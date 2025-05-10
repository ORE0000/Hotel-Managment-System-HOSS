import { useQuery } from "@tanstack/react-query";
import { fetchSummaryData } from "../services/ApiService";
import { Summary } from "../types";

const Home: React.FC = () => {
  const { data: summary, error } = useQuery<Summary>({
    queryKey: ["summary"],
    queryFn: fetchSummaryData,
  });

  return (
    <div className="p-6 fade-in max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-gradient">Dashboard</h2>
      {error && (
        <div className="p-4 bg-red-100 text-red-600 rounded-lg mb-4">
          {error.message}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          {
            title: "Total Revenue",
            value: summary?.revenue || 0,
            color: "from-blue-500 to-indigo-600",
            icon: "💹",
          },
          {
            title: "Total Advance",
            value: summary?.advance || 0,
            color: "from-green-500 to-teal-600",
            icon: "💵",
          },
          {
            title: "Total Due",
            value: summary?.due || 0,
            color: "from-yellow-500 to-amber-600",
            icon: "⌛",
          },
          {
            title: "Total Expenses",
            value: summary?.expenses || 0,
            color: "from-red-500 to-pink-600",
            icon: "📉",
          },
        ].map((stat) => (
          <div
            key={stat.title}
            className="overflow-hidden card-hover fade-in glass-card rounded-xl border border-[var(--border-color)] shadow-xl"
          >
            <div className={`bg-gradient-to-r ${stat.color} h-2 w-full`}></div>
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-[var(--text-secondary)]">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">
                    ₹{stat.value.toLocaleString()}
                  </p>
                </div>
                <div className="text-3xl text-[var(--icon-color)]">{stat.icon}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
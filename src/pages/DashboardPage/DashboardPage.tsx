import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  ArcElement,
} from "chart.js";
import { Bar, Line, Pie, Doughnut } from "react-chartjs-2";
import {
  FaChartBar,
  FaChartLine,
  FaPercentage,
  FaMoneyBillWave,
  FaUsers,
} from "react-icons/fa";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  ArcElement
);

// Define the data type for a membership
type Membership = {
  phone: string;
  package_id: number;
  totalOvers: number;
  oversLeft: number;
  validity: string;
  status: string;
  center: string;
  price: number;
  createdAt: string;
  __v?: number;
};

// ✅ Normalize status typos
const normalizeStatus = (status: string): string => {
  if (!status) return "Unknown";
  const s = status.trim().toLowerCase();
  if (s.startsWith("close")) return "Closed";
  if (s.startsWith("run")) return "Running";
  if (s.startsWith("exp")) return "Expired";
  if (s.startsWith("pend")) return "Pending";
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};

// Reusable Dashboard Card component
const DashboardCard: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, icon, children }) => (
  <div className="bg-white p-6 rounded-2xl shadow-xl transition-transform transform hover:scale-102 hover:shadow-2xl flex flex-col">
    <div className="flex items-center gap-3 mb-4">
      <div className="text-xl text-indigo-500">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
    </div>
    <div className="flex-grow flex items-center justify-center">{children}</div>
  </div>
);

// Quick Stats Card component
const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, icon, color }) => (
  <div
    className={`bg-white p-6 rounded-2xl shadow-lg flex items-center justify-between transition-transform transform hover:scale-102`}
  >
    <div className="flex flex-col">
      <span className="text-sm font-medium text-gray-500">{title}</span>
      <span className="text-3xl font-bold text-gray-800 mt-1">{value}</span>
    </div>
    <div className={`text-3xl ${color}`}>{icon}</div>
  </div>
);

// ✅ Utility: Revenue by Month (ensures continuous months)
const getRevenueByMonth = (memberships: Membership[], monthsToShow = 6) => {
  const revenueByMonth: Record<string, number> = {};

  memberships.forEach((m) => {
    const date = new Date(m.createdAt);
    const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}`;
    revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + m.price;
  });

  // 🔥 Generate last N months
  const now = new Date();
  const months: string[] = [];
  for (let i = monthsToShow - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${(d.getMonth() + 1)
      .toString()
      .padStart(2, "0")}`;
    months.push(key);
  }

  return {
    labels: months,
    data: months.map((m) => revenueByMonth[m] || 0),
  };
};

// Utility: Revenue by Center
const getRevenueByCenter = (memberships: Membership[]) => {
  const revenueByCenter = memberships.reduce((acc, item) => {
    acc[item.center] = (acc[item.center] || 0) + Number(item.price);
    return acc;
  }, {} as Record<string, number>);
  return {
    labels: Object.keys(revenueByCenter),
    data: Object.values(revenueByCenter),
  };
};

// ✅ Utility: Active Packages by Center
const getActivePackagesByCenter = (memberships: Membership[]) => {
  const activeCounts = memberships
    .filter((m) => m.status === "Running")
    .reduce((acc, m) => {
      acc[m.center] = (acc[m.center] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  return {
    labels: Object.keys(activeCounts),
    data: Object.values(activeCounts),
  };
};

// Dashboard Component
const DashboardPage: React.FC = () => {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState("all");

  useEffect(() => {
    axios
      .post<Membership[]>("http://localhost:3000/api/get-memberships", {})
      .then((res) => {
        const cleaned = res.data.map((m) => ({
          ...m,
          status: normalizeStatus(m.status),
        }));
        setMemberships(cleaned);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load data. Please try again later.");
        setLoading(false);
      });
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-8">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="ml-4 text-xl font-medium text-gray-600">
          Loading dashboard...
        </p>
      </div>
    );
  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen p-8 bg-gray-50">
        <div className="p-8 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-lg shadow-md">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      </div>
    );

  // ✅ Filter data based on selected date range
  const now = new Date();
  let filteredMemberships = memberships;

  if (dateRange === "month") {
    const last30Days = new Date();
    last30Days.setDate(now.getDate() - 30);
    filteredMemberships = memberships.filter(
      (m) => new Date(m.createdAt) >= last30Days
    );
  } else if (dateRange === "quarter") {
    const last90Days = new Date();
    last90Days.setDate(now.getDate() - 90);
    filteredMemberships = memberships.filter(
      (m) => new Date(m.createdAt) >= last90Days
    );
  }

  // Quick stats
  const totalRevenue = filteredMemberships.reduce(
    (acc, m) => acc + m.price,
    0
  );
  const totalOversPlayed = filteredMemberships.reduce(
    (acc, item) => acc + (item.totalOvers - item.oversLeft),
    0
  );
  const activePackagesCount = filteredMemberships.filter(
    (m) => m.status === "Running"
  ).length;
  const avgUtilization =
    filteredMemberships.length > 0
      ? filteredMemberships.reduce(
          (a, b) => a + (b.totalOvers - b.oversLeft) / b.totalOvers,
          0
        ) / filteredMemberships.length
      : 0;

  // Chart data
  const monthlyRevenueData = getRevenueByMonth(filteredMemberships, 6); // 👈 last 6 months
  const revenueByCenterData = getRevenueByCenter(filteredMemberships);
  const revenueByStatus = filteredMemberships.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + Number(item.price);
    return acc;
  }, {} as Record<string, number>);

  const packageVolumeBuckets: Record<string, number> = {
    "≤50": 0,
    "51-100": 0,
    "101-200": 0,
    "200+": 0,
  };
  filteredMemberships.forEach((m) => {
    if (m.totalOvers <= 50) packageVolumeBuckets["≤50"]++;
    else if (m.totalOvers <= 100) packageVolumeBuckets["51-100"]++;
    else if (m.totalOvers <= 200) packageVolumeBuckets["101-200"]++;
    else packageVolumeBuckets["200+"]++;
  });

  // ✅ Active Packages by Center
  const activePackagesByCenter = getActivePackagesByCenter(filteredMemberships);

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans">
      <header className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            Analytics Dashboard
          </h1>
        </div>
        <p className="text-gray-500">
          A comprehensive overview of your membership data.
        </p>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Revenue"
          value={`Rs. ${totalRevenue.toLocaleString("en-IN")}`}
          icon={<FaMoneyBillWave />}
          color="text-green-500"
        />
        <StatCard
          title="Overs Played"
          value={totalOversPlayed.toLocaleString("en-IN")}
          icon={<FaChartBar />}
          color="text-blue-500"
        />
        <StatCard
          title="Active Packages"
          value={activePackagesCount.toLocaleString()}
          icon={<FaUsers />}
          color="text-purple-500"
        />
        <StatCard
          title="Overs Utilization"
          value="62.52%"
          icon={<FaPercentage />}
          color="text-orange-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Monthly Revenue */}
        <div className="xl:col-span-2">
          <DashboardCard title="Monthly Revenue Growth" icon={<FaChartLine />}>
            <Line
              data={{
                labels: monthlyRevenueData.labels,
                datasets: [
                  {
                    label: "Monthly Revenue",
                    data: monthlyRevenueData.data,
                    borderColor: "rgba(75, 192, 192, 1)",
                    backgroundColor: "rgba(75, 192, 192, 0.2)",
                    tension: 0.4,
                    pointRadius: 5,
                    pointHoverRadius: 8,
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: false },
                  title: { display: false },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    title: { display: true, text: "Revenue (₹)" },
                  },
                },
              }}
            />
          </DashboardCard>
        </div>

        {/* Revenue by Center */}
        <DashboardCard title="Revenue by Center" icon={<FaChartBar />}>
          <Bar
            data={{
              labels: revenueByCenterData.labels,
              datasets: [
                {
                  label: "Revenue",
                  data: revenueByCenterData.data,
                  backgroundColor: [
                    "rgba(54, 162, 235, 0.8)",
                    "rgba(255, 99, 132, 0.8)",
                    "rgba(255, 206, 86, 0.8)",
                    "rgba(75, 192, 192, 0.8)",
                  ],
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: {
                legend: { display: false },
                title: { display: false },
              },
            }}
          />
        </DashboardCard>

        {/* Revenue by Status */}
        <DashboardCard title="Revenue by Status" icon={<FaMoneyBillWave />}>
          <Pie
            data={{
              labels: Object.keys(revenueByStatus),
              datasets: [
                {
                  label: "Revenue",
                  data: Object.values(revenueByStatus),
                  backgroundColor: [
                    "rgba(255, 99, 132, 0.8)",
                    "rgba(54, 162, 235, 0.8)",
                    "rgba(255, 206, 86, 0.8)",
                    "rgba(153, 102, 255, 0.8)",
                  ],
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: {
                legend: { position: "bottom" },
                title: { display: false },
              },
            }}
          />
        </DashboardCard>

        {/* Package Volume Distribution */}
        <DashboardCard title="Package Volume Distribution" icon={<FaChartBar />}>
          <Doughnut
            data={{
              labels: Object.keys(packageVolumeBuckets),
              datasets: [
                {
                  label: "Packages",
                  data: Object.values(packageVolumeBuckets),
                  backgroundColor: [
                    "rgba(255, 206, 86, 0.8)",
                    "rgba(54, 162, 235, 0.8)",
                    "rgba(255, 99, 132, 0.8)",
                    "rgba(75, 192, 192, 0.8)",
                  ],
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: {
                legend: { position: "bottom" },
                title: { display: false },
              },
            }}
          />
        </DashboardCard>

        {/* ✅ Active Packages by Center */}
        <DashboardCard title="Active Packages by Center" icon={<FaUsers />}>
          <Bar
            data={{
              labels: activePackagesByCenter.labels,
              datasets: [
                {
                  label: "Active Packages",
                  data: activePackagesByCenter.data,
                  backgroundColor: "rgba(153, 102, 255, 0.8)",
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: {
                legend: { display: false },
                title: { display: false },
              },
            }}
          />
        </DashboardCard>
      </div>
    </div>
  );
};

export default DashboardPage;

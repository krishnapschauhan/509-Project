import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";

interface Complaint {
  id: number;
  username: string;
  category: string;
  location: string;
  urgency: string;
  description: string;
  assigned_worker: string | null;
  status: string;
  worker_completed: boolean;
}

interface Worker {
  id: number;
  name: string;
  available: boolean;
}

const AdminDashboard = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const isAdminLoggedIn = localStorage.getItem("isAdminLoggedIn");
    if (isAdminLoggedIn !== "true") {
      navigate("/login/admin");
    } else {
      fetchData();
    }
  }, []);

  const fetchData = async () => {
    setError("");
    try {
      await Promise.all([fetchComplaints(), fetchWorkers()]);
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load data. Please try again.");
    }
  };

  const fetchComplaints = async () => {
    const res = await fetch("http://localhost:5000/api/admin/complaints");
    if (!res.ok) throw new Error("Failed to fetch complaints");
    const data = await res.json();
    setComplaints(data);
  };

  const fetchWorkers = async () => {
    const res = await fetch("http://localhost:5000/api/admin/workers");
    if (!res.ok) throw new Error("Failed to fetch workers");
    const data = await res.json();
    setWorkers(data);
  };

  const assignWorker = async (complaintId: number, workerName: string) => {
    setLoading(true);
    try {
      await fetch("http://localhost:5000/api/admin/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complaintId, workerName }),
      });
      await fetchData();
    } catch (err) {
      console.error("Failed to assign worker:", err);
      setError("Worker assignment failed.");
    } finally {
      setLoading(false);
    }
  };

  const markSuccess = async (complaintId: number) => {
    setLoading(true);
    try {
      await fetch("http://localhost:5000/api/admin/mark-success", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complaintId }),
      });
      await fetchComplaints();
    } catch (err) {
      console.error("Failed to mark success:", err);
      setError("Could not mark as successful.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div
        className="min-h-screen flex items-start justify-center py-10 px-4 bg-no-repeat bg-cover bg-top"
        style={{
          backgroundImage: "url('/heroimage.jpg')",
        }}
      >
        <div className="bg-white bg-opacity-95 p-8 md:p-10 rounded-2xl shadow-2xl w-full max-w-7xl space-y-8">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold text-gray-800">Admin Dashboard</h2>
          </div>

          {error && (
            <div className="text-red-600 bg-red-100 p-3 rounded text-sm">
              {error}
            </div>
          )}

          {/* Complaints Table */}
          <div className="overflow-auto bg-white rounded-lg shadow-inner">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
                <tr>
                  <th className="p-4">ID</th>
                  <th className="p-4">User</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Urgency</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Worker</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => (
                  <tr key={c.id} className="border-b">
                    <td className="p-4 font-medium text-gray-900">{c.id}</td>
                    <td className="p-4">{c.username}</td>
                    <td className="p-4">{c.category}</td>
                    <td className="p-4">{c.location}</td>
                    <td className="p-4">{c.urgency}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          c.status === "Successful"
                            ? "bg-green-100 text-green-700"
                            : c.status === "Assigned"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {c.status}
                      </span>
                      {c.worker_completed && (
                        <span className="text-green-600 ml-2 text-xs">
                          ✅ Worker Done
                        </span>
                      )}
                    </td>
                    <td className="p-4">{c.assigned_worker || "Not assigned"}</td>
                    <td className="p-4 space-y-2">
                      {!c.assigned_worker && workers.length > 0 && (
                        <select
                          onChange={(e) => assignWorker(c.id, e.target.value)}
                          className="w-full border rounded px-2 py-1 text-sm"
                          defaultValue=""
                        >
                          <option value="" disabled>
                            Assign Worker
                          </option>
                          {workers
                            .filter((w) => w.available)
                            .map((w) => (
                              <option key={w.id} value={w.name}>
                                {w.name}
                              </option>
                            ))}
                        </select>
                      )}
                      {c.assigned_worker &&
                        c.worker_completed &&
                        c.status !== "Successful" && (
                          <button
                            onClick={() => markSuccess(c.id)}
                            className="w-full bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded"
                          >
                            Mark Successful
                          </button>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {complaints.length === 0 && !error && (
              <div className="p-4 text-center text-gray-500">
                No complaints available
              </div>
            )}
          </div>

          {/* Workers Table */}
          {workers.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-3">Worker List</h3>
              <div className="overflow-auto bg-white rounded-lg shadow-inner">
                <table className="min-w-full text-sm text-left">
                  <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
                    <tr>
                      <th className="p-4">ID</th>
                      <th className="p-4">Name</th>
                      <th className="p-4">Available</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workers.map((w) => (
                      <tr key={w.id} className="border-b">
                        <td className="p-4 font-medium text-gray-900">{w.id}</td>
                        <td className="p-4">{w.name}</td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              w.available
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {w.available ? "Available" : "Busy"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {loading && (
            <div className="text-blue-600 text-sm animate-pulse">Updating...</div>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;

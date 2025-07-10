import React, { useEffect, useState } from "react";
import Header from "@/components/Header";
import { useNavigate } from "react-router-dom";

interface Complaint {
  id: number;
  username: string;
  category: string;
  location: string;
  urgency: string;
  description: string;
  status: string;
  assigned_worker: string;
  worker_status: string;
}

const WorkerDashboard = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const workerName = localStorage.getItem("workerName") || "";

  useEffect(() => {
    if (!workerName) {
      navigate("/login/worker");
    } else {
      fetchData();
    }
  }, []);

  const fetchData = async () => {
    setError("");
    setLoading(true);
    try {
      await fetchComplaints();
      await fetchAvailability();
    } catch {
      setError("Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

const fetchComplaints = async () => {
  const res = await fetch("http://localhost:5000/api/worker/my-complaints", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: workerName }),
  });

  if (!res.ok) {
    throw new Error("Failed to fetch complaints");
  }

  const data = await res.json();
  setComplaints(data);
};


const fetchAvailability = async () => {
  try {
    // Automatically set worker to available on load
    await fetch("http://localhost:5000/api/worker/auto-enable-availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: workerName }),
    });

    // Then fetch updated availability
    const res = await fetch(`http://localhost:5000/api/admin/workers`);
    const data = await res.json();
    const worker = data.find((w: any) => w.name === workerName);
    if (worker) setIsAvailable(worker.available);
  } catch (err) {
    setError("Failed to fetch or update availability.");
  }
};


  const toggleAvailability = async () => {
    try {
      const newStatus = !isAvailable;
      await fetch("http://localhost:5000/api/worker/set-availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: workerName, available: newStatus }),
      });
      setIsAvailable(newStatus);
    } catch {
      setError("Failed to update availability.");
    }
  };

  const updateStatus = async (complaintId: number, action: string) => {
    setLoading(true);
    try {
      await fetch(`http://localhost:5000/api/worker/update-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complaintId, action }),
      });
      fetchComplaints();
    } catch {
      setError("Failed to update complaint status.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-no-repeat bg-cover bg-top py-10 px-4" style={{ backgroundImage: "url('/heroimage.jpg')" }}>
        <div className="bg-white bg-opacity-90 p-6 rounded-xl shadow-lg max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Worker Dashboard</h2>

          <div className="mb-4 flex justify-between items-center">
            <p className="text-gray-700">
              Availability:{" "}
              <span className={`font-semibold ${isAvailable ? "text-green-600" : "text-red-600"}`}>
                {isAvailable ? "Available" : "Unavailable"}
              </span>
            </p>
            <button
              onClick={toggleAvailability}
              className={`px-4 py-1 rounded text-white text-sm ${isAvailable ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}
            >
              Set {isAvailable ? "Unavailable" : "Available"}
            </button>
          </div>

          {error && <div className="text-red-600 mb-4">{error}</div>}

          {complaints.length === 0 ? (
            <p className="text-gray-600 text-center">No tasks assigned to you.</p>
          ) : (
            <table className="min-w-full text-sm text-left bg-white border rounded-md shadow">
              <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
                <tr>
                  <th className="p-4">ID</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Urgency</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => (
                  <tr key={c.id} className="border-b">
                    <td className="p-4 font-medium">{c.id}</td>
                    <td className="p-4">{c.category}</td>
                    <td className="p-4">{c.location}</td>
                    <td className="p-4">{c.urgency}</td>
                    <td className="p-4">{c.worker_status}</td>
                    <td className="p-4 space-y-2">
                      {c.worker_status === "Pending" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateStatus(c.id, "accept")}
                            className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => updateStatus(c.id, "reject")}
                            className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {c.worker_status === "Accepted" && (
                        <button
                          onClick={() => updateStatus(c.id, "done")}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                        >
                          Mark as Done
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {loading && <div className="mt-4 text-blue-600 text-sm animate-pulse">Updating...</div>}
        </div>
      </div>
    </>
  );
};

export default WorkerDashboard;

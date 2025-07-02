import React, { useState, useEffect } from "react";

const Form = () => {
  const [formData, setFormData] = useState({
    username: "",
    category: "Electrical",
    location: "",
    landmark: "",
    urgency: "Normal",
    description: ""
  });

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setFormData((prev) => ({ ...prev, username: storedUsername }));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch("http://localhost:5000/api/complaints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });

    const data = await res.json();
    if (res.ok) {
      alert("✅ Complaint submitted successfully!");
      setFormData({
        username: formData.username,
        category: "Electrical",
        location: "",
        landmark: "",
        urgency: "Normal",
        description: ""
      });
    } else {
      alert("❌ Failed to submit complaint: " + data.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-50 to-indigo-100 flex items-center justify-center py-10 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 md:p-12 rounded-2xl shadow-2xl w-full max-w-3xl space-y-6"
      >
        <h2 className="text-3xl font-bold text-center text-gray-800">Submit a Complaint</h2>

        {/* Username (autofilled) */}
        <input
          type="text"
          name="username"
          value={formData.username}
          readOnly
          className="w-full border p-3 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
        />

        {/* Category */}
        <div>
          <label className="block text-gray-700 font-medium mb-1">Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full border p-3 rounded-lg"
          >
            <option value="Electrical">Electrical</option>
            <option value="Water">Water Leakage</option>
            <option value="Roads">Roads</option>
            <option value="Sanitation">Sanitation</option>
          </select>
        </div>

        {/* Location */}
        <div>
          <label className="block text-gray-700 font-medium mb-1">Location in Base</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="e.g. Block A, Room 105"
            className="w-full border p-3 rounded-lg"
            required
          />
        </div>

        {/* Landmark */}
        <div>
          <label className="block text-gray-700 font-medium mb-1">Nearby Landmark</label>
          <input
            type="text"
            name="landmark"
            value={formData.landmark}
            onChange={handleChange}
            placeholder="e.g. Near mess hall"
            className="w-full border p-3 rounded-lg"
          />
        </div>

        {/* Urgency */}
        <div>
          <label className="block text-gray-700 font-medium mb-1">Urgency</label>
          <div className="flex gap-6">
            {["Urgent", "Moderate", "Normal"].map((level) => (
              <label key={level} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="urgency"
                  value={level}
                  checked={formData.urgency === level}
                  onChange={handleChange}
                  className="accent-blue-600"
                />
                {level}
              </label>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-gray-700 font-medium mb-1">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe the issue in detail..."
            className="w-full border p-3 rounded-lg"
            rows={4}
            required
          ></textarea>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Submit Complaint
        </button>
      </form>
    </div>
  );
};

export default Form;

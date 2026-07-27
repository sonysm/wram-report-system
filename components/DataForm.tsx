import { useState } from "react";

export default function DataForm({ departmentId }: { departmentId: number }) {
  const [category, setCategory] = useState("");
  const [value, setValue] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, value, departmentId }),
    });
    if (res.ok) {
      setMessage("Entry saved!");
      setCategory("");
      setValue("");
    } else {
      setMessage("Error saving entry.");
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 400 }}>
      <input
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        placeholder="Category"
        required
      />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Value"
        type="number"
        required
      />
      <button type="submit">Save</button>
      {message && <p>{message}</p>}
    </form>
  );
}

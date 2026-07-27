import { useEffect, useState } from "react";

interface ReportRow {
  departmentId: number;
  category: string;
  _sum: { value: number | null };
}

export default function ReportTable() {
  const [data, setData] = useState<ReportRow[]>([]);

  useEffect(() => {
    fetch("/api/reports")
      .then((res) => res.json())
      .then(setData);
  }, []);

  return (
    <table style={{ borderCollapse: "collapse", width: "100%" }}>
      <thead>
        <tr style={{ background: "#f0f0f0" }}>
          <th style={{ padding: "8px 12px", border: "1px solid #ccc" }}>Department ID</th>
          <th style={{ padding: "8px 12px", border: "1px solid #ccc" }}>Category</th>
          <th style={{ padding: "8px 12px", border: "1px solid #ccc" }}>Total</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i}>
            <td style={{ padding: "8px 12px", border: "1px solid #ccc" }}>{row.departmentId}</td>
            <td style={{ padding: "8px 12px", border: "1px solid #ccc" }}>{row.category}</td>
            <td style={{ padding: "8px 12px", border: "1px solid #ccc" }}>{row._sum.value ?? 0}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

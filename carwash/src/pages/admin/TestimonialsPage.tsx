import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { LoadingSpinner } from '../../components/Shared';

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.getTestimonials()
      .then(r => setTestimonials(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await apiClient.deleteTestimonial(id);
      setTestimonials(testimonials.filter(t => t.id !== id));
    } catch (e) {
      alert("Error deleting testimonial");
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h2>Testimonials</h2>
      <div className="table-responsive" style={{ marginTop: 20 }}>
        <table className="data-table mobile-cards">
          <thead>
            <tr>
              <th>Name</th>
              <th>Rating</th>
              <th>Text</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {testimonials.map(t => (
              <tr key={t.id}>
                <td data-label="Name">{t.name}</td>
                <td data-label="Rating">{t.rating}/5</td>
                <td data-label="Text">{t.text}</td>
                <td data-label="Actions">
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(t.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

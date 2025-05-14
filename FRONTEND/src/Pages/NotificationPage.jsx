import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const NotificationPage = ({ userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`http://localhost:8080/api/notifications?userId=${userId}`);
      setNotifications(res.data);
    } catch (error) {
      console.error("Error fetching notifications", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id, notification) => {
    try {
      await axios.put(`http://localhost:8080/api/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );

      if (notification.type === "comment") {
        navigate(`/comments/${notification.relatedPostId}`);
      } else if (notification.type === "like") {
        navigate(`/posts/${notification.relatedPostId}`);
      }
    } catch (error) {
      console.error("Error marking as read", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const filteredNotifications = notifications.filter((notif) =>
    notif.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="text-center mt-10 text-gray-500">Loading notifications...</div>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Notifications</h1>

      

      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <p className="text-gray-600">No matching notifications found.</p>
        ) : (
          filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 rounded-lg shadow-md cursor-pointer flex justify-between items-center transition duration-150 ${
                notif.read ? "bg-gray-100" : "bg-blue-100 border-l-4 border-blue-500 hover:bg-blue-200"
              }`}
              onClick={() => markAsRead(notif.id, notif)}
            >
              <div>
                <p className={`text-gray-800 ${!notif.read ? "font-semibold" : ""}`}>
                  {notif.message}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(notif.createdAt).toLocaleString()}
                </p>
              </div>
              {!notif.read && (
                <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full ml-4">
                  NEW
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationPage;

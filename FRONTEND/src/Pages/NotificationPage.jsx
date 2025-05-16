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



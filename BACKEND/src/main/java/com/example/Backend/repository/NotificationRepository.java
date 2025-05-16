package com.example.Backend.repository;

import com.example.Backend.model.Notification;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface NotificationRepository extends MongoRepository<Notification, String> {

    // Fetch all notifications for a specific user, sorted by newest first
    List<Notification> findByUserIdOrderByCreatedAtDesc(String userId);

    // Fetch all unread notifications for a specific user
    List<Notification> findByUserIdAndReadFalse(String userId);
}

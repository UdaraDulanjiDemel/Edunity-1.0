package com.example.Backend.service;

import com.example.Backend.model.Notification;
import com.example.Backend.model.User;
import com.example.Backend.repository.NotificationRepository;
import com.example.Backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    public void createLikeNotification(String postId, String postOwnerId, String triggerUserId) {
        User triggerUser = userRepository.findById(triggerUserId)
                .orElseThrow(() -> new RuntimeException("Trigger user not found"));
        String message = triggerUser.getName() + " liked your post.";
        Notification notification = new Notification(postOwnerId, "LIKE", postId, triggerUserId, message);
        notificationRepository.save(notification);
    }


/